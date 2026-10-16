/**
 * JSON-file storage driver — the offline fallback.
 *
 * Used automatically when Supabase is not configured, so anyone can clone the
 * repo and run it with no secrets and no database. Same async interface as the
 * Supabase driver (src/drivers/supabase.js) so the rest of the app never knows
 * which one is active.
 *
 * Not for production: single-process only, whole-file rewrites.
 */
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

let state = null;

function load() {
  if (state) return state;
  try {
    state = JSON.parse(fs.readFileSync(config.dataFile, 'utf8'));
  } catch {
    state = null;
  }
  if (!state || typeof state !== 'object') state = {};
  state.users ||= [];
  state.sessions ||= [];
  state.resetTokens ||= [];
  state.bookings ||= [];
  return state;
}

function persist() {
  const dir = path.dirname(config.dataFile);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${config.dataFile}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, config.dataFile);
}

/* --------------------------------------------------------------------- users */

export async function getUserById(id) {
  if (!id) return null;
  return load().users.find((u) => u.id === id) || null;
}

export async function getUserByHandle(handle) {
  const h = String(handle || '').toLowerCase();
  if (!h) return null;
  return load().users.find((u) => u.handle === h) || null;
}

export async function insertUser(u) {
  const s = load();
  s.users.push(u);
  persist();
  return u;
}

export async function updateUser(id, patch) {
  const s = load();
  const user = s.users.find((u) => u.id === id);
  if (!user) return null;
  Object.assign(user, patch, { updatedAt: new Date().toISOString() });
  persist();
  return user;
}

/* ------------------------------------------------------------------ sessions */

export async function insertSession(rec) {
  const s = load();
  s.sessions.push(rec);
  persist();
  return rec;
}

export async function getSession(id) {
  if (!id) return null;
  const rec = load().sessions.find((x) => x.id === id);
  if (!rec || rec.expiresAt < Date.now()) return null;
  return rec;
}

export async function deleteSession(id) {
  const s = load();
  s.sessions = s.sessions.filter((x) => x.id !== id);
  persist();
}

export async function deleteSessionsForUser(userId) {
  if (!userId) return;
  const s = load();
  s.sessions = s.sessions.filter((x) => x.userId !== userId);
  persist();
}

/** Sign out every other device after a password change, keeping the current one. */
export async function deleteSessionsForUserExcept(userId, keepId) {
  if (!userId) return;
  const s = load();
  s.sessions = s.sessions.filter((x) => x.userId !== userId || x.id === keepId);
  persist();
}

export async function pruneSessions(nowMs = Date.now()) {
  const s = load();
  s.sessions = s.sessions.filter((x) => x.expiresAt >= nowMs);
  persist();
}

/* -------------------------------------------------------------- reset tokens */

export async function insertResetToken(rec) {
  const s = load();
  s.resetTokens.push({ ...rec, used: false });
  persist();
  return rec;
}

export async function getResetToken(token) {
  if (!token) return null;
  return load().resetTokens.find((x) => x.token === token) || null;
}

export async function markResetTokenUsed(token) {
  const s = load();
  const rec = s.resetTokens.find((x) => x.token === token);
  if (rec) {
    rec.used = true;
    persist();
  }
}

/* ------------------------------------------------------------------ bookings */

export async function insertBooking(b) {
  const s = load();
  s.bookings.push(b);
  persist();
  return b;
}

export async function getBookingByRef(ref) {
  const r = String(ref || '').toUpperCase();
  if (!r) return null;
  return load().bookings.find((b) => b.ref === r) || null;
}

export async function getBookingById(id) {
  if (!id) return null;
  return load().bookings.find((b) => b.id === id) || null;
}

export async function listBookingsForUser(userId) {
  if (!userId) return [];
  return load().bookings
    .filter((b) => b.userId === userId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function listAllBookings() {
  return [...load().bookings].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function updateBooking(id, patch) {
  const s = load();
  const b = s.bookings.find((x) => x.id === id);
  if (!b) return null;
  Object.assign(b, patch, { updatedAt: patch.updatedAt || new Date().toISOString() });
  persist();
  return b;
}

export async function sweepExpiredReservations(ttlMs) {
  const s = load();
  const now = Date.now();
  let changed = 0;
  for (const b of s.bookings) {
    if (b.status === 'reserved' && now - Date.parse(b.createdAt) > ttlMs) {
      const at = new Date().toISOString();
      b.status = 'expired';
      b.updatedAt = at;
      b.history = [...(b.history || []), { at, status: 'expired', by: 'system' }];
      changed += 1;
    }
  }
  if (changed) persist();
  return changed;
}

/* --------------------------------------------------------------- maintenance */

export async function ping() {
  load();
  return true;
}

export async function resetStore() {
  state = { users: [], sessions: [], resetTokens: [], bookings: [] };
  persist();
}
