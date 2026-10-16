# 07 — Contact, booking & enquiries

**Status: CONFIRMED for the mechanisms present. Values are redacted per repo
policy — this document describes contact *surfaces*, not their contents.**

## What contact surfaces exist today

| Surface | Where | Mechanism |
|---|---|---|
| Utility bar | every page | 3 phone numbers, 1 email, 1 office address |
| Footer | every page | 1 phone, 1 email, "Open 24 hours" |
| Contact page | `/contact-us/` | head office + **9 branch offices**, **5 phone lines**, email, contact form, map link, social block |
| Enquiry form | `/contact-us/` | Contact Form 7 (`wpcf7`), **no CAPTCHA** observed |
| Floating WhatsApp | **every page** | Joinchat plugin (`creame-whatsme`) |
| Inline WhatsApp CTAs | homepage, package cards, package pages, header promo, final CTA | `wa.me` deep links with **hard-coded** numbers |
| Newsletter | homepage + footer | Elementor popup → email capture |

## The booking reality

**There is no booking system.** Concretely:

- No booking/reservation plugin is loaded (no Amelia, Booked, WooCommerce
  Bookings, appointments — checked).
- No date/availability selector, no traveller count, no price computation.
- No cart, no checkout flow that works (`/shop/` → homepage; `/shop-2/` empty).
- No payment integration in the conversion path.
- No confirmation/reservation state — nothing persists a booking.

Everything routes to **WhatsApp** or the **contact form**. The two paths are
parallel and unconnected: a WhatsApp chat produces no record on the site; a form
submission produces an email with no structured package/date/traveller data.

## WhatsApp is the de-facto checkout — and it's everywhere (F-06)

WhatsApp appears simultaneously as:

1. a **floating widget** on every page (Joinchat),
2. an **inline button** on each package card ("More Info"),
3. an **inline button** on package detail pages,
4. a **button inside the header mega-menu** ("Book via WhatsApp" on the Dubai promo),
5. the **final CTA** band ("Chat with a Travel Expert").

Additionally the numbers are **hard-coded** into links/messages and differ from
each other, and the pre-filled text is generic/incorrect (F-04). This is exactly
the "WhatsApp overlapping everywhere" problem the client called out, and it is
the single behaviour change with the largest conversion and measurement impact.

## Contact-information consistency (F-09)

Contact data is **repeated in multiple templates with different values**:

- utility bar: 3 phone numbers; contact page: 5 phone numbers.
- footer says "Open 24 hours"; contact page says "Mon–Sat 9AM–6PM".
- branch offices (9) appear only on the contact page, never near a booking action.

There is no single source of truth, so the site cannot be kept consistent today.

## Form quality (F-10)

- The contact form renders an apparently **duplicated "Email" field** in the
  captured markup — needs visual confirmation but is a red flag.
- A "Call Now" tel link is **malformed** (an extra leading zero inside the
  international number).
- **No CAPTCHA / anti-spam** on a public form (spam + abuse exposure).
- Contact-page social links are **empty** (no `href`).

## Security posture for enquiry/account surfaces

Homepage responses carry **no** `Content-Security-Policy`, **no**
`Strict-Transport-Security`, **no** `X-Frame-Options`, and disclose the PHP
version. Any future account/login or payment surface would inherit this weak
baseline. See `docs/requirements/04-authentication-and-accounts.md`.

## Pages not in the client's original list

- `/brochures/` (the "Publications" area) — flip-book publications via `dflip`.
- `/reviews-testimonials/` — full reviews page.
- `/prices/` — exists and returns 200 (overlaps packages — F-11).
- `/shop-2/` — returns 200 but has no products.
