# 0004 — Account & authentication direction

- **Status:** **Proposed** — needs client input
- **Date:** 2026-10-16
- **Source:** client instruction — *"then users logins need to be fine too"*

## Context

No usable login exists: `/wp-login.php` → 404, and `/my-account/` contains no
login/registration/reset form (F-08). WooCommerce account pages exist as empty,
duplicated shells (F-07). The site's response headers carry no CSP, HSTS or
`X-Frame-Options`, and disclose the PHP version — a weak baseline for any auth
surface.

Accounts and bookings are interdependent (a customer wants to see their
bookings), so this decision is taken alongside ADR-0003.

## Options

### A — Native WordPress users
Use WordPress's user system (as WooCommerce would have).
- ✅ Free, integrated with the CMS; roles built in.
- ❌ WordPress users are a frequent attack target; needs hardening
  (login path, rate limiting, 2FA, no user enumeration — the site currently
  exposes `/wp-sitemap-users-1.xml`, F-20).

### B — Booking-engine accounts
Let the chosen booking engine (ADR-0003) own customer identity.
- ✅ Booking and identity align naturally; fewer moving parts; the engine handles
  email verification and resets.
- ❌ Staff/admin still needs a CMS admin; two identity surfaces to secure.

### C — Dedicated identity layer
A separate auth service (e.g. an IdP) federating into both CMS and booking.
- ✅ Security best-practice; SSO possible; scales.
- ❌ Most work; over-engineered for current scale.

## Recommendation

**Option B**, i.e. let the booking engine own **customer** accounts, while staff/
admin keep a **separate, hardened** CMS admin surface — with **Option A as the
fallback** if the chosen engine's accounts prove insufficient. In all cases the
security requirements R4.5–R4.12 are non-negotiable:

- HTTPS + HSTS, `HttpOnly`/`SameSite` sessions, session regeneration on login.
- Brute-force throttling on login and reset.
- Modern password hashing; no account-existence leakage in errors.
- `X-Frame-Options`/CSP `frame-ancestors` + a CSP on authenticated routes.
- Strict customer vs staff role separation.

## Consequences

- The `-2` duplicate account pages are deleted; there is **one** account surface.
- If guests can book (open question in Requirement 4), accounts link to bookings
  after the fact rather than being mandatory upfront.
- Even if WordPress handles accounts, the current `/wp-login.php` 404 and the
  public users sitemap must be resolved so the login route works without
  re-exposing enumeration.

## Open

1. Is an account **required** to book, or optional (guest booking + later link)?
2. Any existing customer data to import? (None is usable on the site today.)
3. Do staff need a bookings console inside the CMS, or standalone?
