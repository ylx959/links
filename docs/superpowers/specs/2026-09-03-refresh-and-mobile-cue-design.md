# Refresh Reset and Mobile Scroll Cue Design

## Goal

Every browser refresh must behave like a first visit: the page starts at the top, URL fragments do not restore the About section, and all entrance and About animations begin from their initial state. On mobile screens, the blue scroll cue must not overlap the copyright footer.

## Refresh behavior

`resetInitialScroll` remains the single startup boundary for browser restoration behavior. On every fresh document load it will:

- set `history.scrollRestoration` to `manual`;
- remove the current URL fragment while preserving the pathname and query string;
- scroll to `(0, 0)` immediately and again when `pageshow` fires.

The `pageshow` listener will receive the page transition event. When `event.persisted` is true, the browser restored a live page from the back-forward cache, including its existing React, GSAP, ScrollTrigger, SplitText, and physics state. In that case the page will perform one full reload instead of trying to reset each animation subsystem individually. A normally loaded document has `persisted === false`, so it will not reload again or create a loop.

This keeps animation reset ownership simple: a fresh React mount recreates all timelines and the existing animation cleanup remains unchanged.

## Mobile scroll-cue layout

The first-screen section will reserve a dedicated mobile-only bottom safe area for the absolutely positioned 44px scroll-cue target. The footer stays in normal flow above that reserved space, while the cue remains visually anchored near the bottom of the first screen. At the existing `sm` breakpoint and above, the current desktop spacing remains unchanged.

The reserved space must cover the cue's full touch target plus separation from the footer, not only the visible 7px blue dot. This makes the layout work across different phone heights and dynamic browser toolbars without device-specific media queries.

## Error and fallback behavior

- If no URL fragment exists, history is not rewritten.
- If a page is not restored from the back-forward cache, no reload is requested.
- With reduced motion enabled, existing accessibility behavior remains unchanged.
- If JavaScript is unavailable, the cue remains an ordinary anchor link and the page remains navigable.

## Verification

- Unit-test that initial load clears a fragment, disables scroll restoration, and scrolls to the top.
- Unit-test that a normal `pageshow` repeats the top scroll without reloading.
- Unit-test that a persisted `pageshow` requests exactly one full reload.
- Run the complete test, lint, and production build commands.
- Render or inspect a representative narrow mobile viewport and verify that the footer and the cue's 44px hit area do not overlap.

## Out of scope

- Changing animation timing, visual styling, or About content.
- Disabling normal HTTP asset caching.
- Adding device-specific layout rules.
