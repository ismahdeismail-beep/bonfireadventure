# Inventory — Pages

All page URLs the site itself declares in `evidence/sitemap-pages.xml`
(22 pages). Grouped by whether they are real Bonfire pages or leftovers.

## Real, in-use pages

| URL | Purpose | State |
|---|---|---|
| `/` | Homepage | 200 |
| `/about-us/` | Company story, service, testimonials (`#story`, `#whyBonfire`) | 200 |
| `/contact-us/` | Contact details, branches, enquiry form | 200 |
| `/reviews-testimonials/` | Full reviews page | 200 |
| `/brochures/` | Publications / flip-books (`dflip`) | 200 |
| `/prices/` | Price-led content (overlaps packages — F-11) | 200 |
| `/shop-2/` | Shop surface (no products) | 200 |

## Commerce shells (non-functional)

| URL | State |
|---|---|
| `/shop/` | **301 → homepage** (F-07) |
| `/cart/` | 200, empty shell |
| `/checkout/` | 200, empty shell |
| `/my-account/` | 200, **no login form** (F-08) |
| `/cart-2/` | duplicate of `/cart/` |
| `/checkout-2/` | duplicate of `/checkout/` |
| `/my-account-2/` | duplicate of `/my-account/` |

## Demo / builder leftovers (should not be public)

| URL | What it is |
|---|---|
| `/sample-page/` | WordPress default "Sample Page" |
| `/home-2/` | Alternate homepage demo |
| `/test/` | Test page |
| `/test-2/` | Test page |
| `/search-page/` | Builder search-layout demo |
| `/services/` | Unused services demo page |
| `/packages-preview-layout/` | Template preview page |
| `/destinations-preview-layout/` | Template preview page |
| `/flip-box-carousel-with-a-trigger-button/` | Elementor widget demo page |

## Not in the page sitemap (archive templates)

`/packages/` and `/destinations/` return 200 but are CPT archives, not pages,
so they are absent from `sitemap-pages.xml`.

## Note

Every URL above was status-probed; see `evidence/http-status-matrix.md`.
