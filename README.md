# Links

Yang Lin-Hsuan's link hub. One page that gathers the portfolio, GitHub, LinkedIn and contact details behind a single URL — the one you paste where only one link fits, like an Instagram bio.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to dist/
```

React + TypeScript + Tailwind v4 + Vite. GSAP drives the entrance animation, the avatar's hover ring, and the About reveal.

## Editing the content

Everything lives in `src/data/`. No component needs touching:

| File | Holds |
|---|---|
| `profile.ts` | Name, one-line headline, avatar, quote |
| `links.ts` | `groups` — the main buttons; `footerLinks` — the small icons above the copyright |
| `site.ts` | Page title, description, canonical URL |
| `about.ts` | The paragraph on the scroll-down screen. Delete the `about` key in `site.ts` and the page goes back to one screen |

The `icon` field only accepts a name registered in `src/icons/registry.tsx` (github, linkedin, x, instagram, youtube, threads, discord, portfolio, mail, resume, link). A typo fails the build rather than rendering a blank slot. To add a platform, drop an SVG into the registry — its key becomes a valid option automatically.

The avatar is `public/avatar.webp`, pointed at by `avatar.src` in `profile.ts`. If the image fails to load the page falls back to `initials` — set it in `profile.ts`, or leave it out and the initials are derived from `name`.

## The second screen

Scroll past the links and there's an About screen. The only cue is the small blue dot at the
bottom of the first screen — it's the same blue, and the same size, as the full stop at the end
of the handwriting waiting below.

The heading is a real handwritten SVG, drawn one stroke at a time with GSAP's DrawSVGPlugin.
The signature is still finishing its last strokes when the first paragraph starts typing itself
out, character by character, with a blue caret running ahead of the text.

Then it plays itself out. Each paragraph holds long enough to be read, then breaks apart — not
into letters, into **words** — and the words drop into a matter-js world: real gravity, real
collisions, a small bounce, fading back to a quarter of their weight as they go. They land on the
floor of the section, and on each other. The next paragraph types in over the top.

All four paragraphs share one physics world, so the second paragraph's words genuinely land on the
pile the first one left, and by the end there's a drift of readable words banked up along the
bottom of the screen. The closing paragraph doesn't fall; it stays, and every paragraph is stacked
above the heap so the line you're meant to be reading is never buried by the ones already spoken.

The whole run is about 22 seconds. Scroll away far enough that the signature clears the bottom of
the window and it resets — the words come out of the world and back into the paragraph they came
from — so returning plays it again from the first stroke. All of it is skipped under
`prefers-reduced-motion`.

The engine settings come from [react-bits](https://reactbits.dev)' `FallingText`
(`npx shadcn@latest add @react-bits/FallingText-TS-CSS`). That component is self-contained — it
renders and centres its own text and starts on mount — so it can't sit inside a typewriter
sequence. `src/animation/wordPhysics.ts` keeps its feel and hands the trigger to the timeline
instead.

### Editing the script

`src/data/about.ts` holds `paragraphs` — an array, and the order is the running order. Add or
remove entries freely; the timing is derived from each one's length, so nothing else needs
touching. The **last** entry is the closing line and is the one that stays on screen.

Keep them short. Every word that gets spoken becomes a rigid body on the floor, and the heap only
grows upward — a long script piles words up behind the closing line. If that starts to crowd, the
lever is `AboutSection.tsx`: shrinking the signature buys the heap headroom.

### Swapping in your own handwriting

Overwrite `src/assets/about-signature.svg` — nothing else needs touching. Two requirements:

- **Open stroked paths, not outlines.** In Figma, draw with the pencil or vector tool and export
  without running *Outline Stroke*. An outlined shape makes DrawSVG trace the *edge* of each
  letter, which reads as a shape being outlined rather than a pen writing.
- **`<path>` order is pen order.** Reorder them in the file to change which stroke is written first.

The colour is taken over by `--accent` in `index.css`, so the `stroke` values in the file don't
matter. Stroke width and caps stay with the file, so whatever you set in Figma is what you get.

Layout proportions live in `AboutSection.tsx` and are all `vw`/`dvh`, measured off the design at
full-screen size. The body type is sized in `vw` too — that's deliberate, and it's why each
paragraph breaks into the same number of lines on a laptop and on a 27" display.
