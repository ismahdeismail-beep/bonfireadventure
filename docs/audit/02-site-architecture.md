# 02 — Site architecture

**Status: CONFIRMED** from the site's own sitemaps and HTTP probes.

The site is not a landing page. It is a content + package-discovery site with
archive pages, detail pages, publications and enquiry channels.

## Top-level structure

```
Homepage (/)
│
├── Destinations
│     ├── /destinations/                     archive
│     └── /destinations/<destination>/       31 detail pages
│
├── Packages
│     ├── /packages/                         archive
│     └── /packages/<package>/               43 detail pages
│
├── Publications
│     └── /brochures/                        flip-book publications
│
├── Company
│     ├── /about-us/                         (+ #story, #whyBonfire anchors)
│     ├── /reviews-testimonials/
│     └── /prices/
│
├── Contact
│     └── /contact-us/
│
├── Commerce (non-functional shells)
│     ├── /shop/ (301 → /)   /shop-2/
│     ├── /cart/   /checkout/   /my-account/
│     └── /cart-2/ /checkout-2/ /my-account-2/
│
├── Blog (demo content)
│     └── 6 posts incl. /hello-world/       nav "Blog" points elsewhere (F-14)
│
└── Orphan / demo / builder leftovers
      /sample-page/ /home-2/ /test/ /test-2/ /search-page/ /services/
      /packages-preview-layout/ /destinations-preview-layout/
      /flip-box-carousel-with-a-trigger-button/
```

## Content model

| Content type | Count | Notes |
|---|---|---|
| Packages (`nd_travel_cpt_1`) | 43 | Coastal, safari, international, seasonal |
| Destinations (`nd_travel_cpt_3`) | 31 | Kenya + Africa + international |
| Typologies (`nd_travel_cpt_2`) | 10 | Theme demo taxonomy (cultural, beach, eco…) — **not used in navigation** |
| Blog posts | 6 | Theme demo posts (see `inventory/blog-posts.md`) |
| Pages | 22 | Mixed real pages + demo/builder pages |

## Conversion intent (as currently built)

Every discovery path funnels to a **conversation**, not a checkout:

```
Discover (homepage / destinations)
   → Browse packages (/packages/)
   → View a package (/packages/<slug>/)
   → Enquire via WhatsApp  ← the only real conversion action
```

There is no cart, no reservation, no date/availability step, no payment and no
account. See `07-contact-and-booking-audit.md`.

## Duplication already visible in the IA

- Two shop systems: `/shop/` (dead) and `/shop-2/` (live).
- Duplicated WooCommerce pages: `cart`/`cart-2`, `checkout`/`checkout-2`,
  `my-account`/`my-account-2`.
- Two Europe destinations: `/destinations/europe/` and
  `/destinations/europe-destinations/` (F-15).
- Two near-identical Mombasa packages: `2026-sgr-mombasa` and
  `2026-sgr-mombasa-august-holiday-deals` (F-16).
- A `prices` page plus price data already on packages and the homepage (F-11).
