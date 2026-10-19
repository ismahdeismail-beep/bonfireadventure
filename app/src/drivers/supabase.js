/**
 * Supabase storage driver — talks to PostgREST over plain `fetch`, so the app
 * keeps its zero-npm-dependency property.
 *
 * Security: this driver authenticates with the **service_role** key, which
 * bypasses Row Level Security. It must only ever run on the server. The anon
 * key is exposed to nobody here; the browser never talks to Supabase directly.
 *
 * Every table is namespaced `bonfire_*` because the Supabase project is shared
 * with other work (see app/README.md).
 */
import { config } from '../config.js';

const REST = `${config.supabaseUrl}/rest/v1`;
const TIMEOUT_MS = 10_000;

/* A mobile connection drops packets; a single retry turns most blips into a
 * slightly slower page instead of a 500. Only replay requests that are safe to
 * repeat — a POST that times out may already have been applied upstream. */
const SAFE_TO_RETRY = new Set(['GET', 'HEAD', 'PATCH', 'DELETE']);
const RETRY_DELAY_MS = 300;

const USERS = 'bonfire_users';
const SESSIONS = 'bonfire_sessions';
const RESET = 'bonfire_reset_tokens';
const BOOKINGS = 'bonfire_bookings';

const enc = encodeURIComponent;

function headers(prefer) {
  const h = {
    apikey: config.supabaseServiceKey,
    Authorization: `Bearer ${config.supabaseServiceKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (prefer) h.Prefer = prefer;
  return h;
}

async function rest(path, { method = 'GET', body, prefer } = {}) {
  const attempts = SAFE_TO_RETRY.has(method) ? 2 : 1;

  for (let attempt = 1; ; attempt += 1) {
    let res;
    try {
      res = await fetch(`${REST}/${path}`, {
        method,
        headers: headers(prefer),
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (cause) {
      // Network-level failure (DNS, reset, abort). Retry once if it is safe.
      if (attempt < attempts) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      throw new Error(`Supabase unreachable (${method} ${path}): ${cause.message}`);
    }

    const text = await res.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }
    if (!res.ok) {
      const detail = (data && (data.message || data.hint || data.details)) || `${res.status} ${res.statusText}`;
      const err = new Error(`Supabase ${method} ${path}: ${detail}`);
      err.status = res.status;
      err.code = data && data.code;
      throw err;
    }
    return data;
  }
}

/* ------------------------------------------------------------------- mappers */

const toUser = (r) => (r ? {
  id: r.id,
  handle: r.handle,
  name: r.name,
  role: r.role,
  passwordHash: r.password_hash,
  consentAt: r.consent_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
} : null);

const toSession = (r) => (r ? {
  id: r.id,
  userId: r.user_id,
  csrf: r.csrf,
  createdAt: Date.parse(r.created_at),
  expiresAt: Date.parse(r.expires_at),
} : null);

const toReset = (r) => (r ? {
  token: r.token,
  userId: r.user_id,
  used: r.used,
  expiresAt: Date.parse(r.expires_at),
} : null);

const toBooking = (r) => (r ? {
  id: r.id,
  ref: r.ref,
  userId: r.user_id,
  travellerName: r.traveller_name,
  forSelf: r.for_self,
  packageId: r.package_id,
  packageTitle: r.package_title,
  optionId: r.option_id,
  optionLabel: r.option_label,
  startDate: r.start_date,
  travellers: r.travellers,
  extras: r.extras,
  currency: r.currency,
  total: r.total,
  deposit: r.deposit,
  balance: r.balance,
  status: r.status,
  paymentStatus: r.payment_status,
  history: r.history,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
} : null);

/* --------------------------------------------------------------------- users */

export async function getUserById(id) {
  if (!id) return null;
  const rows = await rest(`${USERS}?id=eq.${enc(id)}&select=*&limit=1`);
  return toUser(rows && rows[0]);
}

export async function getUserByHandle(handle) {
  const h = String(handle || '').toLowerCase();
  if (!h) return null;
  const rows = await rest(`${USERS}?handle=eq.${enc(h)}&select=*&limit=1`);
  return toUser(rows && rows[0]);
}

export async function insertUser(u) {
  const rows = await rest(USERS, {
    method: 'POST',
    prefer: 'return=representation',
    body: [{
      id: u.id,
      handle: u.handle,
      name: u.name,
      role: u.role,
      password_hash: u.passwordHash,
      consent_at: u.consentAt ?? null,
      created_at: u.createdAt ?? new Date().toISOString(),
      updated_at: u.updatedAt ?? new Date().toISOString(),
    }],
  });
  return toUser(rows && rows[0]);
}

export async function updateUser(id, patch) {
  const body = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) body.name = patch.name;
  if (patch.passwordHash !== undefined) body.password_hash = patch.passwordHash;
  if (patch.consentAt !== undefined) body.consent_at = patch.consentAt;
  const rows = await rest(`${USERS}?id=eq.${enc(id)}`, {
    method: 'PATCH', prefer: 'return=representation', body,
  });
  return toUser(rows && rows[0]);
}

/* ------------------------------------------------------------------ sessions */

export async function insertSession(s) {
  await rest(SESSIONS, {
    method: 'POST',
    prefer: 'return=minimal',
    body: [{
      id: s.id,
      user_id: s.userId ?? null,
      csrf: s.csrf,
      created_at: new Date(s.createdAt).toISOString(),
      expires_at: new Date(s.expiresAt).toISOString(),
    }],
  });
  return s;
}

export async function getSession(id) {
  if (!id) return null;
  const rows = await rest(`${SESSIONS}?id=eq.${enc(id)}&select=*&limit=1`);
  return toSession(rows && rows[0]);
}

export async function deleteSession(id) {
  await rest(`${SESSIONS}?id=eq.${enc(id)}`, { method: 'DELETE', prefer: 'return=minimal' });
}

export async function deleteSessionsForUser(userId) {
  if (!userId) return;
  await rest(`${SESSIONS}?user_id=eq.${enc(userId)}`, { method: 'DELETE', prefer: 'return=minimal' });
}

/** Sign out every other device after a password change, keeping the current one. */
export async function deleteSessionsForUserExcept(userId, keepId) {
  if (!userId) return;
  await rest(`${SESSIONS}?user_id=eq.${enc(userId)}${keepId ? `&id=neq.${enc(keepId)}` : ''}`, {
    method: 'DELETE',
    prefer: 'return=minimal',
  });
}

export async function pruneSessions(nowMs = Date.now()) {
  const cutoff = enc(new Date(nowMs).toISOString());
  await rest(`${SESSIONS}?expires_at=lt.${cutoff}`, { method: 'DELETE', prefer: 'return=minimal' });
}

/* -------------------------------------------------------------- reset tokens */

export async function insertResetToken(rec) {
  await rest(RESET, {
    method: 'POST',
    prefer: 'return=minimal',
    body: [{
      token: rec.token,
      user_id: rec.userId,
      expires_at: new Date(rec.expiresAt).toISOString(),
      used: false,
    }],
  });
  return rec;
}

export async function getResetToken(token) {
  if (!token) return null;
  const rows = await rest(`${RESET}?token=eq.${enc(token)}&select=*&limit=1`);
  return toReset(rows && rows[0]);
}

export async function markResetTokenUsed(token) {
  await rest(`${RESET}?token=eq.${enc(token)}`, {
    method: 'PATCH', prefer: 'return=minimal', body: { used: true },
  });
}

/* ------------------------------------------------------------------ bookings */

const bookingColumns = (b) => ({
  id: b.id,
  ref: b.ref,
  user_id: b.userId ?? null,
  traveller_name: b.travellerName,
  for_self: Boolean(b.forSelf),
  package_id: b.packageId,
  package_title: b.packageTitle,
  option_id: b.optionId ?? null,
  option_label: b.optionLabel ?? null,
  start_date: b.startDate,
  travellers: b.travellers ?? {},
  extras: b.extras ?? [],
  currency: b.currency,
  total: b.total,
  deposit: b.deposit,
  balance: b.balance,
  status: b.status,
  payment_status: b.paymentStatus,
  history: b.history ?? [],
  updated_at: b.updatedAt ?? new Date().toISOString(),
});

export async function insertBooking(b) {
  const rows = await rest(BOOKINGS, {
    method: 'POST',
    prefer: 'return=representation',
    body: [{ ...bookingColumns(b), created_at: b.createdAt ?? new Date().toISOString() }],
  });
  return toBooking(rows && rows[0]);
}

export async function getBookingByRef(ref) {
  const r = String(ref || '').toUpperCase();
  if (!r) return null;
  const rows = await rest(`${BOOKINGS}?ref=eq.${enc(r)}&select=*&limit=1`);
  return toBooking(rows && rows[0]);
}

export async function getBookingById(id) {
  if (!id) return null;
  const rows = await rest(`${BOOKINGS}?id=eq.${enc(id)}&select=*&limit=1`);
  return toBooking(rows && rows[0]);
}

export async function listBookingsForUser(userId) {
  if (!userId) return [];
  const rows = await rest(`${BOOKINGS}?user_id=eq.${enc(userId)}&select=*&order=created_at.desc`);
  return (rows || []).map(toBooking);
}

export async function listAllBookings() {
  const rows = await rest(`${BOOKINGS}?select=*&order=created_at.desc`);
  return (rows || []).map(toBooking);
}

export async function updateBooking(id, patch) {
  const body = { updated_at: patch.updatedAt ?? new Date().toISOString() };
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.paymentStatus !== undefined) body.payment_status = patch.paymentStatus;
  if (patch.history !== undefined) body.history = patch.history;
  if (patch.travellerName !== undefined) body.traveller_name = patch.travellerName;
  const rows = await rest(`${BOOKINGS}?id=eq.${enc(id)}`, {
    method: 'PATCH', prefer: 'return=representation', body,
  });
  return toBooking(rows && rows[0]);
}

/** R3.7 — expire stale, unconfirmed reservations. Returns how many changed. */
export async function sweepExpiredReservations(ttlMs) {
  const cutoff = enc(new Date(Date.now() - ttlMs).toISOString());
  const rows = await rest(`${BOOKINGS}?status=eq.reserved&created_at=lt.${cutoff}&select=*`);
  let changed = 0;
  for (const row of rows || []) {
    const b = toBooking(row);
    const at = new Date().toISOString();
    await updateBooking(b.id, {
      status: 'expired',
      updatedAt: at,
      history: [...(b.history || []), { at, status: 'expired', by: 'system' }],
    });
    changed += 1;
  }
  return changed;
}

/* --------------------------------------------------------------- maintenance */

export async function ping() {
  await rest(`${USERS}?select=id&limit=1`);
  return true;
}

/** Test/dev helper — clears every bonfire_* row. Only touches our tables. */
export async function resetStore() {
  // Children first (they reference bonfire_users by FK).
  const targets = [
    [SESSIONS, 'id=not.is.null'],
    [RESET, 'token=not.is.null'],
    [BOOKINGS, 'id=not.is.null'],
    [USERS, 'id=not.is.null'],
  ];
  for (const [table, where] of targets) {
    await rest(`${table}?${where}`, { method: 'DELETE', prefer: 'return=minimal' });
  }
}
