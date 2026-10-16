import {
  insertBooking, getBookingByRef, getBookingById, listBookingsForUser,
  listAllBookings, updateBooking, sweepExpiredReservations, newId,
} from './db.js';
import { quote, findOption, isExpired } from './pricing.js';

export const STATUSES = ['enquiry', 'reserved', 'confirmed', 'cancelled', 'expired'];
export const PAYMENT_STATUSES = ['unpaid', 'deposit_paid', 'paid', 'refunded'];

const RESERVATION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // unconfirmed reservations expire after 7 days
const MAX_TRAVELLERS = 12;

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export async function newRef() {
  for (let i = 0; i < 10; i += 1) {
    const ref = `BF-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    if (!(await getBookingByRef(ref))) return ref;
  }
  return `BF-${Date.now().toString(36).slice(-5).toUpperCase()}`;
}

export function findBookingByRef(ref) {
  return getBookingByRef(ref);
}

export function findBookingById(id) {
  return getBookingById(id);
}

export function bookingsForUser(userId) {
  return listBookingsForUser(userId);
}

/** R3.10 — all validation is server-side. */
export function validateBooking(pkg, { optionId, startDate, adults, children, travellerName }) {
  const errors = [];
  const option = findOption(pkg, optionId);
  if (!option) errors.push('Please choose a valid package option.');

  const name = String(travellerName || '').trim();
  if (name.length < 2) errors.push('Please enter the name for this booking.');
  else if (name.length > 80) errors.push('That name is too long (80 characters maximum).');

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(startDate || ''))) {
    errors.push('Please choose a valid start date.');
  } else if (startDate < todayISO()) {
    errors.push('The start date cannot be in the past.');
  } else if (pkg.validity && startDate > String(pkg.validity.to).slice(0, 10)) {
    errors.push('That date falls outside this offer\u2019s validity window.');
  }

  const a = Number(adults);
  const c = Number(children);
  if (!Number.isInteger(a) || a < 1) errors.push('At least one adult is required.');
  if (!Number.isInteger(c) || c < 0) errors.push('Children must be zero or more.');
  if (Number.isInteger(a) && Number.isInteger(c) && a + c > MAX_TRAVELLERS) {
    errors.push(`A single booking can hold up to ${MAX_TRAVELLERS} travellers.`);
  }
  if (isExpired(pkg)) errors.push('This offer has ended.');

  return { ok: errors.length === 0, errors, option };
}

/** R3.4–R3.7 — create a stored booking with a lifecycle status and reference. */
export async function createBooking(pkg, input, user) {
  const { ok, errors } = validateBooking(pkg, input);
  if (!ok) return { ok: false, errors };

  const priced = quote(pkg, {
    optionId: input.optionId,
    adults: Number(input.adults),
    children: Number(input.children),
    extraIds: Array.isArray(input.extraIds) ? input.extraIds : [],
  });
  if (!priced.ok) return { ok: false, errors: [priced.error] };

  const now = new Date().toISOString();
  const booking = {
    id: newId(),
    ref: await newRef(),
    userId: user ? user.id : null,
    // The lead traveller for this booking. Pre-filled from the account when the
    // booker is signed in, but stored on the booking itself so a member can also
    // reserve on someone else's behalf.
    travellerName: String(input.travellerName).trim().slice(0, 80),
    forSelf: Boolean(user) && !input.forSomeoneElse,
    packageId: pkg.slug,
    packageTitle: pkg.title,
    optionId: input.optionId,
    optionLabel: priced.lines[0]?.label || '',
    startDate: input.startDate,
    travellers: priced.travellers,
    extras: (input.extraIds || []).map((id) => (pkg.extras || []).find((e) => e.id === id)?.label).filter(Boolean),
    currency: priced.currency,
    total: priced.total,
    deposit: priced.deposit,
    balance: priced.balance,
    status: 'reserved',
    paymentStatus: 'unpaid',
    history: [{ at: now, status: 'reserved', by: user ? user.handle : 'guest' }],
    createdAt: now,
    updatedAt: now,
  };

  const stored = await insertBooking(booking);
  return { ok: true, booking: stored || booking };
}

/** R3.7 — expire stale, unconfirmed reservations. */
export async function sweepExpired() {
  return sweepExpiredReservations(RESERVATION_TTL_MS);
}

export async function setStatus(booking, status, actor) {
  if (!STATUSES.includes(status)) return { ok: false, error: 'Unknown status.' };
  const now = new Date().toISOString();
  const history = [...(booking.history || []), { at: now, status, by: actor || 'staff' }];
  const updated = await updateBooking(booking.id, { status, updatedAt: now, history });
  return { ok: true, booking: updated || { ...booking, status, updatedAt: now, history } };
}

export async function setPaymentStatus(booking, status, actor) {
  if (!PAYMENT_STATUSES.includes(status)) return { ok: false, error: 'Unknown payment status.' };
  const now = new Date().toISOString();
  const history = [...(booking.history || []), { at: now, status: `payment:${status}`, by: actor || 'staff' }];
  const updated = await updateBooking(booking.id, { paymentStatus: status, updatedAt: now, history });
  return { ok: true, booking: updated || { ...booking, paymentStatus: status, updatedAt: now, history } };
}

export function allBookings() {
  return listAllBookings();
}
