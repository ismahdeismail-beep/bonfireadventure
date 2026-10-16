import { db, save } from './store.js';
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

export function newRef() {
  let ref;
  do {
    ref = `BF-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  } while (db.bookings.some((b) => b.ref === ref));
  return ref;
}

export function findBookingByRef(ref) {
  return db.bookings.find((b) => b.ref === String(ref).toUpperCase()) || null;
}

export function bookingsForUser(userId) {
  return db.bookings
    .filter((b) => b.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** R3.10 — all validation is server-side. */
export function validateBooking(pkg, { optionId, startDate, adults, children }) {
  const errors = [];
  const option = findOption(pkg, optionId);
  if (!option) errors.push('Please choose a valid package option.');

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
export function createBooking(pkg, input, user) {
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
    id: `bk_${Math.random().toString(36).slice(2, 10)}`,
    ref: newRef(),
    userId: user ? user.id : null,
    guestName: user ? null : String(input.guestName || 'Guest').slice(0, 80),
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

  db.bookings.push(booking);
  save();
  return { ok: true, booking };
}

/** R3.7 — expire stale, unconfirmed reservations. */
export function sweepExpired() {
  const now = Date.now();
  let changed = false;
  for (const b of db.bookings) {
    if (b.status === 'reserved' && now - Date.parse(b.createdAt) > RESERVATION_TTL_MS) {
      b.status = 'expired';
      b.updatedAt = new Date().toISOString();
      b.history.push({ at: b.updatedAt, status: 'expired', by: 'system' });
      changed = true;
    }
  }
  if (changed) save();
}

export function setStatus(booking, status, actor) {
  if (!STATUSES.includes(status)) return { ok: false, error: 'Unknown status.' };
  const now = new Date().toISOString();
  booking.status = status;
  booking.updatedAt = now;
  booking.history.push({ at: now, status, by: actor || 'staff' });
  save();
  return { ok: true, booking };
}

export function setPaymentStatus(booking, status, actor) {
  if (!PAYMENT_STATUSES.includes(status)) return { ok: false, error: 'Unknown payment status.' };
  const now = new Date().toISOString();
  booking.paymentStatus = status;
  booking.updatedAt = now;
  booking.history.push({ at: now, status: `payment:${status}`, by: actor || 'staff' });
  save();
  return { ok: true, booking };
}

export function allBookings() {
  return [...db.bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
