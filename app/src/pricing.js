import { config } from './config.js';

export function currencySymbol(currency) {
  return currency === 'USD' ? '$' : 'KSh ';
}

export function formatMoney(amount, currency) {
  const rounded = Math.round(Number(amount) || 0);
  return `${currencySymbol(currency)}${rounded.toLocaleString('en-US')}`;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** R3.2 — an offer is expired once its validity window has passed. */
export function isExpired(pkg, now = new Date()) {
  if (!pkg.validity) return false;
  return startOfDay(now) > startOfDay(pkg.validity.to);
}

export function isValidNow(pkg, now = new Date()) {
  if (!pkg.validity) return true;
  const from = startOfDay(pkg.validity.from);
  const to = startOfDay(pkg.validity.to);
  const today = startOfDay(now);
  return today >= from && today <= to;
}

export function validityLabel(pkg) {
  if (!pkg.validity) return null;
  const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt(pkg.validity.from)} – ${fmt(pkg.validity.to)}`;
}

/** Lowest bookable price across a package's options — the single "from" price. */
export function priceFrom(pkg) {
  if (!pkg.options?.length) return null;
  return pkg.options.reduce((min, o) => (o.price < min.price ? o : min), pkg.options[0]);
}

export function findOption(pkg, optionId) {
  return pkg.options.find((o) => o.id === optionId) || null;
}

export function findExtra(pkg, extraId) {
  return (pkg.extras || []).find((e) => e.id === extraId) || null;
}

/**
 * R3.5 — compute a price for a specific selection, server-side only.
 * Children are charged at config.childRate. Extras are per-person or per-booking.
 */
export function quote(pkg, selection) {
  const { optionId, adults = 1, children = 0, extraIds = [] } = selection;
  const option = findOption(pkg, optionId);
  if (!option) return { ok: false, error: 'Unknown option' };

  const a = Math.max(0, Math.floor(Number(adults) || 0));
  const c = Math.max(0, Math.floor(Number(children) || 0));
  if (a + c < 1) return { ok: false, error: 'At least one traveller is required' };
  if (a < 1) return { ok: false, error: 'At least one adult is required' };

  const childUnit = Math.round(option.price * config.childRate);
  const adultsTotal = option.price * a;
  const childrenTotal = childUnit * c;

  const lines = [
    { label: `${option.label} — adults × ${a}`, amount: adultsTotal },
  ];
  if (c > 0) lines.push({ label: `Children × ${c} (${Math.round(config.childRate * 100)}% rate)`, amount: childrenTotal });

  let extrasTotal = 0;
  for (const id of extraIds) {
    const extra = findExtra(pkg, id);
    if (!extra) continue;
    const amount = extra.per === 'person' ? extra.price * (a + c) : extra.price;
    extrasTotal += amount;
    lines.push({ label: `${extra.label}${extra.per === 'person' ? ` × ${a + c}` : ''}`, amount });
  }

  const total = adultsTotal + childrenTotal + extrasTotal;
  const deposit = Math.round(total * config.depositRate);

  return {
    ok: true,
    currency: option.currency,
    lines,
    travellers: { adults: a, children: c },
    total,
    deposit,
    balance: total - deposit,
  };
}
