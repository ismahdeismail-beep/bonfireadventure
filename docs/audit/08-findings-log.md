# 08 — Findings log

Every observation from the audit, recorded once, with severity and evidence.
These are **findings**, not yet approved changes. Severity scale:

- **S1 Critical** — actively damages trust, revenue or security.
- **S2 High** — materially breaks discovery, pricing or conversion.
- **S3 Medium** — inconsistency or quality issue users will notice.
- **S4 Low** — hygiene, cleanup, minor consistency.

Captured 2026-10-16.

---

## S1 — Critical

### F-01 — Theme-demo content is live in production
A leftover "Best Travel Theme / Elementor Demos" block renders **below the real
footer** on the homepage, `/packages/` and `/contact-us/`. It contains six
nicdark demo links plus **a foreign address, an unrelated email address and
unrelated phone numbers** belonging to a different business, and an "Our
Contacts" block for that other business.
**Impact:** looks broken/untrustworthy; publishes someone else's contact data on
the client's pages.
**Evidence:** homepage / packages / contact-us captures (raw, outside repo).
**Confirm:** scroll to the very bottom of the homepage.

---

## S2 — High

### F-02 — Popular-destination titles all link to Samburu
On the homepage grid, every card **title** points to `/destinations/samburu/`
regardless of the destination (Dubai→Samburu, Mauritius→Samburu, Nakuru→Samburu…).
Only the card image links correctly.
**Impact:** ~7 of 8 destination links send users to the wrong place.
**Evidence:** homepage capture; link extraction.

### F-03 — Every package shows the same placeholder price
The `/packages/` listing shows **"From Ksh. 36,200" on all 10 captured cards**,
including packages priced elsewhere in USD and a Mauritius trip.
**Impact:** listing pricing is meaningless; users cannot compare or trust it.
**Evidence:** `/packages/` capture.

### F-04 — WhatsApp pre-filled messages don't match the package
"More Info" buttons pre-fill a message referring to an **unrelated** package
("Sarova Whitesands – Galentine Getaway…") on cards for Italy, Chale Island,
PrideInn and Hemingways alike.
**Impact:** enquiries arrive context-less/misleading; damages the sales handoff.
**Evidence:** `wa.me` link payloads on homepage cards.

### F-05 — Expired offers still promoted
Homepage cards actively promote validity windows that have passed
(e.g. "6th January – 31st March 2026"; "14th January – 15th March 2026"),
captured in October 2026.
**Impact:** sells unavailable holidays; erodes trust ("still advertising March?").
**Evidence:** homepage card validity lines.

### F-06 — No booking system; WhatsApp is the checkout, scattered everywhere
There is no booking engine, no availability, no reservation, no payment, no
record. WhatsApp appears as a floating widget on every page **plus** inline on
cards, detail pages, inside the mega-menu, and as the final CTA — with different
hard-coded numbers.
**Impact:** no measurable conversion, no lead data, no scalability, and the exact
"WhatsApp overlapping everywhere" problem the client flagged.
**Evidence:** `01-platform-and-stack.md`, plugin fingerprint, all captures.

### F-07 — Commerce layer is a non-functional shell
`/shop/` 301→homepage; `/shop-2/` has no products; `/cart/`, `/checkout/`,
`/my-account/` exist as empty WooCommerce pages, with duplicated `-2` twins.
**Impact:** appears to offer ecommerce/booking that doesn't exist.
**Evidence:** HTTP status matrix; my-account / shop-2 captures.

### F-08 — No usable login surface at all
`/wp-login.php` returns 404; `/my-account/` has **no login, register or
password-reset form**. No authentication UI exists for customers (or staff) via
the website.
**Impact:** cannot support accounts, order history or repeat customers; blocks
requirement 4.
**Evidence:** my-account capture (zero login fields); `/wp-login.php` → 404.

---

## S3 — Medium

### F-09 — Contact details inconsistent across templates
Utility bar carries 3 phone numbers, contact page lists 5; footer says
"Open 24 hours" while the contact page says "Mon–Sat 9AM–6PM".
**Impact:** visitors can't tell which information is correct.
**Evidence:** header/utility-bar vs footer vs `/contact-us/`.

### F-10 — Contact page & footer link/field defects
Contact form renders a duplicated "Email" field; a "Call Now" tel: link is
malformed (extra leading zero inside the international number); FAQ and "Travel
Policies" are non-links; contact-page and footer social links are empty.
**Evidence:** `/contact-us/` capture; footer markup.

### F-11 — Navigation/IA overlap (Destinations vs Packages vs Prices vs Shop)
Four surfaces present holiday discovery with unclear boundaries; the
"Tours & Packages" mega-menu links into `/destinations/` pages for several
entries; "Stay Cations" is used as a bucket for ~19 international destinations.
**Impact:** unpredictable click targets; duplicated effort; SEO cannibalisation.
**Evidence:** `04-navigation-map.md`.

### F-12 — "Explore All" targets are wrong/inconsistent
International "Explore All" → a *single* Mauritius package; Seasonal
"Explore All" → a single Diani deal; homepage coastal "See Full Collection" →
the **Easter** page; Popular-destinations "Explore All" → `/packages`.
**Impact:** collection links don't lead to collections.
**Evidence:** mega-menu + homepage link extraction.

### F-13 — Egypt nav item redirects to Diani
`/destinations/egypt/` → **301 → `/destinations/diani-ukunda/`**. Egypt is in the
primary destination menu but has no page.
**Impact:** a top-level menu item silently misdirects.
**Evidence:** HTTP status matrix.

### F-14 — "Blog" nav item points to the contact page
Header "Blog" → `/contact-us`; the real blog contains 6 **theme-demo** posts
(including WordPress's default `hello-world`).
**Impact:** misleading nav; a blog that isn't a blog.
**Evidence:** nav extraction; `inventory/blog-posts.md`.

### F-18 — Leftover theme demo *copy* inside the homepage
An "International Destinations" block contains theme demo text
("Leading Tour Packages Booking website, Over 30,000 Hotel rooms worldwide…").
**Impact:** off-brand placeholder copy on a live page.
**Evidence:** homepage capture.

---

## S4 — Low / hygiene

### F-15 — Duplicate Europe destinations
`/destinations/europe/` and `/destinations/europe-destinations/` both return 200.

### F-16 — Duplicate Mombasa packages
`2026-sgr-mombasa` and `2026-sgr-mombasa-august-holiday-deals` are the same
package (image, copy, price).

### F-17 — Duplicated/incorrect copy
Diani SGR card describes Watamu/Malindi; Mount Kenya and South Africa share
identical description text; several destination descriptions are templated.

### F-19 — Counters read "0" without JS
The "Why Travel With Bonfire" statistics render as literal `0 +` / `0 K+` in the
static capture; they depend on a JS count-up. Verify they always animate and are
readable if JS is blocked.

### F-20 — Author enumeration & feed exposure
`/wp-sitemap-users-1.xml` is public and `/feed/` is open.
**Impact:** minor information disclosure; standard WordPress hardening.

### F-21 — Watamu has no destination page
Mega-menu and footer "Watamu" both point at the generic North Coast page.

### F-22 — Trailing-slash inconsistency causes 301 hops
Nav links omit the trailing slash (e.g. `/packages/watamu-malindi-2026-deals`),
each costing a redirect hop to the canonical `/…/` URL.

### F-23 — Dead menu link
"Nairobi" under Stay Cations points to `#`.

### F-24 — "How Booking Works" section has no visible content
The heading renders but no steps were present in the static capture — either
empty, JS-injected, or an unpopulated widget. Needs a browser check.

---

## Findings by theme

| Theme | Findings |
|---|---|
| Content left over from the theme/template | F-01, F-14, F-15, F-18, F-20 |
| Broken or wrong links/redirects | F-02, F-12, F-13, F-22, F-23 |
| Pricing & offer accuracy | F-03, F-05, F-16, F-17 |
| Contact consistency & quality | F-04, F-09, F-10 |
| Booking / conversion | F-06, F-07 |
| Accounts & authentication | F-08 |
| Information architecture | F-11 |
| Front-end robustness | F-19, F-24 |

## Count

**24 findings: 1 S1, 7 S2, 7 S3, 9 S4.**

## What is deliberately *not* in this log
Anything requiring a rendered browser to judge — hover/animation behaviour,
mobile stacking, image cropping, floating-widget overlap, real Lighthouse
scores, keyboard/focus order, colour contrast. Those are tracked, with method,
in `09-open-questions.md`.
