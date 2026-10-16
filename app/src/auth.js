import { config } from './config.js';
import {
  getSession as readSession, insertSession, deleteSession, deleteSessionsForUser,
  deleteSessionsForUserExcept,
  getUserById, getUserByHandle, insertUser, updateUser, newId,
  insertResetToken, getResetToken, markResetTokenUsed, pruneSessions,
} from './db.js';
import { hashPassword, verifyPassword, randomToken } from './password.js';
import { parseCookies } from './http.js';

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
export async function createSession(res, userId) {
  const sid = randomToken(32);
  const now = Date.now();
  await insertSession({
    id: sid,
    userId,
    csrf: randomToken(16),
    createdAt: now,
    expiresAt: now + config.sessionTtlMs,
  });
  await pruneSessions();
  res.setHeader('Set-Cookie', cookieHeader(sid, Math.floor(config.sessionTtlMs / 1000)));
  return sid;
}

export async function destroySession(req, res) {
  const sid = parseCookies(req)[COOKIE];
  if (sid) await deleteSession(sid);
  res.setHeader('Set-Cookie', cookieHeader('', 0));
}

export async function getSession(req) {
  const sid = parseCookies(req)[COOKIE];
  if (!sid) return null;
  const session = await readSession(sid);
  if (!session || session.expiresAt < Date.now()) return null;
  return { sid, session };
}

/**
 * Give every visitor (including anonymous ones) a session so forms can carry a
 * CSRF token. A subsequent login replaces the cookie with a fresh session id.
 */
export async function ensureSession(req, res) {
  const found = await getSession(req);
  if (found) return found.session;
  const sid = randomToken(32);
  const now = Date.now();
  const session = {
    id: sid,
    userId: null,
    csrf: randomToken(16),
    createdAt: now,
    expiresAt: now + config.sessionTtlMs,
  };
  await insertSession(session);
  res.setHeader('Set-Cookie', cookieHeader(sid, Math.floor(config.sessionTtlMs / 1000)));
  return session;
}

/**
 * One lookup per request: resolves (and if needed creates) the session, then the
 * signed-in user, memoised on `req` so downstream helpers do not re-query.
 */
export async function context(req, res) {
  if (req._bfContext) return req._bfContext;
  const session = await ensureSession(req, res);
  const user = session.userId ? await getUserById(session.userId) : null;
  req._bfContext = { session, user };
  return req._bfContext;
}

export function csrfFor(ctx) {
  return ctx?.session?.csrf || '';
}

export function verifyCsrf(ctx, token) {
  const expected = ctx?.session?.csrf;
  if (!expected) return false;
  return typeof token === 'string' && token.length > 0 && token === expected;
}

/* ---------------------------------------------------------------------- users */

export async function findUser(handle) {
  return getUserByHandle(handle);
}

export function validateHandle(handle) {
  return /^[a-z0-9._-]{3,32}$/.test(String(handle || '').toLowerCase());
}

export function validatePassword(password) {
  return typeof password === 'string' && password.length >= 10;
}

export async function registerUser({ handle, name, password, consent }) {
  const h = String(handle || '').toLowerCase().trim();
  const errors = [];
  if (!validateHandle(h)) errors.push('Handle must be 3–32 characters: letters, numbers, dot, dash or underscore.');
  if (!name || String(name).trim().length < 2) errors.push('Please enter your name.');
  if (!validatePassword(password)) errors.push('Password must be at least 10 characters.');
  if (!consent) errors.push('Please accept the data-use consent to create an account.');
  if (errors.length) return { ok: false, errors };
  if (await findUser(h)) return { ok: false, errors: ['That handle is already taken.'] };

  const now = new Date().toISOString();
  try {
    const user = await insertUser({
      id: newId(),
      handle: h,
      name: String(name).trim().slice(0, 80),
      role: 'customer',
      passwordHash: hashPassword(password),
      consentAt: now,
      createdAt: now,
      updatedAt: now,
    });
    return { ok: true, user };
  } catch (error) {
    // Race between the existence check and the insert (unique violation).
    if (error.code === '23505' || error.status === 409) {
      return { ok: false, errors: ['That handle is already taken.'] };
    }
    throw error;
  }
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
export async function attemptLogin(req, handle, password) {
  if (isRateLimited(req, handle)) {
    return { ok: false, error: 'Too many attempts. Please try again shortly.' };
  }
  const user = await findUser(handle);
  const valid = user ? verifyPassword(password, user.passwordHash) : false;
  if (!valid) {
    recordFailure(req, handle);
    return { ok: false, error: 'Incorrect handle or password.' };
  }
  clearFailures(req, handle);
  return { ok: true, user };
}

/* ------------------------------------------------------------ password reset */

export async function createResetToken(handle) {
  const user = await findUser(handle);
  if (!user) return { ok: true, token: null }; // do not reveal existence (R4.11)
  const token = randomToken(24);
  const expiresAt = Date.now() + config.resetTtlMs;
  await insertResetToken({ token, userId: user.id, expiresAt });
  return { ok: true, token };
}

export async function consumeResetToken(token, newPassword) {
  const rec = await getResetToken(token);
  if (!rec) return { ok: false, error: 'This reset link is invalid.' };
  if (rec.used) return { ok: false, error: 'This reset link has already been used.' };
  if (rec.expiresAt < Date.now()) return { ok: false, error: 'This reset link has expired.' };
  if (!validatePassword(newPassword)) return { ok: false, error: 'Password must be at least 10 characters.' };

  const user = await getUserById(rec.userId);
  if (!user) return { ok: false, error: 'Account not found.' };

  await updateUser(user.id, { passwordHash: hashPassword(newPassword) });
  await markResetTokenUsed(token);      // single-use
  await deleteSessionsForUser(user.id); // invalidate every existing session
  return { ok: true, user: { ...user, passwordHash: undefined } };
}

/**
 * Change the password of the signed-in user. Unlike the reset flow this keeps
 * the current session alive and only signs out *other* devices.
 */
export async function changeOwnPassword(userId, currentPassword, newPassword, keepSessionId) {
  const user = await getUserById(userId);
  if (!user) return { ok: false, error: 'Account not found.' };
  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return { ok: false, error: 'Your current password is not correct.' };
  }
  if (!validatePassword(newPassword)) {
    return { ok: false, error: 'New password must be at least 10 characters.' };
  }
  if (verifyPassword(newPassword, user.passwordHash)) {
    return { ok: false, error: 'Please choose a password you have not used here before.' };
  }
  await updateUser(userId, { passwordHash: hashPassword(newPassword) });
  await deleteSessionsForUserExcept(userId, keepSessionId);
  return { ok: true };
}
