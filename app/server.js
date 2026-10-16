import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './src/config.js';
import { db, init } from './src/store.js';
import {
  html, redirect, send, notFound, readForm, json, securityHeaders,
} from './src/http.js';
import {
  ensureSession, currentUser, verifyCsrf, attemptLogin, registerUser,
  createSession, destroySession, createResetToken, consumeResetToken,
} from './src/auth.js';
import {
  quote, formatMoney,
} from './src/pricing.js';
import {
  createBooking, findBookingByRef, bookingsForUser, sweepExpired,
  setStatus, allBookings,
} from './src/bookings.js';
import * as v from './src/views.js';

init();
v.setDestinations(db.destinations);

/* ------------------------------------------------------------------ helpers */

function findPackage(slug) {
  return db.packages.find((p) => p.slug === slug) || null;
}

function findDestination(slug) {
  return db.destinations.find((d) => d.slug === slug) || null;
}

function packagesForDestination(slug) {
  return db.packages.filter((p) => p.destination === slug);
}

function flashFromUrl(url) {
  const ok = url.searchParams.get('ok');
  const err = url.searchParams.get('err');
  if (ok) return { kind: 'ok', message: ok };
  if (err) return { kind: 'danger', message: err };
  return null;
}

function serveStatic(res, file, type) {
  const full = path.join(config.publicDir, file);
  if (!full.startsWith(config.publicDir) || !fs.existsSync(full)) return notFound(res);
  const body = fs.readFileSync(full);
  send(res, 200, body, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
}

/* -------------------------------------------------------------------- routes */

const routes = [
  ['GET', '/healthz', (req, res) => json(res, { ok: true, packages: db.packages.length })],

  ['GET', '/styles.css', (req, res) => serveStatic(res, 'styles.css', 'text/css; charset=utf-8')],
  ['GET', '/app.js', (req, res) => serveStatic(res, 'app.js', 'text/javascript; charset=utf-8')],

  ['GET', '/', (req, res, _p, url, user) => {
    html(res, v.layout({
      title: 'Home',
      user,
      body: v.homePage({ packages: db.packages, destinations: db.destinations, user }),
    }));
  }],

  ['GET', '/packages', (req, res, _p, url, user) => {
    const filters = {
      destination: url.searchParams.get('destination') || '',
      category: url.searchParams.get('category') || '',
      excludeExpired: url.searchParams.get('hide') === 'expired',
    };
    html(res, v.layout({
      title: 'Packages',
      user,
      body: v.packagesPage({ packages: db.packages, destinations: db.destinations, filters, user }),
    }));
  }],

  ['GET', '/packages/:slug', (req, res, params, _url, user) => {
    const pkg = findPackage(params.slug);
    if (!pkg) return notFound(res);
    html(res, v.layout({
      title: pkg.title,
      user,
      body: v.packageDetail({ pkg, destination: findDestination(pkg.destination), user }),
    }));
  }],

  ['POST', '/packages/:slug/book', async (req, res, params, _url, user) => {
    const pkg = findPackage(params.slug);
    if (!pkg) return notFound(res);
    const form = await readForm(req);
    if (!verifyCsrf(req, form.csrf)) return redirect(res, `/packages/${pkg.slug}?err=Your session expired. Please try again.`);

    const result = createBooking(pkg, {
      optionId: form.optionId,
      startDate: form.startDate,
      adults: Number(form.adults),
      children: Number(form.children),
      extraIds: [].concat(form.extraIds || []),
      guestName: form.guestName,
    }, user);

    if (!result.ok) {
      return redirect(res, `/packages/${pkg.slug}?err=${encodeURIComponent(result.errors[0])}`);
    }
    redirect(res, `/bookings/${result.booking.ref}?ok=1`);
  }],

  ['GET', '/api/quote', (req, res, _p, url) => {
    const pkg = findPackage(url.searchParams.get('slug'));
    if (!pkg) return json(res, { ok: false, error: 'Unknown package' }, 404);
    const res2 = quote(pkg, {
      optionId: url.searchParams.get('option'),
      adults: Number(url.searchParams.get('adults') || 1),
      children: Number(url.searchParams.get('children') || 0),
      extraIds: (url.searchParams.get('extras') || '').split(',').filter(Boolean),
    });
    if (!res2.ok) return json(res, { ok: false, error: res2.error }, 400);
    json(res, {
      ok: true,
      currency: res2.currency,
      lines: res2.lines.map((l) => ({ label: l.label, amount: formatMoney(l.amount, res2.currency) })),
      total: formatMoney(res2.total, res2.currency),
      deposit: formatMoney(res2.deposit, res2.currency),
      balance: formatMoney(res2.balance, res2.currency),
    });
  }],

  ['GET', '/destinations', (req, res, _p, _url, user) => {
    html(res, v.layout({
      title: 'Destinations',
      user,
      body: v.destinationsPage({ destinations: db.destinations, packages: db.packages }),
    }));
  }],

  ['GET', '/destinations/:slug', (req, res, params, _url, user) => {
    const dest = findDestination(params.slug);
    if (!dest) return notFound(res);
    html(res, v.layout({
      title: dest.name,
      user,
      body: v.destinationDetail({ destination: dest, packages: packagesForDestination(dest.slug) }),
    }));
  }],

  ['GET', '/offers', (req, res, _p, _url, user) => {
    html(res, v.layout({ title: 'Offers', user, body: v.offersPage({ packages: db.packages }) }));
  }],

  ['GET', '/how-booking-works', (req, res, _p, _url, user) => {
    html(res, v.layout({ title: 'How booking works', user, body: v.howBookingWorksPage() }));
  }],

  ['GET', '/bookings/:ref', (req, res, params, url, user) => {
    const booking = findBookingByRef(params.ref);
    if (!booking) return notFound(res);
    html(res, v.layout({
      title: `Booking ${booking.ref}`,
      user,
      flash: flashFromUrl(url),
      body: v.bookingPage({ booking, pkg: findPackage(booking.packageId) }),
    }));
  }],

  /* ------------------------------------------------------------------ auth */

  ['GET', '/account/login', (req, res, _p, url, user) => {
    if (user) return redirect(res, '/account');
    html(res, v.layout({
      title: 'Log in',
      user,
      body: v.loginPage({ error: url.searchParams.get('err') }),
    }));
  }],

  ['POST', '/account/login', async (req, res) => {
    const form = await readForm(req);
    if (!verifyCsrf(req, form.csrf)) return redirect(res, '/account/login?err=Your session expired.');
    const result = attemptLogin(req, form.handle, form.password);
    if (!result.ok) return redirect(res, `/account/login?err=${encodeURIComponent(result.error)}`);
    createSession(res, result.user.id);
    redirect(res, '/account?ok=Signed in.');
  }],

  ['GET', '/account/register', (req, res, _p, url, user) => {
    if (user) return redirect(res, '/account');
    html(res, v.layout({
      title: 'Create account',
      user,
      body: v.registerPage({ errors: url.searchParams.get('err') ? [url.searchParams.get('err')] : [] }),
    }));
  }],

  ['POST', '/account/register', async (req, res) => {
    const form = await readForm(req);
    if (!verifyCsrf(req, form.csrf)) return redirect(res, '/account/register?err=Your session expired.');
    const result = registerUser({
      handle: form.handle,
      name: form.name,
      password: form.password,
      consent: form.consent === '1',
    });
    if (!result.ok) return redirect(res, `/account/register?err=${encodeURIComponent(result.errors[0])}`);
    createSession(res, result.user.id);
    redirect(res, '/account?ok=Account created.');
  }],

  ['POST', '/account/logout', async (req, res) => {
    const form = await readForm(req);
    if (verifyCsrf(req, form.csrf)) destroySession(req, res);
    redirect(res, '/?ok=Signed out.');
  }],

  ['GET', '/account', (req, res, _p, url, user) => {
    if (!user) return redirect(res, '/account/login');
    html(res, v.layout({
      title: 'Your account',
      user,
      flash: flashFromUrl(url),
      body: v.accountPage({ user, bookings: bookingsForUser(user.id) }),
    }));
  }],

  ['POST', '/account/profile', async (req, res, _p, _url, user) => {
    if (!user) return redirect(res, '/account/login');
    const form = await readForm(req);
    if (!verifyCsrf(req, form.csrf)) return redirect(res, '/account?err=Your session expired.');
    const name = String(form.name || '').trim().slice(0, 80);
    if (name.length < 2) return redirect(res, '/account?err=Please enter a name.');
    user.name = name;
    const { save } = await import('./src/store.js');
    save();
    redirect(res, '/account?ok=Profile updated.');
  }],

  ['GET', '/account/password', (req, res, _p, url, user) => {
    html(res, v.layout({
      title: 'Reset password',
      user,
      body: v.resetRequestPage({ message: url.searchParams.get('ok'), token: url.searchParams.get('token') }),
    }));
  }],

  ['POST', '/account/password', async (req, res) => {
    const form = await readForm(req);
    if (!verifyCsrf(req, form.csrf)) return redirect(res, '/account/password?err=Your session expired.');
    const result = createResetToken(form.handle);
    // Never reveal whether the handle exists (R4.11).
    const tokenPart = result.token ? `&token=${result.token}` : '';
    redirect(res, `/account/password?ok=If that account exists, a reset link has been created.${tokenPart}`);
  }],

  ['GET', '/account/password/:token', (req, res, params, _url, user) => {
    html(res, v.layout({
      title: 'Set a new password',
      user,
      body: v.resetSetPage({ token: params.token, error: null, done: false }),
    }));
  }],

  ['POST', '/account/password/:token', async (req, res, params) => {
    const form = await readForm(req);
    if (!verifyCsrf(req, form.csrf)) return redirect(res, `/account/password/${params.token}?err=Your session expired.`);
    const result = consumeResetToken(params.token, form.password);
    if (!result.ok) {
      html(res, v.layout({
        title: 'Set a new password',
        user: null,
        body: v.resetSetPage({ token: params.token, error: result.error, done: false }),
      }), 400);
      return;
    }
    html(res, v.layout({
      title: 'Password updated',
      user: null,
      body: v.resetSetPage({ token: params.token, done: true }),
    }));
  }],

  /* ----------------------------------------------------------------- staff */

  ['GET', '/staff', (req, res, _p, _url, user) => {
    if (!user) return redirect(res, '/account/login');
    if (user.role !== 'staff') return notFound(res);
    html(res, v.layout({ title: 'Travel desk', user, body: v.staffPage({ bookings: allBookings() }) }));
  }],

  ['POST', '/staff/bookings/:id/status', async (req, res, params, _url, user) => {
    if (!user || user.role !== 'staff') return notFound(res);
    const form = await readForm(req);
    if (!verifyCsrf(req, form.csrf)) return redirect(res, '/staff?err=Your session expired.');
    const booking = db.bookings.find((b) => b.id === params.id);
    if (!booking) return notFound(res);
    setStatus(booking, form.status, user.handle);
    redirect(res, '/staff?ok=Status updated.');
  }],
];

function matchRoute(method, pathname) {
  for (const [m, pattern, handler] of routes) {
    if (m !== method) continue;
    const names = [];
    const rx = new RegExp(`^${pattern.replace(/:[a-zA-Z]+/g, (seg) => { names.push(seg.slice(1)); return '([^/]+)'; })}$`);
    const m2 = pathname.match(rx);
    if (m2) {
      const params = {};
      names.forEach((n, i) => { params[n] = decodeURIComponent(m2[i + 1]); });
      return { handler, params };
    }
  }
  return null;
}

/* ------------------------------------------------------------------- server */

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const session = ensureSession(req, res);
    v.setCsrf(session.csrf);
    const user = currentUser(req);
    sweepExpired();

    if (!['GET', 'POST'].includes(req.method)) {
      return send(res, 405, 'Method not allowed', { Allow: 'GET, POST', ...securityHeaders() });
    }

    const matched = matchRoute(req.method, url.pathname);
    if (!matched) return notFound(res);

    await matched.handler(req, res, matched.params, url, user);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      html(res, v.layout({
        title: 'Error',
        user: null,
        body: v.errorPage({ status: 500, message: 'Something went wrong on the server.' }),
      }), 500);
    }
  }
});

server.listen(config.port, config.host, () => {
  console.log(`Bonfire Adventures prototype`);
  console.log(`  http://${config.host}:${config.port}`);
  console.log(`  packages: ${db.packages.length}   destinations: ${db.destinations.length}`);
  console.log(`  WhatsApp entry: ${config.whatsappNumber ? `ON (${config.whatsappPlacement})` : 'OFF (no number configured)'}`);
  console.log(`  staff account: ${db.users.some((u) => u.role === 'staff') ? 'seeded' : 'none (set ADMIN_HANDLE/ADMIN_PASSWORD)'}`);
});
