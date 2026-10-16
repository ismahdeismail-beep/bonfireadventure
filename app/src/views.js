import { escapeHtml as e } from './http.js';
import { config } from './config.js';
import { formatMoney, priceFrom, validityLabel, isExpired, quote } from './pricing.js';

const TONE_CLASS = {
  coast: 'tone-coast',
  safari: 'tone-safari',
  highland: 'tone-highland',
  city: 'tone-city',
  mixed: 'tone-mixed',
  seasonal: 'tone-seasonal',
};

/* ------------------------------------------------------------------- layout */

const NAV = [
  ['/', 'Home'],
  ['/packages', 'Packages'],
  ['/destinations', 'Destinations'],
  ['/offers', 'Offers'],
  ['/how-booking-works', 'How booking works'],
];

export function layout({ title, user, flash, nav = true, body }) {
  const navHtml = nav
    ? `<header class="site-header">
        <a class="brand" href="/">
          <span class="brand-mark">BA</span>
          <span class="brand-name">Bonfire Adventures</span>
        </a>
        <nav class="site-nav">
          ${NAV.map(([href, label]) => `<a href="${href}">${e(label)}</a>`).join('')}
        </nav>
        <div class="nav-account">
          ${user
            ? `${user.role === 'staff' ? '<a class="btn btn-ghost" href="/staff">Travel desk</a>' : ''}
               <a class="btn btn-ghost" href="/account">${e(user.name)}</a>
               <form method="post" action="/account/logout" class="inline">
                 <input type="hidden" name="csrf" value="${e(csrfToken)}">
                 <button class="btn btn-quiet" type="submit">Log out</button>
               </form>`
            : `<a class="btn btn-ghost" href="/account/login">Log in</a>
               <a class="btn btn-primary" href="/account/register">Create account</a>`}
        </div>
      </header>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${e(title)} · Bonfire Adventures</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  ${navHtml}
  ${flash ? `<div class="flash flash-${e(flash.kind)}" role="status">${e(flash.message)}</div>` : ''}
  <main id="main" class="page">
    ${body}
  </main>
  <footer class="site-footer">
    <p class="footer-note">
      Prototype build · Phase 1 — no contact surfaces are published
      (see <code>docs/decisions/0001</code>). Booking and accounts are live in this build.
    </p>
    <nav class="footer-nav">
      <a href="/how-booking-works">How booking works</a>
      <a href="/packages">All packages</a>
      <a href="/offers">Current offers</a>
    </nav>
  </footer>
  <script src="/app.js" defer></script>
</body>
</html>`;
}

// csrfToken is injected per-request into the layout via module-level variable.
let csrfToken = '';
export function setCsrf(token) { csrfToken = token || ''; }

/* --------------------------------------------------------------- components */

function badge(text, kind = 'neutral') {
  return `<span class="badge badge-${e(kind)}">${e(text)}</span>`;
}

function money(amount, currency) {
  return formatMoney(amount, currency);
}

export function packageCard(pkg) {
  const from = priceFrom(pkg);
  const expired = isExpired(pkg);
  const dest = destinationBySlug(pkg.destination);
  return `<article class="card ${expired ? 'card-expired' : ''}">
    <a class="card-media ${TONE_CLASS[dest?.tone] || 'tone-mixed'}" href="/packages/${e(pkg.slug)}">
      <span>${e(dest?.name || 'Journey')}</span>
    </a>
    <div class="card-body">
      <div class="card-tags">
        ${badge(pkg.category, 'cat')}
        ${pkg.validity ? badge(expired ? 'Ended' : 'Limited dates', expired ? 'danger' : 'warn') : ''}
      </div>
      <h3 class="card-title"><a href="/packages/${e(pkg.slug)}">${e(pkg.title)}</a></h3>
      <p class="card-summary">${e(pkg.summary)}</p>
      <p class="card-price">From <strong>${from ? money(from.price, from.currency) : '—'}</strong> <span class="muted">p.p.</span></p>
      <a class="btn btn-primary" href="/packages/${e(pkg.slug)}">${expired ? 'View details' : 'View & book'}</a>
    </div>
  </article>`;
}

export function destinationCard(dest, count) {
  return `<a class="dest-card ${TONE_CLASS[dest.tone] || 'tone-mixed'}" href="/destinations/${e(dest.slug)}">
    <span class="dest-region">${e(dest.region)}</span>
    <span class="dest-name">${e(dest.name)}</span>
    <span class="dest-count">${count} package${count === 1 ? '' : 's'}</span>
  </a>`;
}

/**
 * Requirement 2 / ADR-0002 — the ONE WhatsApp entry point. Renders nothing at
 * all unless a number is configured, and only on package pages when the
 * placement is 'package-only'.
 */
function whatsappEntry(pkg, placement = 'package') {
  if (!config.whatsappNumber) return '';
  if (config.whatsappPlacement === 'package-only' && placement !== 'package') return '';
  const text = encodeURIComponent(`I would like to ask about "${pkg.title}" (ref page: /packages/${pkg.slug}).`);
  const href = `https://wa.me/${encodeURIComponent(config.whatsappNumber)}?text=${text}`;
  return `<p class="wa-entry"><a class="btn btn-quiet" rel="noopener noreferrer" href="${href}">Prefer to chat? Message the travel desk</a></p>`;
}

/**
 * The lead traveller for a booking.
 *
 * When someone is signed in this is pre-filled from their account, so booking a
 * package is a single step — no re-typing. The field stays editable, and the
 * "booking for someone else" toggle clears it, so they can reserve on another
 * person's behalf. Without JavaScript the field is still simply editable.
 */
function travellerField(user) {
  if (user) {
    return `<fieldset class="field">
      <legend>Lead traveller</legend>
      <label class="field"><span>Name for this booking</span>
        <input type="text" name="travellerName" maxlength="80" required
               value="${e(user.name)}" data-prefilled-name autocomplete="name"></label>
      <label class="field checkbox">
        <input type="checkbox" name="forSomeoneElse" value="1" data-for-someone-else>
        <span>Booking for someone else</span>
      </label>
      <small class="muted">Pre-filled from your account (@${e(user.handle)}). Change the name to book for another person.</small>
    </fieldset>`;
  }
  return `<fieldset class="field">
    <legend>Lead traveller</legend>
    <label class="field"><span>Name for this booking</span>
      <input type="text" name="travellerName" maxlength="80" required
             placeholder="Name for this booking" autocomplete="name"></label>
    <small class="muted"><a href="/account/login">Log in</a> or <a href="/account/register">create an account</a> and this fills in automatically next time.</small>
  </fieldset>`;
}

export function packageDetail({ pkg, destination, user }) {
  const from = priceFrom(pkg);
  const expired = isExpired(pkg);
  const label = validityLabel(pkg);
  const options = pkg.options.map((o, i) => `
    <label class="opt">
      <input type="radio" name="optionId" value="${e(o.id)}" ${i === 0 ? 'checked' : ''} required>
      <span class="opt-label">${e(o.label)}</span>
      <span class="opt-price">${money(o.price, o.currency)} <span class="muted">p.p.</span></span>
    </label>`).join('');

  const extras = (pkg.extras || []).map((x) => `
    <label class="opt opt-extra">
      <input type="checkbox" name="extraIds" value="${e(x.id)}">
      <span class="opt-label">${e(x.label)}</span>
      <span class="opt-price">+ ${money(x.price, x.currency)} <span class="muted">${x.per === 'person' ? 'p.p.' : 'per booking'}</span></span>
    </label>`).join('');

  const bookForm = expired
    ? `<div class="notice notice-danger">
         <strong>This offer has ended.</strong>
         <p>It is no longer bookable. Browse <a href="/packages">current packages</a>.</p>
       </div>`
    : `<form class="booking-form" method="post" action="/packages/${e(pkg.slug)}/book" data-quote-form>
        <input type="hidden" name="csrf" value="${e(csrfToken)}">
        ${travellerField(user)}
        <fieldset class="field">
          <legend>Choose your option</legend>
          ${options}
        </fieldset>
        ${extras ? `<fieldset class="field"><legend>Optional extras</legend>${extras}</fieldset>` : ''}
        <div class="field-row">
          <label class="field"><span>Start date</span><input type="date" name="startDate" required min="${new Date().toISOString().slice(0, 10)}"></label>
          <label class="field"><span>Adults</span><input type="number" name="adults" min="1" max="12" value="2" required></label>
          <label class="field"><span>Children</span><input type="number" name="children" min="0" max="10" value="0" required></label>
        </div>
        <div class="quote" id="quote" data-slug="${e(pkg.slug)}">
          <h3>Your price</h3>
          <p class="muted">Fill in the form to see an exact price. Nothing is charged in this build.</p>
        </div>
        <button class="btn btn-primary btn-lg" type="submit">Request this booking</button>
        <p class="muted small">You will get a booking reference and can track its status. No payment is taken here.</p>
      </form>`;

  return `
  <nav class="crumbs"><a href="/packages">Packages</a> <span>/</span> <span>${e(pkg.title)}</span></nav>
  <article class="detail">
    <header class="detail-head ${TONE_CLASS[destination?.tone] || 'tone-mixed'}">
      <div class="detail-tags">
        ${badge(pkg.category, 'cat')}
        ${destination ? badge(destination.name, 'place') : ''}
        ${expired ? badge('Ended', 'danger') : (label ? badge('Limited dates', 'warn') : '')}
      </div>
      <h1>${e(pkg.title)}</h1>
      <p class="detail-summary">${e(pkg.summary)}</p>
      <p class="detail-price">From <strong>${from ? money(from.price, from.currency) : '—'}</strong> <span class="muted">per person</span></p>
      ${label ? `<p class="muted small">Valid ${e(label)}</p>` : ''}
    </header>

    <div class="detail-grid">
      <div class="detail-main">
        <section>
          <h2>Travel arrangements</h2>
          <p>${e(pkg.transport)}</p>
        </section>

        <section>
          <h2>Itinerary</h2>
          <ol class="itinerary">
            ${pkg.itinerary.map((d) => `<li><span class="day">Day ${d.day}</span><div><h3>${e(d.title)}</h3><p>${e(d.detail)}</p></div></li>`).join('')}
          </ol>
        </section>

        <div class="two-col">
          <section>
            <h2>What's included</h2>
            <ul class="ticks">${(pkg.inclusions || []).map((i) => `<li>${e(i)}</li>`).join('')}</ul>
          </section>
          <section>
            <h2>Not included</h2>
            <ul class="crosses">${(pkg.exclusions || []).map((i) => `<li>${e(i)}</li>`).join('')}</ul>
          </section>
        </div>
      </div>

      <aside class="detail-aside">
        <h2>${expired ? 'Offer ended' : 'Book this journey'}</h2>
        ${bookForm}
        ${whatsappEntry(pkg, 'package')}
      </aside>
    </div>
  </article>`;
}

/* -------------------------------------------------------------------- pages */

export function homePage({ packages, destinations, user }) {
  const bookable = packages.filter((p) => !isExpired(p)).slice(0, 6);
  const featured = destinations.slice(0, 8);
  const counts = countByDestination(packages);

  return `
  <section class="hero">
    <div class="hero-text">
      <p class="eyebrow">Beach · Safari · International</p>
      <h1>We take you places. You make the memories.</h1>
      <p class="lede">Browse real packages, price your trip, and reserve it online — with a booking reference you can track from your account.</p>
      <div class="hero-actions">
        <a class="btn btn-primary btn-lg" href="/packages">Browse packages</a>
        <a class="btn btn-ghost btn-lg" href="/how-booking-works">How booking works</a>
      </div>
    </div>
    <div class="hero-stats">
      <div><strong>${packages.length}</strong><span>packages</span></div>
      <div><strong>${destinations.length}</strong><span>destinations</span></div>
      <div><strong>${bookable.length}</strong><span>featured now</span></div>
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <h2>Featured packages</h2>
      <a href="/packages">See all ${packages.length}</a>
    </div>
    <div class="grid">${bookable.map(packageCard).join('')}</div>
  </section>

  <section class="section">
    <div class="section-head">
      <h2>Popular destinations</h2>
      <a href="/destinations">All destinations</a>
    </div>
    <div class="dest-grid">${featured.map((d) => destinationCard(d, counts[d.slug] || 0)).join('')}</div>
  </section>

  <section class="section booking-explainer">
    <h2>How booking works</h2>
    <ol class="steps">
      <li><span class="step-n">1</span><h3>Choose a package</h3><p>Open any package to see what's included, the itinerary and the options.</p></li>
      <li><span class="step-n">2</span><h3>Price your trip</h3><p>Pick a date, duration and travellers — the price updates for your exact selection.</p></li>
      <li><span class="step-n">3</span><h3>Reserve online</h3><p>Submit the booking and receive a reference with a status you can follow.</p></li>
      <li><span class="step-n">4</span><h3>Track it in your account</h3><p>Log in to see your bookings, or create an account to manage them.</p></li>
    </ol>
    <a class="btn btn-primary" href="/account/register">Create an account</a>
  </section>`;
}

export function packagesPage({ packages, destinations, filters, user }) {
  const shown = packages.filter((p) => {
    if (filters.destination && p.destination !== filters.destination) return false;
    if (filters.category && p.category !== filters.category) return false;
    if (filters.excludeExpired && isExpired(p)) return false;
    return true;
  });
  const categories = [...new Set(packages.map((p) => p.category))];

  return `
  <header class="page-head">
    <h1>Our packages</h1>
    <p class="lede">${packages.length} journeys across Kenya, Africa and beyond. Prices shown are the real starting price for each package.</p>
  </header>

  <form class="filters" method="get" action="/packages">
    <label class="field"><span>Destination</span>
      <select name="destination">
        <option value="">All destinations</option>
        ${destinations.map((d) => `<option value="${e(d.slug)}" ${filters.destination === d.slug ? 'selected' : ''}>${e(d.name)}</option>`).join('')}
      </select>
    </label>
    <label class="field"><span>Type</span>
      <select name="category">
        <option value="">All types</option>
        ${categories.map((c) => `<option value="${e(c)}" ${filters.category === c ? 'selected' : ''}>${e(c)}</option>`).join('')}
      </select>
    </label>
    <label class="field checkbox"><input type="checkbox" name="hide" value="expired" ${filters.excludeExpired ? 'checked' : ''}> <span>Hide ended offers</span></label>
    <button class="btn btn-primary" type="submit">Apply</button>
  </form>

  <p class="result-count">${shown.length} package${shown.length === 1 ? '' : 's'}</p>
  <div class="grid">${shown.map(packageCard).join('') || '<p class="empty">No packages match those filters.</p>'}</div>`;
}

export function destinationsPage({ destinations, packages }) {
  const counts = countByDestination(packages);
  const regions = [...new Set(destinations.map((d) => d.region))];
  return `
  <header class="page-head">
    <h1>Destinations</h1>
    <p class="lede">${destinations.length} places to travel, each linked to the packages that go there.</p>
  </header>
  ${regions.map((r) => `
    <section class="section">
      <h2>${e(r)}</h2>
      <div class="dest-grid">
        ${destinations.filter((d) => d.region === r).map((d) => destinationCard(d, counts[d.slug] || 0)).join('')}
      </div>
    </section>`).join('')}`;
}

export function destinationDetail({ destination, packages }) {
  return `
  <nav class="crumbs"><a href="/destinations">Destinations</a> <span>/</span> <span>${e(destination.name)}</span></nav>
  <header class="page-head">
    <h1>${e(destination.name)}</h1>
    <p class="lede">${e(destination.blurb)}</p>
  </header>
  <section class="section">
    <h2>Packages to ${e(destination.name)}</h2>
    <div class="grid">${packages.map(packageCard).join('') || '<p class="empty">No packages here yet.</p>'}</div>
  </section>`;
}

export function offersPage({ packages }) {
  const live = packages.filter((p) => p.validity && !isExpired(p));
  const ended = packages.filter((p) => p.validity && isExpired(p));
  return `
  <header class="page-head">
    <h1>Current offers</h1>
    <p class="lede">Only offers inside their validity window are shown. Ended offers are listed at the bottom for reference and are not bookable.</p>
  </header>
  <section class="section">
    <h2>Available now</h2>
    <div class="grid">${live.map(packageCard).join('') || '<p class="empty">No live offers right now.</p>'}</div>
  </section>
  ${ended.length ? `<section class="section">
    <h2>Ended</h2>
    <div class="grid">${ended.map(packageCard).join('')}</div>
  </section>` : ''}`;
}

export function howBookingWorksPage() {
  return `
  <header class="page-head">
    <h1>How booking works</h1>
    <p class="lede">This is the flow this build implements — a real reservation with a reference, not a message that disappears.</p>
  </header>
  <section class="section">
    <ol class="steps steps-lg">
      <li><span class="step-n">1</span><h3>Pick a package</h3><p>Each package shows its real starting price, what's included, the itinerary and its options.</p></li>
      <li><span class="step-n">2</span><h3>Build your selection</h3><p>Choose a date, an option (duration/class), traveller numbers and any extras. The price is calculated for exactly that.</p></li>
      <li><span class="step-n">3</span><h3>Reserve</h3><p>Submit the request. It is stored with a reference like <strong>BF-XXXXX</strong> and a status: reserved → confirmed, or cancelled/expired.</p></li>
      <li><span class="step-n">4</span><h3>Manage it</h3><p>Log in to see your bookings and their status. Accounts need only a handle and password — we are not collecting contact details in this phase.</p></li>
    </ol>
  </section>
  <section class="section two-col">
    <div>
      <h2>What's different from the old site</h2>
      <ul class="ticks">
        <li>Prices are real per package, not one placeholder figure.</li>
        <li>Ended offers are hidden automatically instead of being advertised.</li>
        <li>Bookings are stored, so they can be confirmed and tracked.</li>
        <li>WhatsApp is a single, optional entry point — not the checkout.</li>
      </ul>
    </div>
    <div>
      <h2>What this build does not do yet</h2>
      <ul class="crosses">
        <li>No payment is taken (the model supports it).</li>
        <li>No contact details are published (by design, this phase).</li>
        <li>No live supplier availability — bookings are requests staff confirm.</li>
      </ul>
    </div>
  </section>`;
}

export function bookingPage({ booking, pkg }) {
  const tone = pkg ? TONE_CLASS[destinationBySlug(pkg.destination)?.tone] || 'tone-mixed' : 'tone-mixed';
  return `
  <section class="confirm ${tone}">
    <p class="eyebrow">Reservation received</p>
    <h1>Booking ${e(booking.ref)}</h1>
    <p class="lede">Status: <strong>${e(booking.status)}</strong> · Payment: <strong>${e(booking.paymentStatus.replace('_', ' '))}</strong></p>
  </section>
  <section class="section two-col">
    <div>
      <h2>Your booking</h2>
      <dl class="facts">
        <dt>Package</dt><dd>${e(booking.packageTitle)}</dd>
        <dt>Option</dt><dd>${e(booking.optionLabel)}</dd>
        <dt>Lead traveller</dt><dd>${e(booking.travellerName || booking.guestName || '—')}${booking.forSelf ? ' <span class="muted">(account holder)</span>' : ''}</dd>
        <dt>Start date</dt><dd>${e(booking.startDate)}</dd>
        <dt>Travellers</dt><dd>${booking.travellers.adults} adult(s), ${booking.travellers.children} child(ren)</dd>
        ${booking.extras.length ? `<dt>Extras</dt><dd>${e(booking.extras.join(', '))}</dd>` : ''}
        <dt>Total</dt><dd><strong>${money(booking.total, booking.currency)}</strong></dd>
        <dt>Deposit due</dt><dd>${money(booking.deposit, booking.currency)}</dd>
      </dl>
    </div>
    <div>
      <h2>What happens next</h2>
      <ol class="steps">
        <li><span class="step-n">1</span><h3>We confirm availability</h3><p>A reservation starts as <em>reserved</em> and is confirmed by the travel desk.</p></li>
        <li><span class="step-n">2</span><h3>You track the status</h3><p>Keep this reference, or create an account to see it with your other bookings.</p></li>
      </ol>
      ${booking.userId ? '' : '<p class="muted small">This booking was made as a guest. Create an account with the same details to manage it.</p>'}
      <a class="btn btn-ghost" href="/packages">Browse more packages</a>
    </div>
  </section>`;
}

export function accountPage({ user, bookings }) {
  const rows = bookings.map((b) => `
    <tr>
      <td><a href="/bookings/${e(b.ref)}">${e(b.ref)}</a></td>
      <td>${e(b.packageTitle)}</td>
      <td>${e(b.travellerName || b.guestName || '—')}${b.forSelf ? '' : ' <span class="muted small">(other)</span>'}</td>
      <td>${e(b.startDate)}</td>
      <td>${badge(b.status, b.status === 'confirmed' ? 'ok' : b.status === 'cancelled' || b.status === 'expired' ? 'danger' : 'warn')}</td>
      <td>${money(b.total, b.currency)}</td>
    </tr>`).join('');

  return `
  <header class="page-head">
    <h1>Your account</h1>
    <p class="lede">Signed in as <strong>${e(user.name)}</strong> (@${e(user.handle)})${user.role === 'staff' ? ' · travel desk' : ''}.</p>
  </header>

  <section class="section">
    <h2>Your bookings</h2>
    ${bookings.length
      ? `<table class="table"><thead><tr><th>Reference</th><th>Package</th><th>Traveller</th><th>Start</th><th>Status</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>`
      : '<p class="empty">No bookings yet. <a href="/packages">Browse packages</a> to make your first one.</p>'}
  </section>

  <section class="section two-col">
    <div>
      <h2>Profile</h2>
      <form method="post" action="/account/profile" class="stack">
        <input type="hidden" name="csrf" value="${e(csrfToken)}">
        <label class="field"><span>Handle</span><input type="text" value="${e(user.handle)}" disabled></label>
        <label class="field"><span>Display name</span><input type="text" name="name" value="${e(user.name)}" maxlength="80" required></label>
        <button class="btn btn-primary" type="submit">Save changes</button>
      </form>
    </div>
    <div>
      <h2>Password</h2>
      <form method="post" action="/account/password" class="stack">
        <input type="hidden" name="csrf" value="${e(csrfToken)}">
        <label class="field"><span>Current handle (to request a reset)</span><input type="text" value="${e(user.handle)}" disabled></label>
        <p class="muted small">Password resets are single-use and expire after 30 minutes. In this build the reset link is shown on screen instead of being emailed.</p>
        <button class="btn btn-ghost" type="submit">Request a password reset</button>
      </form>
    </div>
  </section>`;
}

export function staffPage({ bookings }) {
  const rows = bookings.map((b) => `
    <tr>
      <td><a href="/bookings/${e(b.ref)}">${e(b.ref)}</a></td>
      <td>${e(b.packageTitle)}</td>
      <td>${e(b.travellerName || b.guestName || '—')}</td>
      <td>${e(b.startDate)}</td>
      <td>${badge(b.status, b.status === 'confirmed' ? 'ok' : b.status === 'cancelled' || b.status === 'expired' ? 'danger' : 'warn')}</td>
      <td>${money(b.total, b.currency)}</td>
      <td>
        <form method="post" action="/staff/bookings/${e(b.id)}/status" class="inline">
          <input type="hidden" name="csrf" value="${e(csrfToken)}">
          <select name="status">
            ${['reserved', 'confirmed', 'cancelled', 'expired'].map((s) => `<option value="${s}" ${b.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
          <button class="btn btn-quiet" type="submit">Set</button>
        </form>
      </td>
    </tr>`).join('');

  return `
  <header class="page-head">
    <h1>Travel desk</h1>
    <p class="lede">All bookings. Change a status to confirm or cancel a reservation.</p>
  </header>
  <section class="section">
    ${bookings.length
      ? `<table class="table"><thead><tr><th>Ref</th><th>Package</th><th>Traveller</th><th>Start</th><th>Status</th><th>Total</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table>`
      : '<p class="empty">No bookings yet.</p>'}
  </section>`;
}

/* -------------------------------------------------------------------- auth */

export function loginPage({ error }) {
  return `<section class="auth">
    <h1>Log in</h1>
    ${error ? `<div class="notice notice-danger">${e(error)}</div>` : ''}
    <form method="post" action="/account/login" class="stack">
      <input type="hidden" name="csrf" value="${e(csrfToken)}">
      <label class="field"><span>Handle</span><input type="text" name="handle" autocomplete="username" required></label>
      <label class="field"><span>Password</span><input type="password" name="password" autocomplete="current-password" required></label>
      <button class="btn btn-primary btn-lg" type="submit">Log in</button>
    </form>
    <p class="muted">No account yet? <a href="/account/register">Create one</a>. Forgot your password? <a href="/account/password">Reset it</a>.</p>
  </section>`;
}

export function registerPage({ errors = [] }) {
  return `<section class="auth">
    <h1>Create an account</h1>
    ${errors.length ? `<div class="notice notice-danger"><ul>${errors.map((x) => `<li>${e(x)}</li>`).join('')}</ul></div>` : ''}
    <form method="post" action="/account/register" class="stack">
      <input type="hidden" name="csrf" value="${e(csrfToken)}">
      <label class="field"><span>Handle</span><input type="text" name="handle" autocomplete="username" required placeholder="e.g. jane.doe"></label>
      <label class="field"><span>Display name</span><input type="text" name="name" autocomplete="name" maxlength="80" required></label>
      <label class="field"><span>Password</span><input type="password" name="password" autocomplete="new-password" required minlength="10"><small class="muted">At least 10 characters.</small></label>
      <label class="field checkbox"><input type="checkbox" name="consent" value="1"> <span>I agree that this prototype may store my account and booking data.</span></label>
      <button class="btn btn-primary btn-lg" type="submit">Create account</button>
    </form>
    <p class="muted">Already registered? <a href="/account/login">Log in</a>.</p>
  </section>`;
}

export function resetRequestPage({ message, token }) {
  return `<section class="auth">
    <h1>Reset your password</h1>
    ${message ? `<div class="notice notice-ok">${e(message)}</div>` : ''}
    <form method="post" action="/account/password" class="stack">
      <input type="hidden" name="csrf" value="${e(csrfToken)}">
      <label class="field"><span>Handle</span><input type="text" name="handle" required></label>
      <button class="btn btn-primary" type="submit">Request reset link</button>
    </form>
    ${token ? `<div class="notice notice-info">
      <p><strong>Development mode:</strong> no mail is sent in this build, so the
      single-use reset link is shown here.</p>
      <p><a href="/account/password/${e(token)}">Open reset link</a></p>
    </div>` : ''}
    <p class="muted"><a href="/account/login">Back to log in</a></p>
  </section>`;
}

export function resetSetPage({ token, error, done }) {
  if (done) {
    return `<section class="auth">
      <h1>Password updated</h1>
      <div class="notice notice-ok">Your password has been changed and other sessions were signed out.</div>
      <a class="btn btn-primary" href="/account/login">Log in</a>
    </section>`;
  }
  return `<section class="auth">
    <h1>Choose a new password</h1>
    ${error ? `<div class="notice notice-danger">${e(error)}</div>` : ''}
    <form method="post" action="/account/password/${e(token)}" class="stack">
      <input type="hidden" name="csrf" value="${e(csrfToken)}">
      <label class="field"><span>New password</span><input type="password" name="password" minlength="10" required></label>
      <button class="btn btn-primary" type="submit">Set new password</button>
    </form>
  </section>`;
}

export function errorPage({ status, message, user }) {
  return `<section class="page-head">
    <h1>${status}</h1>
    <p class="lede">${e(message)}</p>
    <a class="btn btn-primary" href="/">Back to home</a>
  </section>`;
}

/* ------------------------------------------------------------------ helpers */

export function destinationBySlug(slug) {
  return DESTINATIONS.find((d) => d.slug === slug) || null;
}

let DESTINATIONS = [];
export function setDestinations(list) { DESTINATIONS = list; }

function countByDestination(packages) {
  const out = {};
  for (const p of packages) out[p.destination] = (out[p.destination] || 0) + 1;
  return out;
}
