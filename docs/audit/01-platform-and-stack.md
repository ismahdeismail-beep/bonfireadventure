# 01 — Platform & stack

**Status: CONFIRMED** (from asset URLs, inline scripts and response headers).

## Summary

The live site is a **WordPress site built with Elementor / Elementor Pro**, using
the **Nicdark "Love Travel"** theme, and extended with a small set of plugins.
There is **no booking engine** and **no functioning commerce or account layer**.

## Platform

| Layer | What's there | Evidence |
|---|---|---|
| CMS | WordPress (core sitemaps enabled at `wp-sitemap.xml`) | `evidence/sitemap-index.xml` |
| Page builder | Elementor + Elementor Pro | `wp-content/plugins/elementor`, `elementor-pro` |
| Theme | Nicdark **Love Travel** (`lovetravel`) | `wp-content/themes/lovetravel`; CPTs `nd_travel_cpt_1/2/3` |
| Server | Apache, HTTP/2, PHP 8.3.33 (`x-powered-by: PHP/8.3.33`) | response headers |
| Media | Timestamped uploads under `/wp-content/uploads/2026/…` | page HTML |

The `nd_travel_cpt_*` custom post types confirm the Nicdark travel theme is the
source of the package / destination content model:

- `nd_travel_cpt_1` → **packages** (43 entries)
- `nd_travel_cpt_2` → **typologies** (10 taxonomy terms — theme demo data)
- `nd_travel_cpt_3` → **destinations** (31 entries)

## Plugins observed loading on rendered pages

| Plugin | Role | Relevance |
|---|---|---|
| `elementor` / `elementor-pro` | Layout, popups, forms | The "Subscribe" CTA is an Elementor popup |
| `lovetravel` (theme) | Content model + templates | Root of the "Elementor Demos" demo footer (F-01) |
| `creame-whatsapp-me` (**Joinchat**) | Floating WhatsApp widget | **This is the WhatsApp-everywhere mechanism** (F-06) |
| `dflip` | Flip-book / PDF magazines | Powers the brochures/publications viewer |
| `contact-form-7` (wpcf7) | Forms | The enquiry form; no CAPTCHA detected |
| `testimonials-carousel-elementor` | Reviews carousel | Homepage "Reviews & Testimonials" |
| `jeg-elementor-kit`, `unlimited-elements-for-elementor-premium`, `elementskit` | Extra Elementor widgets | Widget inventory |
| `google-site-kit` | Analytics (`gtag`) | Measurement/pixel layer |

## Commerce and accounts — present but non-functional

WooCommerce page templates exist (`/shop/`, `/shop-2/`, `/cart/`, `/checkout/`,
`/my-account/`, plus duplicated `-2` variants), but:

- `/shop/` **301-redirects to the homepage**; `/shop-2/` loads with **no products**.
- No `add-to-cart`, no product loop markup, no cart/checkout functionality.
- `/my-account/` renders a page titled "My account" with **no login form, no
  registration, no password reset** — grep for username/password/login fields
  returns nothing.

**Conclusion:** WooCommerce is installed as scaffolding only. Neither booking nor
customer accounts exist today. This is the baseline against which requirements
3 and 4 in `docs/requirements/` are written.

## Security baseline (headers)

Response headers on the homepage show **no** `Content-Security-Policy`, **no**
`Strict-Transport-Security`, **no** `X-Frame-Options`, and they disclose
`x-powered-by: PHP/8.3.33` and `server: Apache`.

This matters specifically for the login requirement: any account page added on
top of this baseline would be framable (clickjacking) and would have no transport
or content-integrity hardening. See `04-authentication-and-accounts.md`.

## Login surface

- `/wp-login.php` returns **404** (default login path blocked or moved).
- `/my-account/` exists but has no authentication UI.

So there is currently **no usable login surface at all** — for visitors or staff.
