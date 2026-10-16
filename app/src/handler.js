import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { destinations as SEED_DESTINATIONS, packages as SEED_PACKAGES } from './seed.js';
import { initStore, describeStore, driverName, updateUser } from './db.js';
import {
  html, redirect, send, notFound, readForm, json, securityHeaders,
} from './http.js';
import {
  context, verifyCsrf, attemptLogin, registerUser,
  createSession, destroySession, createResetToken, consumeResetToken,
  changeOwnPassword,
} from './auth.js';
import {
  quote, formatMoney,
} from './pricing.js';
import {
  createBooking, findBookingByRef, bookingsForUser, sweepExpired,
  setStatus, allBookings,
} from './bookings.js';
import * as v from './views.js';

let readyPromise = null;
let readyError = null;
let catalogue = { destinations: SEED_DESTINATIONS, packages: SEED_PACKAGES };

async function ensureReady() {
  if (readyError) throw new Error(readyError);
  if (!readyPromise) {
    readyPromise = (async () => {
      try {
        await initStore();
        catalogue = { destinations: SEED_DESTINATIONS, packages: SEED_PACKAGES };
        v.setDestinations(catalogue.destinations);

        if (process.env.VERCEL !== "1" && !process.env.VERCEL_ENV) {
          const SWEEP_EVERY_MS = 10 * 60 * 1000;
          setInterval(() => {
            sweepExpired().catch((error) => console.error("sweep failed:", error.message));
          }, SWEEP_EVERY_MS).unref();
        }
        return { ok: true };
      } catch (e) {
        readyError = `ensureReady failed: ${e && e.message || e}`;
        throw e;
      }
    })();
  }
  try {
    return await readyPromise;
  } catch (e) {
    throw e;
  }
}

// make sure the original function name isn't duplicated 
/* ------------------------------------------------------------------ helpers */

function findPackage(slug) {
  return catalogue.packages.find((p) => p.slug === slug) || null;
}

function findDestination(slug) {
  return catalogue.destinations.find((d) => d.slug === slug) || null;
}

function packagesForDestination(slug) {
  return catalogue.packages.filter((p) => p.destination === slug);
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
  ['GET', '/healthz', async (req, res) => {
    let loadError = null;
    try { await ensureReady(); } catch (e) { loadError = e && e.message || String(e); }
    json(res, {
      ok: !loadError,
      store: driverName,
      packages: catalogue.packages.length,
      ...(loadError ? { loadError } : {}),
    });
  }],

  ['GET', '/styles.css', (req, res) => serveStatic(res, 'styles.css', 'text/css; charset=utf-8')],
  ['GET', '/app.js', (req, res) => serveStatic(res, 'app.js', 'text/javascript; charset=utf-8')],

  ['GET', '/favicon.webp', (req, res) => serveStatic(res, 'favicon.webp', 'image/webp')],
  ['GET', '/manifest.webmanifest', (req, res) => serveStatic(res, 'manifest.webmanifest', 'application/manifest+json')],
  ['GET', '/img/:file', (req, res, params) => {
    const dir = path.join(config.publicDir, 'img');
    const full = path.join(dir, params.file);
    if (!full.startsWith(dir) || !fs.existsSync(full)) return notFound(res);
    send(res, 200, fs.readFileSync(full), {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
  }],

  ['GET', '/', (req, res, _p, url, ctx) => {
    html(res, v.layout({
      title: 'Home',
      user: ctx.user,
      body: v.homePage({ packages: catalogue.packages, destinations: catalogue.destinations, user: ctx.user }),
    }));
  }],

  ['GET', '/packages', (req, res, _p, url, ctx) => {
    const filters = {
      destination: url.searchParams.get('destination') || '',
      category: url.searchParams.get('category') || '',
      q: url.searchParams.get('q') || '',
      excludeExpired: url.searchParams.get('hide') === 'expired',
    };
    html(res, v.layout({
      title: 'Packages',
      user: ctx.user,
      body: v.packagesPage({ packages: catalogue.packages, destinations: catalogue.destinations, filters, user: ctx.user }),
    }));
  }],

  ['GET', '/packages/:slug', (req, res, params, _url, ctx) => {
    const pkg = findPackage(params.slug);
    if (!pkg) return notFound(res);
    html(res, v.layout({
      title: pkg.title,
      user: ctx.user,
      body: v.packageDetail({ pkg, destination: findDestination(pkg.destination), user: ctx.user }),
    }));
  }],

  ['POST', '/packages/:slug/book', async (req, res, params, _url, ctx) => {
    const pkg = findPackage(params.slug);
    if (!pkg) return notFound(res);
    const form = await readForm(req);
    if (!verifyCsrf(ctx, form.csrf)) return redirect(res, `/packages/${pkg.slug}?err=Your session expired. Please try again.`);

    const result = await createBooking(pkg, {
      optionId: form.optionId,
      startDate: form.startDate,
      adults: Number(form.adults),
      children: Number(form.children),
      extraIds: [].concat(form.extraIds || []),
      travellerName: String(form.travellerName || (ctx.user ? ctx.user.name : '')).trim(),
      forSomeoneElse: form.forSomeoneElse === '1',
    }, ctx.user);

    if (!result.ok) {
      return redirect(res, `/packages/${pkg.slug}?err=${encodeURIComponent(result.errors[0])}`);
    }
    redirect(res, `/bookings/${result.booking.ref}?ok=1`);
  }],

  ['GET', '/api/quote', (req, res, _p, url) => {
    const pkg = findPackage(url.searchParams.get('slug'));
    if (!pkg) return json(res, { ok: false, error: 'Unknown package' }, 404);
    const priced = quote(pkg, {
      optionId: url.searchParams.get('option'),
      adults: Number(url.searchParams.get('adults') || 1),
      children: Number(url.searchParams.get('children') || 0),
      extraIds: (url.searchParams.get('extras') || '').split(',').filter(Boolean),
    });
    if (!priced.ok) return json(res, { ok: false, error: priced.error }, 400);
    json(res, {
      ok: true,
      currency: priced.currency,
      lines: priced.lines.map((l) => ({ label: l.label, amount: formatMoney(l.amount, priced.currency) })),
      total: formatMoney(priced.total, priced.currency),
      deposit: formatMoney(priced.deposit, priced.currency),
      balance: formatMoney(priced.balance, priced.currency),
    });
  }],

  ['GET', '/destinations', (req, res, _p, _url, ctx) => {
    html(res, v.layout({
      title: 'Destinations',
      user: ctx.user,
      body: v.destinationsPage({ destinations: catalogue.destinations, packages: catalogue.packages }),
    }));
  }],

  ['GET', '/destinations/:slug', (req, res, params, _url, ctx) => {
    const dest = findDestination(params.slug);
    if (!dest) return notFound(res);
    html(res, v.layout({
      title: dest.name,
      user: ctx.user,
      body: v.destinationDetail({ destination: dest, packages: packagesForDestination(dest.slug) }),
    }));
  }],

  ['GET', '/offers', (req, res, _p, _url, ctx) => {
    html(res, v.layout({ title: 'Offers', user: ctx.user, body: v.offersPage({ packages: catalogue.packages }) }));
  }],

  ['GET', '/how-booking-works', (req, res, _p, _url, ctx) => {
    html(res, v.layout({ title: 'How booking works', user: ctx.user, body: v.howBookingWorksPage() }));
  }],

  ['GET', '/bookings/:ref', async (req, res, params, url, ctx) => {
    const booking = await findBookingByRef(params.ref);
    if (!booking) return notFound(res);
    html(res, v.layout({
      title: `Booking ${booking.ref}`,
      user: ctx.user,
      flash: flashFromUrl(url),
      body: v.bookingPage({ booking, pkg: findPackage(booking.packageId) }),
    }));
  }],

  /* ------------------------------------------------------------------ auth */

  ['GET', '/account/login', (req, res, _p, url, ctx) => {
    if (ctx.user) return redirect(res, '/account');
    html(res, v.layout({
      title: 'Log in',
      user: ctx.user,
      body: v.loginPage({ error: url.searchParams.get('err') }),
    }));
  }],

  ['POST', '/account/login', async (req, res, _p, _url, ctx) => {
    const form = await readForm(req);
    if (!verifyCsrf(ctx, form.csrf)) return redirect(res, '/account/login?err=Your session expired.');
    const result = await attemptLogin(req, form.handle, form.password);
    if (!result.ok) return redirect(res, `/account/login?err=${encodeURIComponent(result.error)}`);
    await createSession(res, result.user.id);
    redirect(res, '/account?ok=Signed in.');
  }],

  ['GET', '/account/register', (req, res, _p, url, ctx) => {
    if (ctx.user) return redirect(res, '/account');
    html(res, v.layout({
      title: 'Create account',
      user: ctx.user,
      body: v.registerPage({ errors: url.searchParams.get('err') ? [url.searchParams.get('err')] : [] }),
    }));
  }],

  ['POST', '/account/register', async (req, res, _p, _url, ctx) => {
    const form = await readForm(req);
    if (!verifyCsrf(ctx, form.csrf)) return redirect(res, '/account/register?err=Your session expired.');
    const result = await registerUser({
      handle: form.handle,
      name: form.name,
      password: form.password,
      consent: form.consent === '1',
    });
    if (!result.ok) return redirect(res, `/account/register?err=${encodeURIComponent(result.errors[0])}`);
    await createSession(res, result.user.id);
    redirect(res, '/account?ok=Account created.');
  }],

  ['POST', '/account/logout', async (req, res, _p, _url, ctx) => {
    const form = await readForm(req);
    if (verifyCsrf(ctx, form.csrf)) await destroySession(req, res);
    redirect(res, '/?ok=Signed out.');
  }],

  ['GET', '/account', async (req, res, _p, url, ctx) => {
    if (!ctx.user) return redirect(res, '/account/login');
    html(res, v.layout({
      title: 'Your account',
      user: ctx.user,
      flash: flashFromUrl(url),
      body: v.accountPage({ user: ctx.user, bookings: await bookingsForUser(ctx.user.id) }),
    }));
  }],

  ['POST', '/account/profile', async (req, res, _p, _url, ctx) => {
    if (!ctx.user) return redirect(res, '/account/login');
    const form = await readForm(req);
    if (!verifyCsrf(ctx, form.csrf)) return redirect(res, '/account/settings?err=Your session expired.');
    const name = String(form.name || '').trim().slice(0, 80);
    if (name.length < 2) return redirect(res, '/account/settings?err=Please enter a name.');
    await updateUser(ctx.user.id, { name });
    redirect(res, '/account?ok=Profile updated.');
  }],

  ['GET', '/account/settings', (req, res, _p, url, ctx) => {
    if (!ctx.user) return redirect(res, '/account/login');
    html(res, v.layout({
      title: 'Account settings',
      user: ctx.user,
      flash: flashFromUrl(url),
      body: v.settingsPage({ user: ctx.user }),
    }));
  }],

  ['POST', '/account/settings/name', async (req, res, _p, _url, ctx) => {
    if (!ctx.user) return redirect(res, '/account/login');
    const form = await readForm(req);
    if (!verifyCsrf(ctx, form.csrf)) return redirect(res, '/account/settings?err=Your session expired.');
    const name = String(form.name || '').trim().slice(0, 80);
    if (name.length < 2) return redirect(res, '/account/settings?err=Please enter a name.');
    await updateUser(ctx.user.id, { name });
    redirect(res, '/account?ok=Name updated.');
  }],

  ['POST', '/account/settings/password', async (req, res, _p, _url, ctx) => {
    if (!ctx.user) return redirect(res, '/account/login');
    const form = await readForm(req);
    if (!verifyCsrf(ctx, form.csrf)) return redirect(res, '/account/settings?err=Your session expired.');
    const result = await changeOwnPassword(ctx.user.id, form.current, form.password, ctx.session.id);
    if (!result.ok) return redirect(res, `/account/settings?err=${encodeURIComponent(result.error)}`);
    redirect(res, '/account?ok=Password changed — your other devices were signed out.');
  }],

  ['GET', '/account/password', (req, res, _p, url, ctx) => {
    html(res, v.layout({
      title: 'Reset password',
      user: ctx.user,
      body: v.resetRequestPage({ message: url.searchParams.get('ok'), token: url.searchParams.get('token') }),
    }));
  }],

  ['POST', '/account/password', async (req, res, _p, _url, ctx) => {
    const form = await readForm(req);
    if (!verifyCsrf(ctx, form.csrf)) return redirect(res, '/account/password?err=Your session expired.');
    const result = await createResetToken(form.handle);
    const tokenPart = result.token ? `&token=${result.token}` : '';
    redirect(res, `/account/password?ok=If that account exists, a reset link has been created.${tokenPart}`);
  }],

  ['GET', '/account/password/:token', (req, res, params, _url, ctx) => {
    html(res, v.layout({
      title: 'Set a new password',
      user: ctx.user,
      body: v.resetSetPage({ token: params.token, error: null, done: false }),
    }));
  }],

  ['POST', '/account/password/:token', async (req, res, params, _url, ctx) => {
    const form = await readForm(req);
    if (!verifyCsrf(ctx, form.csrf)) return redirect(res, `/account/password/${params.token}?err=Your session expired.`);
    const result = await consumeResetToken(params.token, form.password);
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

  ['GET', '/staff', async (req, res, _p, _url, ctx) => {
    if (!ctx.user) return redirect(res, '/account/login');
    if (ctx.user.role !== 'staff') return notFound(res);
    html(res, v.layout({ title: 'Travel desk', user: ctx.user, body: v.staffPage({ bookings: await allBookings() }) }));
  }],

  ['POST', '/staff/bookings/:ref/status', async (req, res, params, _url, ctx) => {
    if (!ctx.user || ctx.user.role !== 'staff') return notFound(res);
    const form = await readForm(req);
    if (!verifyCsrf(ctx, form.csrf)) return redirect(res, '/staff?err=Your session expired.');
    const booking = await findBookingByRef(params.ref);
    if (!booking) return notFound(res);
    await setStatus(booking, form.status, ctx.user.handle);
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

export async function handleRequest(req, res) {
  try {
    await ensureReady();

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    v.setCurrentRoute(url.pathname);
    const ctx = await context(req, res);
    v.setCsrf(ctx.session.csrf);

    if (!['GET', 'POST'].includes(req.method)) {
      return send(res, 405, 'Method not allowed', { Allow: 'GET, POST', ...securityHeaders() });
    }

    const matched = matchRoute(req.method, url.pathname);
    if (!matched) return notFound(res);

    await matched.handler(req, res, matched.params, url, ctx);
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
}

export default handleRequest;