# 0007 — Motion is decoration, never a gate

- **Status:** Accepted
- **Date:** 2026-10-20
- **Source:** client instruction — *"i want them ... but you to work on how they are
  moving to make sure the website still feels operatable"*

## Context

The live site is built on Elementor and is full of motion: 90 scroll-in
animations, carousels, a continuously scrolling strip, a ken-burns zoom on hero
images, and background video sections. Two of those background videos are broken
(the YouTube IDs are dead or belong to the theme vendor), so the live homepage
currently renders a broken background.

Porting that motion wholesale would import three problems: it makes the site
*jankier* on the phones most visitors use, it competes with the booking flow for
attention, and it can leave content invisible when a script fails.

The client's constraint is the deciding one: motion may be added, but the site
must remain **operable**. That means: usable, tappable and readable at all times.

## Decision

1. **Motion is a layer, never a dependency.** Every page renders and works with
   JavaScript disabled, with `prefers-reduced-motion: reduce`, and if any of the
   motion code fails to load. Content is visible by default; motion only animates
   things that were already there.
2. **The hero background video is self-hosted.** The CSP is `default-src 'self'`
   with no `frame-src` or `media-src`, so the live site's YouTube embeds are
   blocked by design. A self-hosted `<video>` needs no CSP change. Only Bonfire's
   own footage is used (V-1); the dead and vendor-owned videos are not ported.
3. **The video must never be on the critical path.** It is requested only after
   the `load` event, and only on connections that can afford it (`save-data` and
   slow effective types fall back to the still photo).
4. **The video yields to the visitor.** It pauses when scrolled out of view and
   when the tab is hidden. It is skipped entirely under `prefers-reduced-motion`,
   and reacts if that setting is toggled mid-session.
5. **Tap targets outrank decoration.** The video is `pointer-events: none` and
   sits under the same darkening overlay as the photo, so headline contrast and
   button hit-testing are unchanged.
6. **The hero button owns sound, not play/pause.** The video already autoplays
   muted, so a play/pause toggle would *stop* the video on a visitor's first tap.
   The button toggles audio and its label always states the next action.
7. **Scroll reveal is one-directional and CSS-gated.** Elements are visible
   unless `js-reveal` is on `<html>` *and* the element is below the fold. Anything
   already on screen is shown immediately. A failing script cannot blank a page.
8. **No carousels.** The live site's card carousels are swipeable rails at best
   and hidden content at worst; they were not ported.

## Consequences

- **Positive:** FCP stays ~250 ms with the hero video active; no long tasks while
  it plays; nothing is ever left invisible; the site is fully operable with JS
  off. The hero is 942 KB (mp4) / 1211 KB (webm) rather than 3.7 MB / 2.9 MB.
- **Negative:** the hero is visually calmer than the live site. Accepted — the
  instruction was operability first.
- **Maintenance:** adding motion requires deliberately adding a class to the
  reveal list, and any new motion must re-check the reduced-motion path.

## Verification

Asserted in Chromium at 320 / 390 / 1280 px (20 motion + 20 layout/perf checks):

- every hero action is hit-testable with the video playing;
- the video is requested only after `load`, and only one format is fetched;
- it pauses off-screen, and is `display: none` under reduced motion;
- no content is left with `opacity < 1` after scrolling the page;
- the page renders with JavaScript disabled and nothing carries `.reveal`.

## Open

- Whether to add horizontal swipeable card rails (deliberately not ported — see
  decision 8). Revisit only if the client wants the live site's carousel feel.
