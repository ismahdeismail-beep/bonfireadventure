# 04 — Navigation map

**Status: CONFIRMED for link targets; UNVERIFIED for menu interaction**
(hover vs click, mobile accordion behaviour, search dropdown).

Two navigation systems exist: the **header mega-menu** and the **footer columns**
(plus a separate header **search** with a destination dropdown).

---

## Header mega-menu

### Destinations

Grouped under three tabs — **Kenya / Africa / International** — but the rendered
items do not actually sit under those tabs cleanly; the groups render as:

| Group | Items | Notes |
|---|---|---|
| Beach Holidays | North Coast, Diani, **Watamu**, Malindi | "Watamu" → `/destinations/kenya-north-coast/` — **no Watamu page** (F-21) |
| Safari | Maasai Mara, Tsavo, Samburu, Amboseli | |
| Stay Cations | Nairobi(`#`), Mount Kenya, Naivasha, Nakuru, Zanzibar, South Africa, Rwanda, Egypt, Morocco, Mauritius, Dubai, Malaysia, China–Canton Fair, Bali, Vietnam, Turkey, Europe, Thailand, Jordan | Huge, mislabelled group: international destinations filed under "Stay Cations" (F-11) |

> There **is no `/destinations/egypt/`**: it 301-redirects to
> `/destinations/diani-ukunda/` (F-13). The nav still lists Egypt.

### Tours & Packages

| Group | Items | "Explore All" target |
|---|---|---|
| Coastal Escapes | Mombasa North Coast, Diani/Ukunda, Watamu/Malindi | → coastal collection page ✓ |
| Safari Tours | Maasai Mara, Samburu, Amboseli, Tsavo, Nakuru | → `bush-packages-maasai-mara` (a single package) |
| International | South Africa, Mauritius, Dubai, Bali, Hongkong | → `5-days-4-nights-mauritius` (a **single package**) (F-12) |
| Seasonal & Special Deals | Nairobi Marathon 2026, Galentine & Easter 2026, Kuala Lumpur Shopcation, SGR Mombasa, Watamu/Malindi Deals, Diani SGR Deals | → `diani-sgr-2026-deals` (a single deal) |

Note several "Tours & Packages" entries link into **`/destinations/`** pages
(Amboseli, Tsavo, Bali, Hongkong), i.e. the two mega-menus are not cleanly
separated (F-11).

### About Us

- Our Story → `/about-us/#story`
- Why Bonfire → `/about-us/#whyBonfire`
- Reviews/Testimonial → `/reviews-testimonials/`

### Blog

- **"Blog" → `/contact-us`** — the nav item labelled "Blog" points at the contact
  page (F-14). The actual blog posts exist (6 of them) but contain theme-demo
  content, not articles.

### Additionally in the header

- A standalone "Contact Us" link.
- A **search** control with a destination dropdown (a curated static list,
  not the full 31 destination set — e.g. no Watamu, no Turkey, no Jordan).
- The Destinations panel embeds a **"Dubai City Escape – 5 Days" featured promo**
  with a WhatsApp button.

---

## Footer navigation

| Column | Contents | Notes |
|---|---|---|
| Explore Packages | Easter Deals, Bush Packages Maasai Mara, Coastal Beach Packages, Summer Vibes Dubai, Naivasha Weekend Getaway | Package deep-links |
| Destinations | Diani/Ukunda, Watamu, Samburu, Mombasa, Maasai Mara, Dubai & Abu Dhabi, Italy & Vatican | "Watamu" → north-coast again |
| Company | About Bonfire, **Frequently Asked Questions**, **Travel Policies**, Contact Us | FAQ + Travel Policies are **not links** (F-10) |
| Social / badges | X, Facebook, Instagram, TikTok + 4 trust badges | X link empty (F-10) |

Plus the **leftover theme-demo footer** below all of this (F-01).

---

## Navigation overlap — the core IA issue (F-11)

Four separate surfaces present "ways to browse holidays", with unclear
boundaries:

| Surface | What it shows |
|---|---|
| `/destinations/` + detail pages | Places, with related packages |
| `/packages/` | Package listing |
| `/prices/` | Price-led content |
| `/shop-2/` | Another discovery surface (empty of products) |

And `Tours & Packages` mixes links to package pages and destination pages, so
"where am I going when I click this" is not predictable. Deciding the boundary
between *Destinations*, *Packages*, *Offers* and *Shop* is a prerequisite for the
rebuild (see `docs/requirements/`), not something to fix piecemeal.

---

## Link-integrity summary (measured)

| Symptom | Examples | Finding |
|---|---|---|
| Redirect-to-homepage | `/shop/` → `/` | F-07 |
| Wrong redirect target | `/destinations/egypt/` → `/destinations/diani-ukunda/` | F-13 |
| Title links to one fixed destination | all Popular-destination titles → `samburu` | F-02 |
| "Explore All" → single item | International → Mauritius; Seasonal → Diani SGR | F-12 |
| "See Full Collection" → wrong page | Coastal → Easter package | F-12 |
| Dead placeholder link | Nairobi stay-cation → `#` | F-23 |
| Blog nav → contact page | "Blog" → `/contact-us` | F-14 |
| Trailing-slash 301 hops | `/packages/watamu-malindi-2026-deals` etc. | F-22 |
