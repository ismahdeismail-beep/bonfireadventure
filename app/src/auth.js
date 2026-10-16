import { config } from './config.js';
import { db, save } from './store.js';
import { hashPassword, verifyPassword, randomToken } from './password.js';
import { parseCookies, uid } from './http.js';

const COOKIE = 'bf_sid';
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 5;
const failures = new Map(); // key -> { count, firstAt }

/* ------------------------------------------------------------------ sessions */

function cookieHeader(sid, maxAgeSec) {
  const parts = [`${COOKIE}=${sid}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAgeSec}`];
  if (config.isProd) parts.push('Secure');
  return parts.join('; ');
}

/**
 * R4.8 — a brand-new session id is issued on every login (regenerate to prevent
 * session fixation).
 */
export function createSession(res, userId) {
  const sid = randomToken(32);
  db.sessions[sid] = {
    userId,
    csrf: randomToken(16),
    createdAt: Date.now(),
    expiresAt: Date.now() + config.sessionTtlMs,
  };
  pruneSessions();
  save();
  res.setHeader('Set-Cookie', cookieHeader(sid, Math.floor(config.sessionTtlMs / 1000)));
  return sid;
}

export function destroySession(req, res) {
  const sid = parseCookies(req)[COOKIE];
  if (sid && db.sessions[sid]) {
    delete db.sessions[sid];
    save();
  }
  res.setHeader('Set-Cookie', cookieHeader('', 0));
}

function pruneSessions() {
  const now = Date.now();
  for (const [sid, s] of Object.entries(db.sessions)) {
    if (s.expiresAt < now) delete db.sessions[sid];
  }
}

export function getSession(req) {
  const sid = parseCookies(req)[COOKIE];
  if (!sid) return null;
  const session = db.sessions[sid];
  if (!session || session.expiresAt < Date.now()) return null;
  return { sid, session };
}

/**
 * Give every visitor (including anonymous ones) a session so forms can carry a
 * CSRF token. A subsequent login replaces the cookie with a fresh session id.
 */
export function ensureSession(req, res) {
  const found = getSession(req);
  if (found) return found.session;
  const sid = randomToken(32);
  db.sessions[sid] = {
    userId: null,
    csrf: randomToken(16),
    createdAt: Date.now(),
    expiresAt: Date.now() + config.sessionTtlMs,
  };
  save();
  res.setHeader('Set-Cookie', cookieHeader(sid, Math.floor(config.sessionTtlMs / 1000)));
  return db.sessions[sid];
}

export function currentUser(req) {
  const found = getSession(req);
  if (!found) return null;
  return db.users.find((u) => u.id === found.session.userId) || null;
}

export function csrfFor(req) {
  const found = getSession(req);
  return found?.session?.csrf || '';
}

export function verifyCsrf(req, token) {
  const found = getSession(req);
  if (!found) return false;
  return typeof token === 'string' && token.length > 0 && token === found.session.csrf;
}

/* ---------------------------------------------------------------------- users */

export function findUser(handle) {
  return db.users.find((u) => u.handle === String(handle || '').toLowerCase()) || null;
}

export function validateHandle(handle) {
  return /^[a-z0-9._-]{3,32}$/.test(String(handle || '').toLowerCase());
}

export function validatePassword(password) {
  return typeof password === 'string' && password.length >= 10;
}

export function registerUser({ handle, name, password, consent }) {
  const h = String(handle || '').toLowerCase().trim();
  const errors = [];
  if (!validateHandle(h)) errors.push('Handle must be 3–32 characters: letters, numbers, dot, dash or underscore.');
  if (!name || String(name).trim().length < 2) errors.push('Please enter your name.');
  if (!validatePassword(password)) errors.push('Password must be at least 10 characters.');
  if (!consent) errors.push('Please accept the data-use consent to create an account.');
  if (errors.length) return { ok: false, errors };
  if (findUser(h)) return { ok: false, errors: ['That handle is already taken.'] };

  const user = {
    id: uid(8),
    handle: h,
    name: String(name).trim().slice(0, 80),
    role: 'customer',
    passwordHash: hashPassword(password),
    consentAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  save();
  return { ok: true, user };
}

/* --------------------------------------------------------------- login limits */

function rateKey(req, handle) {
  const ip = req.socket.remoteAddress || 'unknown';
  return `${ip}:${String(handle || '').toLowerCase()}`;
}

export function isRateLimited(req, handle) {
  const rec = failures.get(rateKey(req, handle));
  if (!rec) return false;
  if (Date.now() - rec.firstAt > LOGIN_WINDOW_MS) {
    failures.delete(rateKey(req, handle));
    return false;
  }
  return rec.count >= LOGIN_MAX_FAILURES;
}

function recordFailure(req, handle) {
  const key = rateKey(req, handle);
  const rec = failures.get(key);
  if (!rec || Date.now() - rec.firstAt > LOGIN_WINDOW_MS) {
    failures.set(key, { count: 1, firstAt: Date.now() });
  } else {
    rec.count += 1;
  }
}

function clearFailures(req, handle) {
  failures.delete(rateKey(req, handle));
}

/**
 * R4.6 (brute-force throttling) + R4.11 (no account-existence leakage).
 */
export function attemptLogin(req, handle, password) {
  if (isRateLimited(req, handle)) {
    return { ok: false, error: 'Too many attempts. Please try again shortly.' };
  }
  const user = findUser(handle);
  const valid = user ? verifyPassword(password, user.passwordHash) : false;
  if (!valid) {
    recordFailure(req, handle);
    return { ok: false, error: 'Incorrect handle or password.' };
  }
  clearFailures(req, handle);
  return { ok: true, user };
}

/* ------------------------------------------------------------ password reset */

export function createResetToken(handle) {
  const user = findUser(handle);
  if (!user) return { ok: true, token: null }; // do not reveal existence (R4.11)
  const token = randomToken(24);
  db.resetTokens[token] = {
    userId: user.id,
    expiresAt: Date.now() + config.resetTtlMs,
    used: false,
  };
  save();
  return { ok: true, token };
}

export function consumeResetToken(token, newPassword) {
  const rec = db.resetTokens[token];
  if (!rec) return { ok: false, error: 'This reset link is invalid.' };
  if (rec.used) return { ok: false, error: 'This reset link has already been used.' };
  if (rec.expiresAt < Date.now()) return { ok: false, error: 'This reset link has expired.' };
  if (!validatePassword(newPassword)) return { ok: false, error: 'Password must be at least 10 characters.' };

  const user = db.users.find((u) => u.id === rec.userId);
  if (!user) return { ok: false, error: 'Account not found.' };
  user.passwordHash = hashPassword(newPassword);
  rec.used = true; // single-use
  // Invalidate all existing sessions for this user.
  for (const [sid, s] of Object.entries(db.sessions)) {
    if (s.userId === user.id) delete db.sessions[sid];
  }
  save();
  return { ok: true, user };
}
