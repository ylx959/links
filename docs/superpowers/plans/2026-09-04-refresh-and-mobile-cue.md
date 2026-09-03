# Refresh Reset and Mobile Scroll Cue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every restored page start as a fresh visit and prevent the mobile blue scroll cue from overlapping the copyright footer.

**Architecture:** Keep browser restoration behavior inside the existing `resetInitialScroll` boundary. Treat a persisted `pageshow` as a live BFCache restoration and request a full reload; use responsive first-screen padding to reserve the cue's complete touch target on mobile without changing the desktop composition.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Tailwind CSS 4, Node test runner

## Global Constraints

- Preserve pathname and query string when clearing a URL fragment.
- A normal `pageshow` must not request a reload.
- A persisted `pageshow` must request exactly one full reload.
- Keep the existing reduced-motion behavior unchanged.
- Do not add device-specific media queries or disable HTTP asset caching.
- Keep the cue as an ordinary anchor with a 44px touch target.

---

### Task 1: Reload persisted pages from a clean document

**Files:**
- Modify: `src/initialScroll.ts`
- Modify: `src/main.tsx`
- Test: `test/initialScroll.test.mjs`

**Interfaces:**
- Consumes: browser `History`, `Location`, `scrollTo`, and `pageshow` behavior supplied by `src/main.tsx`.
- Produces: `resetInitialScroll(environment): void`, where `environment` includes `reload: () => void` and `onPageShow: (listener: (event: { persisted: boolean }) => void) => void`.

- [ ] **Step 1: Extend the initial-scroll test with normal and persisted page-show cases**

Update the environment stub and assertions in `test/initialScroll.test.mjs`:

```js
const reloads = []

resetInitialScroll({
  history,
  location,
  scrollTo: (...args) => scrolled.push(args),
  reload: () => reloads.push('reload'),
  onPageShow: (listener) => {
    onPageShow = listener
  },
})

onPageShow({ persisted: false })
assert.deepEqual(scrolled, [[0, 0], [0, 0]])
assert.deepEqual(reloads, [])

onPageShow({ persisted: true })
assert.deepEqual(reloads, ['reload'])
assert.deepEqual(scrolled, [[0, 0], [0, 0]])
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test test/initialScroll.test.mjs`

Expected: FAIL because `resetInitialScroll` does not yet call the supplied `reload` function for a persisted event.

- [ ] **Step 3: Implement the persisted-page boundary**

Change the environment type and handler in `src/initialScroll.ts`:

```ts
type PageShowState = Pick<PageTransitionEvent, 'persisted'>

type InitialScrollEnvironment = {
  history: Pick<History, 'replaceState' | 'scrollRestoration'>
  location: Pick<Location, 'hash' | 'pathname' | 'search'>
  scrollTo: (x: number, y: number) => void
  reload: () => void
  onPageShow: (listener: (event: PageShowState) => void) => void
}

// Inside resetInitialScroll:
onPageShow((event) => {
  if (event.persisted) {
    reload()
    return
  }

  scrollToTop()
})
```

Pass the browser reload function in `src/main.tsx` and forward the typed event:

```ts
reload: window.location.reload.bind(window.location),
onPageShow: (listener) =>
  window.addEventListener('pageshow', listener, { once: true }),
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `node --test test/initialScroll.test.mjs`

Expected: PASS; normal page-show scrolls to the top and persisted page-show requests one reload without another scroll.

- [ ] **Step 5: Commit the refresh-reset change**

```bash
git add src/initialScroll.ts src/main.tsx test/initialScroll.test.mjs
git commit -m "fix: restart page after browser restoration"
```

### Task 2: Compact the mobile first screen and reserve the cue safe area

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/ProfileHeader.tsx`
- Modify: `src/components/LinkButton.tsx`
- Modify: `src/components/QuoteBlock.tsx`

**Interfaces:**
- Consumes: the existing absolute `ScrollCue` with `bottom-4` and a `size-11` (44px) anchor.
- Produces: a compact mobile composition that fits at 390 × 664, plus an 80px bottom safe area; all existing sizes return at the `sm` breakpoint.

- [ ] **Step 1: Record the layout invariant before changing styles**

The cue occupies the vertical interval from 60px above the viewport bottom to 16px above it. The footer must end at least 16px above that interval, so mobile content needs at least `60px + 16px = 76px` of reserved bottom space. Tailwind `pb-20` supplies 80px.

- [ ] **Step 2: Add the responsive first-screen spacing**

Change the first-screen section class in `src/App.tsx`:

```tsx
className="relative mx-auto flex min-h-dvh max-w-[28rem] flex-col justify-center px-6 pt-6 pb-20 sm:pt-48 sm:pb-8"
```

Change the main stack and footer classes in the same file:

```tsx
<div className="flex flex-col gap-5 sm:gap-9">
<footer className="mt-6 flex flex-col items-center gap-1 sm:mt-12 sm:gap-3">
```

Wrap the main stack and footer together so the mobile content moves down 56px without moving the sibling scroll cue or increasing the section height:

```tsx
<div className="translate-y-14 sm:translate-y-0">
  {/* main stack and footer */}
</div>
```

Update the adjacent explanatory comment to document both mobile density and the cue safe area.

- [ ] **Step 3: Compact the mobile components without changing desktop**

Wrap `Avatar` in `src/components/ProfileHeader.tsx` with an 88px mobile box and a proportional visual scale; restore both to 108px/100% at `sm`:

```tsx
<div className="flex size-[88px] items-center justify-center sm:size-[108px]">
  <div className="scale-[0.815] sm:scale-100">
    <Avatar {...avatar} initials={avatar.initials ?? initialsFrom(name)} />
  </div>
</div>
```

Use responsive profile typography and spacing:

```tsx
<h1 className="mt-4 text-[18px] font-semibold tracking-tight sm:mt-6">
<p className="mt-1 text-[12px] tracking-tight text-ink-muted sm:text-[13px]">
```

Change the link anchor in `src/components/LinkButton.tsx` to `h-11 sm:h-12`. Change the blockquote in `src/components/QuoteBlock.tsx` to `text-[14px] ... sm:text-[15px]`. Do not shrink either icon-link targets or the scroll-cue target.

- [ ] **Step 4: Run static verification**

Run: `npm run lint && npm run build`

Expected: both commands exit with code 0.

- [ ] **Step 5: Inspect the mobile and desktop layouts**

Start the app with `npm run dev`; inspect it at 390 × 664, 390 × 844, and 1280 × 800. Confirm:

- all links, the quote, icon row, copyright, and cue are visible without scrolling at both mobile heights;
- the full 44px cue target remains 16px above the viewport bottom;
- the copyright line does not intersect the cue target;
- the mobile content remains readable and the icon/cue targets do not shrink;
- the desktop layout retains its prior component sizes and spacing.

- [ ] **Step 6: Commit the mobile layout change**

```bash
git add src/App.tsx src/components/ProfileHeader.tsx src/components/LinkButton.tsx src/components/QuoteBlock.tsx
git commit -m "fix: compact mobile first screen"
```

### Task 3: Run release-level verification

**Files:**
- Verify: `src/initialScroll.ts`
- Verify: `src/main.tsx`
- Verify: `src/App.tsx`
- Verify: `test/initialScroll.test.mjs`

**Interfaces:**
- Consumes: the completed refresh reset and responsive cue-safe-area changes.
- Produces: a verified production build with no test, lint, or type/build regressions.

- [ ] **Step 1: Run all automated checks**

Run: `npm test && npm run lint && npm run build`

Expected: every test passes, lint exits with code 0, and Vite produces `dist/` successfully.

- [ ] **Step 2: Review the final diff**

Run: `git diff HEAD~2 --check && git diff HEAD~2 -- src/initialScroll.ts src/main.tsx src/App.tsx test/initialScroll.test.mjs`

Expected: no whitespace errors; the diff contains only the approved refresh-reset, test, and responsive-spacing changes.
