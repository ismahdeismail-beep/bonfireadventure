# Evidence

Raw, non-contact evidence supporting the audit.

## What is committed here

| File | Contents |
|---|---|
| `sitemap-index.xml` | The site's own sitemap index |
| `sitemap-pages.xml` | All page URLs (22) |
| `sitemap-blog-posts.xml` | Blog post URLs (6) |
| `sitemap-packages.xml` | Package URLs (43) |
| `sitemap-destinations.xml` | Destination URLs (31) |
| `sitemap-typologies.xml` | Typology (taxonomy) URLs (10) |
| `http-status-matrix.md` | Measured HTTP status + redirect target for probed URLs |

These contain **URLs only** — no phone numbers, emails or addresses — so they are
safe to commit under the repo's no-contact policy (ADR-0001).

## What is deliberately NOT committed

Full-page **HTML captures**, because the live pages embed contact details (phone
numbers, email addresses, a physical address, WhatsApp links) — including the
leftover theme-demo footer that belongs to a *different* business (F-01).

Those captures were saved **outside** the repository, under:

```
/tmp/opencode/bonfire-evidence/
  2026-10-16-homepage.html
  2026-10-16-packages_.html
  2026-10-16-contact-us_.html
  2026-10-16-about-us_.html
  2026-10-16-destinations_.html
  2026-10-16-prices_.html
  2026-10-16-brochures_.html
  2026-10-16-reviews-testimonials_.html
  2026-10-16-shop-2_.html
  2026-10-16-my-account_.html
```

`.gitignore` excludes `*.html` from this repo by default to prevent accidental
commits of contact-bearing captures.

## Reproducing the capture

```sh
# Page inventory (safe, URLs only) — from the site's own sitemaps
curl -sL https://bonfireadventures.com/wp-sitemap.xml
# then each sub-sitemap listed inside it

# Full-render captures (contains contact info — keep OUT of the repo)
mkdir -p /tmp/opencode/bonfire-evidence
for p in "" packages/ contact-us/ about-us/ destinations/ \
         prices/ brochures/ reviews-testimonials/ shop-2/ my-account/; do
  curl -sL "https://bonfireadventures.com/$p" \
    -o "/tmp/opencode/bonfire-evidence/$(date +%F)-${p//\//_}.html"
done
```

## Method note

Captures are the raw server response (no JS execution), so anything rendered
client-side — the count-up statistics (F-19), the "How Booking Works" steps
(F-24), menu animation — is **absent** from them and is tracked as UNVERIFIED in
`../docs/audit/09-open-questions.md`.
