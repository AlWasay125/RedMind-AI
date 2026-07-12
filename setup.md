# RedMind-AI Frontend — Setup & Run

## Prerequisites

- Node.js 18+ and npm
- Backend running separately (Flask/FastAPI) reachable at the URL you set in `.env.local`

## 1. Install dependencies

From the project root (`redmind-frontend2` or wherever you extracted it):

```bash
npm install
```

This installs everything in `package.json`, including `three`, `gsap`, and `@types/three` — nothing extra to install separately.

## 2. Create your environment file

`.env.local` is not shipped in any zip you get from this project (deliberately excluded — it's a local secrets/config file, not something that should be zipped and passed around). Create it yourself at the project root:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Replace the URL with wherever your backend is actually running. Next.js inlines `NEXT_PUBLIC_*` variables at build time, so this file must exist **before** you run `dev` or `build` — adding it after the server has started won't take effect until you restart.

## 3. Run it

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Route map — read this before you go looking for the dashboard

The project has two zones with different layouts:

| Route | What's there | Layout |
|---|---|---|
| `/` | Public landing page (Three.js hero, "ENTER DASHBOARD" button) | Minimal, no sidebar |
| `/dashboard` | Threat overview, scan stats, recent scans | Sidebar present |
| `/scan` | New scan launcher | Sidebar present |
| `/history` | Scan history | Sidebar present |
| `/reports` | Reports | Sidebar present |
| `/results` and `/results/[id]` | Scan results | Sidebar present |
| `/settings` | Settings | Sidebar present |

**`/` is not the dashboard.** It's the marketing/landing page. Everything with a sidebar lives under a route group (`app/(app)/` in the source — this folder name does not appear in the URL, it's a Next.js organizational convention). Click "ENTER DASHBOARD" on the landing page, or go directly to `/dashboard`.

## Verifying it worked

Don't just check that `npm run dev` starts without errors — that only confirms the code compiles, not that it looks right. Check each of these manually:

- `/` — hero renders full-screen with animated starfield/nebula, not a stacked plain-text page. If you see unstyled stacked text, the CSS import (`horizon-hero-section.css`) isn't being picked up — confirm the file exists next to `horizon-hero-section.tsx` in `components/ui/`.
- `/dashboard` — sidebar visible on the left, stat cards (CRITICAL/HIGH/MEDIUM/LOW) at the top.
- Click through `/scan`, `/history`, `/reports`, `/results`, `/settings` from the sidebar — confirm the sidebar persists and links work.

## Troubleshooting

**"I don't see the dashboard, only the hero"**
Expected at `/`. Go to `/dashboard` or click the CTA button on the hero.

**Hero shows as unstyled stacked text, tiny canvas in top-left**
`horizon-hero-section.css` is missing or not imported. Confirm `components/ui/horizon-hero-section.tsx` has `import './horizon-hero-section.css';` near the top, and the `.css` file actually exists in the same folder.

**Build fails on `import * as THREE from 'three'`**
`node_modules` doesn't have `three`/`gsap` installed — re-run `npm install` and confirm `three` and `gsap` are listed under `dependencies` in `package.json`.

**Scan/results pages don't load data**
That's a backend connectivity issue, not a frontend one — confirm your backend process is actually running and reachable at the address in `.env.local`.