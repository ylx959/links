# Links

Yang Lin-Hsuan's link hub. One page that gathers the portfolio, GitHub, LinkedIn and contact details behind a single URL — the one you paste where only one link fits, like an Instagram bio.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to dist/
```

React + TypeScript + Tailwind v4 + Vite. GSAP drives the entrance animation and the avatar's hover ring.

## Editing the content

Everything lives in `src/data/`. No component needs touching:

| File | Holds |
|---|---|
| `profile.ts` | Name, one-line headline, avatar, quote |
| `links.ts` | `groups` — the main buttons; `footerLinks` — the small icons above the copyright |
| `site.ts` | Page title, description, canonical URL |

The `icon` field only accepts a name registered in `src/icons/registry.tsx` (github, linkedin, x, instagram, youtube, threads, discord, portfolio, mail, resume, link). A typo fails the build rather than rendering a blank slot. To add a platform, drop an SVG into the registry — its key becomes a valid option automatically.

The avatar is `public/avatar.webp`, pointed at by `avatar.src` in `profile.ts`. If the image fails to load the page falls back to `initials` — set it in `profile.ts`, or leave it out and the initials are derived from `name`.
