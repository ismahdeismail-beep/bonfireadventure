# 09 — Open questions & items needing a browser pass

The HTTP-level audit above is complete for content, structure, pricing, links and
the stack. The following **cannot** be judged from static evidence and must be
verified in a real browser (desktop + mobile). They are recorded here so the
audit claims stay honest.

## A. Visual & responsive (needs browser)

| # | To verify | Why it matters |
|---|---|---|
| V-1 | Header behaviour: sticky? dropdown on hover or click? scroll state? | Affects every page |
| V-2 | Mobile menu: accordion? does the 4-level Destinations mega-menu even work on a phone? | The Destinations menu is huge |
| V-3 | Package-card stacking + image cropping on mobile | Core product browsing |
| V-4 | Floating WhatsApp widget position vs other CTAs / cookie banners on mobile | Overlap risk |
| V-5 | The "How Booking Works" section (F-24) — is the step content actually rendered? | It describes a journey that doesn't exist yet |
| V-6 | Animated counters (F-19): do they animate, and are they readable without JS? | Trust section |
| V-7 | Newsletter: Elementor popup behaviour, and whether it overlaps content | Captured as popup trigger |
| V-8 | Colour contrast & focus states (accessibility) | Requirement + legal |
| V-9 | The theme-demo footer (F-01) — confirm it's visible and not CSS-hidden | Determines severity |

## B. Performance (needs browser / Lighthouse)

| # | To measure | Note |
|---|---|---|
| P-1 | Lighthouse mobile score (perf / a11y / best-practices / SEO) | Elementor sites are often heavy |
| P-2 | LCP / CLS / TBT on the homepage and a package page | Counters + carousels + flipbook risk CLS |
| P-3 | Total page weight & image formats | Uploads are `.webp` in places, `.jpg`/`.png` elsewhere — mixed |
| P-4 | Number of render-blocking plugin assets | 8+ plugins load on every page |
| P-5 | Behaviour with JS disabled | Reveals counters/booking-section dependence |

## C. Data-consistency pass (can be done programmatically)

| # | To verify | Reason |
|---|---|---|
| D-1 | For **all 43 packages**: does card price/duration/destination match the detail page? | F-03 implies they won't |
| D-2 | For **all 43 packages**: does the WhatsApp pre-fill name *that* package? | F-04 |
| D-3 | For **all packages/destinations**: any remaining past validity windows? | F-05 |
| D-4 | Click every internal link across the 22 pages + archives, capture 404s/redirects | Only sampled so far |

## D. Account, form & booking behaviour (needs live testing)

| # | To verify | Reason |
|---|---|---|
| B-1 | Contact Form 7: submit path, spam behaviour, where submissions go | No CAPTCHA seen (F-10) |
| B-2 | Confirm `/my-account/` does nothing (no login POST) | Basis of requirement 4 |
| B-3 | Confirm no booking plugin is active on any page | Basis of requirement 3 |
| B-4 | Check `/cart/`, `/checkout/` behaviour when visited directly | F-07 |

## E. Questions for the client

1. **Is the live site the same one being rebuilt, or is there a separate
   in-progress version** we should map instead? (Original open question.)
2. Who currently owns the WhatsApp number(s), and is a single "official" number
   agreed for the new site?
3. Should **Destinations** and **Packages** remain separate top-level sections, or
   should one become the canonical surface?
4. Is **WooCommerce** intended to be used for booking/payment, or is it being
   abandoned in favour of something else?
5. Are the **9 branch offices** to remain on the site (they imply a contact
   surface that Phase 1 must suppress)?
6. What is the source of truth for **package pricing** — it is clearly not the
   listing today (F-03)?
