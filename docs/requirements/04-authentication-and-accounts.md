# Requirement 4 — Working accounts & authentication

**Source constraint:** *"then users logins need to be fine too."*

## Intent

There is currently **no usable login of any kind**: `/wp-login.php` returns 404,
and `/my-account/` has no login, registration or password-reset form (F-08). The
WooCommerce account pages exist as empty shells, duplicated (`my-account`,
`my-account-2`) (F-07).

"Fine" means: a customer can create an account, log in, see their bookings,
manage their details and log out — securely, and without the site being a
security liability.

## Requirements

### Accounts

- **R4.1** Customers can **register**, **log in**, **reset a password** and
  **log out** from a first-class account page (not a hidden default path).
- **R4.2** A logged-in customer can see their **booking history and status**
  (ties directly into Requirement 3).
- **R4.3** A customer can view/update their profile details.
- **R4.4** Account pages are reachable from the main navigation in a predictable
  way, and there is **one** account page (no `-2` duplicates).

### Security (given the current baseline)

The live site currently sends **no** `Content-Security-Policy`, **no**
`Strict-Transport-Security` and **no** `X-Frame-Options`, and discloses the PHP
version. Login surfaces must not inherit that.

- **R4.5** All auth traffic is HTTPS-only, with HSTS enabled.
- **R4.6** Login and password-reset endpoints are protected against brute force
  (rate limiting / lockout / throttling).
- **R4.7** Passwords are stored with a modern KDF; no plaintext or weak hashes.
- **R4.8** Sessions use secure, `HttpOnly`, `SameSite` cookies; session
  fixation is prevented (regenerate on login).
- **R4.9** Account and login pages are protected against clickjacking
  (`X-Frame-Options`/`frame-ancestors`).
- **R4.10** A CSP is in place at least on authenticated routes.
- **R4.11** Registration and password-reset are protected from abuse (email
  verification and/or anti-automation); error messages don't leak whether an
  account exists.
- **R4.12** Roles are separated: **customer** vs **staff/admin**, with least
  privilege.

### Compliance

- **R4.13** Registration captures explicit consent, and personal data has a
  defined retention/export/delete path (populated with what Requirement 3
  stores).

## Acceptance criteria

1. A new user registers, verifies, logs in, books a package, logs out, logs back
   in and sees the booking in their account.
2. Password reset works end-to-end; the reset link is single-use and expires.
3. Repeated failed logins are throttled/locked.
4. Response headers on auth routes include HSTS, `X-Frame-Options` (or CSP
   `frame-ancestors`) and a CSP.
5. No `-2` duplicate account pages remain; `/wp-login.php` no longer returns a
   bare 404 that breaks the login *flow* (it may be hidden, but the real login
   route must work).
6. A logged-in customer cannot reach staff/admin capabilities; a staff role
   cannot exceed its permissions.

## Interdependency

Requirement 4 and Requirement 3 must be decided **together** — the booking engine
choice determines where accounts live (native WordPress users vs. the booking
provider's accounts vs. a headless identity layer). See
`../decisions/0004-account-and-auth-direction.md`.

## Non-goals

- Social/SSO login (nice-to-have, not required).
- Migration of any existing accounts (there are none usable).

## Open items

1. Must a booking require an account, or can guests book and link later?
2. Is there any existing customer data elsewhere (offline/CRM) to import?
3. Should staff log in through the same system or a separate admin surface?
