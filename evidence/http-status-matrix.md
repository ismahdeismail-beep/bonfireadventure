# HTTP status matrix

Measured 2026-10-16 with `curl` (redirects **not** followed; the `Location`
column shows the first hop). Basis for findings F-07, F-13, F-15, F-22.

## Core pages

| URL | Status | Location |
|---|---|---|
| `/` | 200 | |
| `/packages/` | 200 | |
| `/destinations/` | 200 | |
| `/about-us/` | 200 | |
| `/contact-us/` | 200 | |
| `/brochures/` | 200 | |
| `/reviews-testimonials/` | 200 | |
| `/prices/` | 200 | |

## Commerce (F-07)

| URL | Status | Location |
|---|---|---|
| `/shop/` | **301** | `/` (homepage) |
| `/shop-2/` | 200 | (no products) |
| `/cart/` | 200 | (empty shell) |
| `/checkout/` | 200 | (empty shell) |
| `/my-account/` | 200 | (no login form — F-08) |

## Destinations (F-13, F-15)

| URL | Status | Location |
|---|---|---|
| `/destinations/egypt/` | **301** | `/destinations/diani-ukunda/` ⚠️ |
| `/destinations/rwanda` | 301 | `/destinations/rwanda/` (trailing slash) |
| `/destinations/europe/` | 200 | |
| `/destinations/europe-destinations/` | 200 | (duplicate) |
| `/destinations/hongkong/` | 200 | |
| `/destinations/kenya-north-coast/` | 200 | |
| `/destinations/mombasa-north-coast/` | 200 | |
| `/destinations/italy/` | 200 | |
| `/destinations/dubai-uae/` | 200 | |

## Packages (F-22)

| URL | Status | Location |
|---|---|---|
| `/packages/bush-packages-maasai-mara/` | 200 | |
| `/packages/coastal-escapes-international-experiences-2026` | 301 | `/…-2026/` (trailing slash) |
| `/packages/watamu-malindi-2026-deals` | 301 | `/…-deals/` (trailing slash) |
| `/packages/standard-chartered-marathon-packages` | 301 | `/…-packages/` (trailing slash) |
| `/packages/nakuru-summer-deals/` | *timed out in batch* | re-check individually |

## Demo / builder leftovers (all 200 — publicly reachable)

`/sample-page/`, `/test/`, `/test-2/`, `/home-2/`, `/search-page/`, `/services/`,
`/packages-preview-layout/`, `/destinations-preview-layout/`,
`/flip-box-carousel-with-a-trigger-button/`, `/hello-world/`

## Other surfaces

| URL | Status | Note |
|---|---|---|
| `/wp-sitemap-users-1.xml` | 200 | Author enumeration exposure (F-20) |
| `/feed/` | 200 | RSS open |
| `/?s=dubai` | 200 | Search works |
| `/wp-login.php` | **404** | Default login path absent (F-08) |

## Response headers (homepage)

| Header | Value |
|---|---|
| `server` | Apache |
| `x-powered-by` | PHP/8.3.33 |
| Protocol | HTTP/2 |
| `Content-Security-Policy` | **absent** |
| `Strict-Transport-Security` | **absent** |
| `X-Frame-Options` | **absent** |

No security headers at all — relevant to the authentication requirement
(`../docs/requirements/04-authentication-and-accounts.md`).
