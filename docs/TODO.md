# TODO — parity with the live site

Living tracker for the rebuild. Every item below came out of a full crawl of
`https://bonfireadventures.com/` (all 120 sitemap URLs, 2026-10-20) compared
against what this build actually ships.

Method and raw captures: see `docs/audit/`. The crawler, per-page records and
the downloaded media library live outside the repo in `/tmp/opencode/bf-*`
(nothing there contains contact details, and nothing there is committed).

Legend: **P0** blocks parity · **P1** visible gap · **P2** polish.

---

## 1. Moving media (video / animation)

The live site ships motion in four different ways. This build ships none of it.

| # | Live behaviour | Found on | Pri | Notes |
|---|---|---|---|---|
| V-1 | Elementor **section background video** `youtu.be/kYF9IefbVk4` (0–79s loop, plays on mobile) | `/`, `/shop` | P1 | **Bonfire's own YouTube channel**, 25s, 4K. Already downloaded + compressed to `/video/bonfire-hero.{mp4,webm}` + poster (3.7 MB / 2.9 MB / 66 KB). |
| V-2 | Elementor section background video `youtu.be/7z4bb5qMC6Q` | `/`, `/shop` | P2 | **Dead — YouTube returns "video not available".** The live homepage therefore renders a broken background. Do not port. Worth telling the client their homepage is broken. |
| V-3 | Real `<iframe>` YouTube embed `LIgWlfeMdVE` ("Love Travel City Tour Demo") | `/home-2` | P2 | Belongs to **NicDark Themes**, a commercial travel theme — **leftover theme demo content**, not Bonfire's. Orphan page, not in the nav. Do not port. |
| V-4 | **Swiper** carousels (253 refs on `/`) — destination sliders, package carousels, testimonial slider | most pages | P1 | Ongoing motion the user perceives as "moving". This build has static grids. |
| V-5 | `testimonials-carousel-elementor` plugin | home pages | P2 | The moving reviews block. |
| V-6 | Elementor **Lottie** player, `elementor-pro/.../animations/default.json` | `/`, `/services` | P2 | Elementor's bundled **placeholder** animation, not custom. Not worth porting. |
| V-7 | **dFlip** 3D flip-book (5 flipbooks: `df_11749`, `df_11963`, `df_11989`, `df_14343`, `df_14345`) | `/`, `/brochures` | P1 | Animated page-turn viewer for the brochures. Same content as §4. |
| V-8 | 90 scroll-in animations (`fadeInUp` ×46, `fadeInRight` ×16, `fadeInLeft` ×6, `fadeIn` ×6) | most pages | P2 | Elementor entrance animations. Must respect `prefers-reduced-motion`. |
| V-9 | Sticky header (12 sticky refs) | all pages | P2 | |

### Decision needed — how to serve video

The CSP is `default-src 'self'` with **no `media-src` and no `frame-src`**
(`app/src/http.js`). That means:

- a **self-hosted** `<video>` works with **no CSP change** — this is why V-1 was
  encoded to our own origin;
- a **YouTube/Vimeo embed is blocked** and would need a `frame-src` exception,
  which contradicts the privacy-first posture (no third-party requests, no
  YouTube cookies/tracking on a booking site).

**Recommendation: self-host (already done for V-1).** V-2/V-3 are dead or
third-party demo content and should not be ported at all.

> Asset is staged at `/tmp/opencode/bf-video/`. The `/video/:file` route and the
> `VIDEO_TYPES` map already exist in `app/src/handler.js` — the files still need
> to be copied to `app/public/video/` and wired into the homepage hero.

- [x] Files copied to `app/public/video/` and served correctly
      (`Accept-Ranges: bytes`, `Content-Type: video/mp4`).
- [x] Verified in Chromium at 390×844: metadata loads (24.47 s, 1280×720),
      `play()` succeeds and frames advance.
- [ ] **P1** Wire the video into the homepage hero as a muted autoplay loop with
      the poster as fallback, behind `prefers-reduced-motion`.
- [ ] **P2** Range requests currently return `200` with the whole file rather than
      `206 Partial Content`. Harmless (video still plays) but it re-sends 3.7 MB
      on every seek; add real range support if the hero goes live.

---

## 2. Services page — entirely missing

The live site has `/services/` with six service cards. This build has **no
`/services` route at all** (`app/src/handler.js`).

Copy (verbatim from the live page, minus contact values):

| Service | Blurb |
|---|---|
| Airline Tickets | "Our travel agency specializes in providing our customers with the best deals on airline tickets." |
| Ocean Cruises | "Luxurious and comfortable way of travel, and passengers can enjoy stunning views of the sea." |
| Means of Transport | "Our travel agency offers a variety of means of transport to get you around your destination safely." |
| Travel itineraries | "Our team of experts will take care of all the planning and logistics, providing you with a detailed itinerary." |
| Travel Insurance | "Travel insurance is an essential part of any trip, providing peace of mind and protection." |
| Local Guide | "We can connect you with guides who will take you off the best path and show you their city." |

Supporting content on the same page:

- H1 "Trip Planning for the Best Travel Experience Possible"
- H2 "Perfect Vacation come True" · H1 "Let us Help you Plan your Next Getaway Now"
- H1 "Our Numbers in the World" + stats: **420** affiliated hotels, **365** days,
  **183** attractions, **254** information and assistance points
- H2 "Contact us for a Quote" / H3 "Plan your Next Trip"

- [ ] **P1** Add a `/services` route + view, reachable from the nav and footer.
- [ ] **P1** Decide whether "Tourist Hotspots" (a live nav item) becomes a
      section on `/services` or its own page.

---

## 3. Photography — 316 assets recovered

Crawled the whole site and pulled **316 media files (56 MB)** into staging.
Only **10** could not be recovered (they existed solely on
`bonfire.virtualkrew.com`, a staging host with **no DNS record**).

### 3a. Placeholder photos to replace (P1)

Four destinations are currently illustrated with **photos borrowed from other
destinations**. Real photos for each were found and downloaded:

| Destination | Currently shows | Real photos recovered |
|---|---|---|
| `zanzibar` | Diani + Malindi photos | `Diani-Destinations1-1/2`, `Diani-Destinations-3`, `e384f8fe-…` |
| `morocco` | Europe + Italy + South Africa | `Hats-Morocco`, `Kasbah-Morocco`, `Minaret-Morocco`, `Morocco-Young-Woman` |
| `qatar` | Dubai + Jordan | `Diani-Destinations1-1/2`, `Diani-Destinations-3`, `e384f8fe-…` |
| `thailand` | Vietnam + Bali + Hong Kong | `Thailand-Bangkok`, `aerial-view-poda-island-krabi-thailand`, `bangkok-…-chao-phraya-river` |

> Note the live site itself borrows Diani photos for Zanzibar and Qatar, so those
> two are a *client-side content gap*, not just ours. Flag it rather than
> silently inventing imagery.

- [ ] **P1** Copy the recovered originals into `app/public/img/` and re-point
      `app/src/seed.js` at them.
- [ ] **P1** `europe` is missing from the destination set under the live slug
      (`europe-destinations`); real photos available (`Featured-Europe`,
      `Plaza-Europe`, `Westminister-Europe`, `Panoramic-Europe`, `Eurpoe-Picnic`).

### 3b. Assets still missing (P2 — dead host)

`Diani-Featured`, `Diani-Sea`, `Dubai-Marina`, `Feature-Mara`, `Hero-Image2`,
`Kuala-Lumpur-1`, `Ukunda1`, `Ukunda2`, `4.jpg`, `11749.jpeg` — request these
from the client, or substitute from the 316 we do have.

### 3c. `Kenyan-Bush.webp` / `Thailand.webp` (done)

Both had been unfetchable for several sessions because the WP media endpoints
answered the anti-bot challenge to plain HTTP clients. Both are now recovered in
staging.

### 3d. Applied in this pass

- [x] Morocco — 4 real photos added (`d-morocco-1…4`).
- [x] Zanzibar — 2 real landscape photos added (`d-zanzibar-2`, `-3`).
- [x] Qatar — 1 real landscape photo added (`d-qatar-1`).
- [x] Thailand — `d-thailand-1` added.
- [x] Europe — 2 more added (`d-europe-9`, `-10`).
- [x] Hero video installed at `app/public/video/` and verified playing.
- [ ] **P2** The live site has **no destination-specific photos** for Zanzibar or
      Qatar at all — it reuses Diani/Dubai stock across pages (verified: Zanzibar
      and Diani share 6 identical image files). Their hero imagery is a client
      content gap, not something we can crawl our way out of.
- [ ] **P2** Thailand still borrows 2 of 3 photos (only `d-thailand-1` is genuinely
      Thai; the other two live images were 236×200 PNG thumbnails, too small to use).

---

## 4. Brochures / publications — missing

Live `/brochures/` ("FEATURED PUBLICATIONS") presents 5 downloadable brochures
in dFlip flip-books. All 5 PDFs are reachable (≈12 MB total):

| Brochure | PDF |
|---|---|
| Bonfire Offers | `2026/10/Bonfire-Offers.pdf` |
| Mashujaa Day Offers | `2026/10/Mashujaa-DAY.pdf` |
| Magazine Mar 2026 | `2026/03/Magazine-Mar-2026-FINAL.pdf` |
| April Travel Deals | `2026/03/APR.pdf` |
| August | `2026/03/AUG.pdf` |

- [ ] **P1** Decide: serve the PDFs, or rebuild as HTML landing pages.
- [ ] **P2** If serving PDFs, **do not commit them** — the live PDFs are flyers
      and almost certainly carry phone numbers/emails, which ADR-0001 forbids.

---

## 5. Taxonomy / discovery — missing

The live site organises packages with three faceted taxonomies plus ten
"typologies". This build has none.

- **Typologies (10):** `adventure-travel`, `beach-holidays`, `budget-travel`,
  `culinary-tourism`, `cultural-tours`, `eco-tourism`, `family-friendly`,
  `heritage-tours`, `road-trips`, `sports-activities`
- **Durations:** `2-days`, `3-days`, `5-days`
- **Difficulty:** `easy`, `medium`
- **Minimum age:** `0`, `5`, `18`

- [ ] **P2** Add typology tags to packages and a browse-by-typology view.
- [ ] **P2** Expose duration / difficulty / min-age as filters on `/packages`.
- [ ] **P3** Live taxonomy archive pages render a **broken "Our Blog" template**
      (they show H1 "Our Blog" with blog posts instead of packages) — a live
      bug we should not reproduce. Verify before copying behaviour.

---

## 6. Footer + nav parity

Live footer has three link groups plus four trust badges; ours is much thinner.

- **EXPLORE PACKAGES:** Easter Holiday Deals · Bush Packages Maasai Mara ·
  Coastal Beach Packages · Summer Vibes Dubai · Naivasha Weekend Getaway
- **DESTINATIONS:** Diani/UKunda · Watamu · Samburu · Mombasa · Maasai Mara ·
  Dubai & Abu Dhabi · Italy & Vatican
- **COMPANY:** About Bonfire Adventures · Frequently Asked Questions ·
  Travel Policies · Contact Us
- **Trust badges:** Secure Booking Process · Transparent Pricing ·
  Trusted Travel Advisors · Established Travel Brand

- [ ] **P1** FAQ page ("Frequently Asked Questions") — no route today.
- [ ] **P2** Travel Policies page — we have Privacy/Terms but not this.
- [ ] **P2** Trust badges in the footer.
- [ ] **P2** "EXPLORE PACKAGES" / "DESTINATIONS" columns as curated links.

---

## 7. Content inventory gaps

- [ ] **P2** 4 live packages not modelled
      (`2026-sgr-mombasa-august-holiday-deals`, `3-days-watamu-malindi-kilifi`,
      `5-days-watamu-malindi`, `nakuru-summer-deals`).
- [ ] **P2** Blog: 6 live posts + `travel-blog` category — **not migrated**
      (previously named as Tier-2 scope).
- [ ] **P2** About Us page has `#story` / `#whyBonfire` anchors worth mirroring.

---

## 8. Deliberately NOT ported (keep this list honest)

| Live thing | Why not |
|---|---|
| WooCommerce `/shop`, `/cart`, `/checkout`, `/my-account` | Replaced by the booking engine + first-party accounts (ADR-0003/0004/0005). |
| `creame-whatsapp-me` / Joinchat floating widget | Consolidated to a single WhatsApp entry point (ADR-0002). |
| `contact-form-7` on `/contact-us` | Replaced by the booking form + quotes. |
| Google Site Kit | Tracking; conflicts with the privacy-first posture. |
| Contact details (phone numbers, the deals mailbox, the office address) | Phase 1 hides all contact surfaces (ADR-0001). |
| `/home-2`, `/test`, `/test-2`, `/sample-page`, `/hello-world`, `/flip-box-carousel-…`, `/destinations-preview-layout`, `/packages-preview-layout`, `/search-page` | Orphan/theme-demo pages, not in the nav. |

---

## 9. Still open from earlier work

- [ ] **P0** **Deployed `/healthz` reports `store: "json"`** — the Vercel project
      has no `STORE` / `SUPABASE_*` env vars, so the live site silently loses
      accounts and bookings on every cold start. Needs the values from
      `app/.env` added in Vercel + a redeploy. (Blocked: `vercel` CLI not logged
      in, no `.vercel` link.)
- [ ] **P1** PWA install-prompt behaviour is verified in Chromium but has not
      been confirmed on a real iOS/Android device.
- [ ] **P2** Multi-language — named as Tier-2 scope, not started.
- [ ] **P2** Payment webhooks (M-Pesa) — ADR-0006 direction agreed, not built.
- [ ] **P2** `/admin` booking view — named as Tier-2 scope, not started.

---

## Provenance

- Crawl: 120/120 sitemap URLs via headless Chromium (Playwright). Plain HTTP
  clients are served an anti-bot JS challenge on the HTML pages.
- Media: 316 files downloaded. `/wp-content/uploads/*` files answer a bare GET,
  so the 74-asset first pass used `curl`; the rest were resolved by probing the
  `wp-content/uploads/<year>/<month>/` folder layout after the crawl revealed
  more references.
- All raw captures (HTML + JSON per page) and the media staging area are kept in
  `/tmp/opencode/`. They contain the live site's contact details and must never
  be committed — run `bash scripts/check-no-contact.sh` before every commit.
