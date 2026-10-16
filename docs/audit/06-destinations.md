# 06 — Destinations

**Status: CONFIRMED.**

Destination pages are a custom post type (`nd_travel_cpt_3`, 31 entries), with an
archive at `/destinations/` and a detail page per destination.

## Purpose today

Each destination page presents information about a place and links to packages
associated with it. They are the site's "browse by place" surface.

## Destination set (31)

Kenya: North Coast, Diani/Ukunda, Malindi, Mombasa North Coast, Maasai Mara,
Tsavo, Samburu, Amboseli, Mount Kenya, Naivasha, Nakuru, Seasonal Offers.

Africa / Indian Ocean / Middle East: Zanzibar, South Africa, Rwanda, Egypt*,
Morocco, Mauritius, Dubai/UAE, Qatar, Jordan.

International: Italy, Europe*, Europe Destinations*, Thailand, Vietnam, Turkey,
Bali/Indonesia, Hong Kong, Kuala Lumpur/Malaysia, Canton Fair (China).

\* see findings.

## Findings

- **F-13 (high):** the navigation links to `/destinations/egypt/`, but that URL
  **301-redirects to `/destinations/diani-ukunda/`**. Clicking "Egypt" lands the
  visitor on the Diani page. A destination listed in the primary menu therefore
  has no page, and silently misdirects.
- **F-15 (low):** two Europe destinations coexist —
  `/destinations/europe/` **and** `/destinations/europe-destinations/` — both
  return 200. Duplicate/overlapping destination content.
- **F-21 (low):** the mega-menu's "Watamu" entry has **no Watamu destination
  page**; it points at the generic North Coast page, which is also what "North
  Coast" points at.
- **F-02 (high):** on the homepage's Popular Destinations grid, destination
  **titles** all link to `/destinations/samburu/`; only the images link to the
  right page.
- **F-17 (low):** destination card copy is duplicated — Mount Kenya and South
  Africa carry identical descriptions.
- The `typologies` taxonomy (`/typologies/beach-holidays/` etc., 10 terms) is
  live and returns 200 but is **not reachable from navigation** — orphaned theme
  demo taxonomy.

## Relationship to packages

Destination pages and package pages both describe holidays, and the
"Tours & Packages" mega-menu links into destination pages for some entries
(Amboseli, Tsavo, Bali, Hongkong). Resolving the **destination ↔ package**
relationship (which is canonical, how they cross-link, which one ranks) is part
of the IA decision in `docs/requirements/`, and is the root of finding F-11.

## Inventory

All 31 destination URLs are listed in `docs/inventory/destinations.md`.
