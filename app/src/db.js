/**
 * Storage facade.
 *
 * Chooses between the Supabase driver and the JSON-file driver at import time,
 * then re-exports one identical async interface. Nothing else in the app knows
 * (or cares) which driver is live.
 *
 *   STORE=supabase  -> shared Supabase Postgres (bonfire_* tables)
 *   STORE=json      -> local app/data/db.json
 *   (unset)         -> supabase when SUPABASE_URL + service key are set, else json
 */
import { randomUUID } from 'node:crypto';
import { config } from './config.js';
import { hashPassword } from './password.js';

const driver = config.storeDriver === 'supabase'
  ? await import('./drivers/supabase.js')
  : await import('./drivers/json.js');

export const driverName = config.storeDriver;

export const {
  // users
  getUserById, getUserByHandle, insertUser, updateUser,
  // sessions
  insertSession, getSession, deleteSession, deleteSessionsForUser,
  deleteSessionsForUserExcept, pruneSessions,
  // password resets
  insertResetToken, getResetToken, markResetTokenUsed,
  // bookings
  insertBooking, getBookingByRef, getBookingById, listBookingsForUser,
  listAllBookings, updateBooking, sweepExpiredReservations,
  // maintenance
  ping, resetStore,
} = driver;

/** Stable, collision-free ids for users and bookings (uuid v4). */
export function newId() {
  return randomUUID();
}

/**
 * Seed the optional staff account (ADR-0001: no credentials in the repo — they
 * come from the environment) and clear out expired sessions.
 */
export async function initStore() {
  await pruneSessions();

  if (config.adminHandle && config.adminPassword) {
    const handle = config.adminHandle.toLowerCase();
    const existing = await getUserByHandle(handle);
    if (!existing) {
      const now = new Date().toISOString();
      await insertUser({
        id: newId(),
        handle,
        name: 'Travel Desk',
        role: 'staff',
        passwordHash: hashPassword(config.adminPassword),
        consentAt: now,
        createdAt: now,
        updatedAt: now,
      });
      return { seededStaff: true };
    }
    return { seededStaff: false };
  }
  return { seededStaff: false };
}

/** Human-readable one-liner for the startup banner and /healthz. */
export function describeStore() {
  return driverName === 'supabase'
    ? `supabase (${config.supabaseUrl})`
    : `json file (${config.dataFile})`;
}
