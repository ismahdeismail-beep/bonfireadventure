# Methodology

How this audit was carried out, and what it does and does not claim.

## Principle: separate confirmed content from unverified presentation

The live site reliably exposes its **content and page structure** over HTTP.
It does not, over HTTP alone, reliably expose **visual layout, interaction
behaviour, responsive behaviour or runtime state**. This audit therefore keeps
two registers and never blurs them:

- **CONFIRMED** — observed directly in the rendered HTML / response, the site's
  own sitemaps, or measured HTTP behaviour. Evidence file or check cited.
- **UNVERIFIED** — plausible from structure but not directly observed
  (menu animation, hover states, mobile stacking, image cropping, floating
  widget position, JS-driven counters). Each of these is listed as a task in
  the checklist rather than asserted as a fact.

Nothing here is a proposed change. Phase 1 records the current state only;
recommendations live in `docs/requirements/` and `docs/decisions/`.

## Steps used

1. **Fetch rendered pages** — homepage, `/packages/`, `/contact-us/`,
   `/about-us/`, `/destinations/`, `/prices/`, `/brochures/`,
   `/reviews-testimonials/`, `/shop-2/`, `/my-account/`.
2. **Enumerate the site from its own sitemaps** — `wp-sitemap.xml` plus the
   page, post, package, destination and typology sub-sitemaps, so the URL
   inventory is the site's own declaration rather than a guess. Saved under
   `evidence/`.
3. **Probe HTTP behaviour** for every suspicious URL — status code and redirect
   target, to distinguish real pages from redirects, dead links and duplicates.
   Result: `evidence/http-status-matrix.md`.
4. **Fingerprint the stack** from asset URLs and inline scripts — theme,
   builder, plugins, form handler, analytics, WhatsApp mechanism. This is what
   establishes whether a booking system or working accounts actually exist.
5. **Inspect response headers** for the security baseline (CSP, HSTS,
   X-Frame-Options, server disclosure).
6. **De-duplicate findings** and record each once, with severity, evidence and
   a concrete verification step — `docs/audit/08-findings-log.md`.

## Constraints honoured

- **No contact details** are written into this repo, per client instruction. The
  audit describes contact surfaces by count and location, never by value. Raw
  HTML (which contains them) is kept outside the repo.
- Findings are **observations**, not yet defects: the log carries a severity and
  a "how to confirm" line so nothing is escalated on inference alone.

## Review lenses applied

Beyond the page-by-page map, the findings are grouped against the review lenses
the client asked for:

| Lens | Where |
|---|---|
| Information architecture / navigation overlap | `04-navigation-map.md`, F-11 |
| Package & price consistency | `05-packages.md`, F-03 / F-04 |
| Booking journey | `07-contact-and-booking-audit.md`, F-06 |
| Accounts & authentication | `04-authentication-and-accounts.md`, F-08 |
| Responsive / performance / accessibility | checklist item 6 (UNVERIFIED) |
| Content & technical consistency | `08-findings-log.md` |

## Skills library used

Methodology was drawn from the local skills library at
`~/Desktop/skills_and_tools`:

| Skill | Applied to |
|---|---|
| `design_and_ui/skill_user_research.md` | Usability framing; separating observed behaviour from assumptions; the browser-verification backlog in `09-open-questions.md` |
| `design_and_ui/skill_design_systems.md` | The "one source of truth" requirement — tokens/data defined once and rendered everywhere (pricing, contact, package records) |
| `design_and_ui/skill_interaction_design.md` | Navigation/menu interaction review points and the WCAG/link-integrity checks (F-10, F-11) |
| `open_text_and_comms/skill_technical_writing.md` | Information-architecture framing and docs structure for this repo |
| `pen-test/skill_web_app_testing.md` | Header/security baseline review and the auth hardening requirements (R4.5–R4.12) |

These informed *how* the audit and requirements are structured; the findings
themselves are all evidence-backed from the live site.

