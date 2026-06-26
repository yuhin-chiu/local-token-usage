# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Next.js 16 — read the docs before writing code

This project uses Next.js 16 (see `package.json`). APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any Next.js code that isn't already present in the repo. Heed deprecation notices.

## Commands

```bash
npm install          # first-time setup
npm run dev          # dev server with HMR on http://localhost:3002
npm run build        # production build
npm run start        # production start on port 3002
npm run lint         # eslint
```

No test suite is present.

If port 3002 is occupied, change `-p <port>` in `package.json` scripts. If you see "Another next dev server is already running", delete the `.next` directory and retry.

## Architecture

This is a **local-first AI usage dashboard** — it reads JSONL session files from Claude Code and Codex CLI on the user's machine, aggregates token/cost data, and renders a dashboard. No data leaves the machine.

### Data flow

```
~/.claude/projects/**/*.jsonl  ──→  src/lib/sources/claude.ts
~/.codex/sessions/**/*.jsonl   ──→  src/lib/sources/codex.ts
                                        │
                              src/lib/aggregate.ts  (buildSnapshot)
                                        │
                              src/app/api/usage/route.ts  (GET /api/usage?days=N)
                                        │
                              src/app/dashboard/page.tsx  (client component, polls every 15s)
```

### Routing

`/` redirects to `/dashboard` (configured in `next.config.ts`). The primary UI lives entirely under `/dashboard`.

- `src/app/layout.tsx` — root layout with Geist fonts
- `src/app/dashboard/layout.tsx` — dashboard sublayout; loads DM Mono + Syne fonts
- `src/app/dashboard/page.tsx` — client component, fetches `/api/usage?days=N` on mount and every 15s

### Key files

| File | Role |
|---|---|
| `src/lib/types.ts` | `UsageEvent`, `UsageSnapshot`, `DailyBucket`, `SourceId`, `SOURCES` — central type definitions |
| `src/lib/sources/claude.ts` | Walks `~/.claude/projects/`, reads JSONL, extracts `type=assistant` lines with `message.usage`, deduplicates by `message.id`+`requestId` |
| `src/lib/sources/codex.ts` | Walks `~/.codex/sessions/`, reads `token_count` events as cumulative counter deltas, also extracts `rate_limits` for 5h/week window progress meters |
| `src/lib/aggregate.ts` | `buildSnapshot(daysBack)` — runs both sources via `Promise.allSettled`, merges events into daily buckets + model breakdowns + today stats |
| `src/lib/pricing.ts` | Hardcoded model price table (`$ / 1M tokens`); fallback by substring then family keyword (opus/sonnet/haiku/gpt-5/codex) |
| `src/lib/format.ts` | `fmtTokens` (K/M/B), `fmtCost`, `fmtRelative`, `fmtShortDay`, `fmtPct` |
| `src/app/api/usage/route.ts` | Single API endpoint, `force-dynamic`, no caching. Accepts `?days=7|30|90` (clamped 7–365) |
| `src/app/dashboard/_components/` | UI components: `TerminalHeader`, `SignalCard`, `SparkLine`, `SourceChannel`, `RateMonitor`, `DailyStack`, `ModelLedger` |

### Adding a new AI tool source

1. Create `src/lib/sources/<name>.ts` — export a function returning `UsageEvent[]` (filtered by `sinceDate`)
2. Add the source ID to the `SourceId` union and `SOURCES` array in `src/lib/types.ts`
3. Add the new reader to the `Promise.allSettled` list in `src/lib/aggregate.ts`, push its results into `events[]`

UI colors key off `event.source` — no UI changes needed.

## Project conventions

- **Path alias**: `@/*` maps to `./src/*` (set in `tsconfig.json`)
- **Tailwind v4**: Uses `@tailwindcss/postcss` plugin (no `tailwind.config.ts`). Design tokens defined in `src/app/globals.css` via `@theme inline {}`. Custom accent colors: `accent-claude` (#d97757), `accent-codex` (#a78bfa), plus `surface`, `border`, `muted`.
- **Light/dark mode**: Dashboard supports a toggle; dark default uses `#09090b` background with radial gradient glows.
- **Key deps**: `recharts` for charts, `lucide-react` for icons, `date-fns` for date math, `clsx` for classnames.
- **PM2 deployment**: Production runs under PM2 (`ecosystem.config.js`, process name `ai-usage`). After code changes: `npm run build` → `npx pm2 restart ai-usage --update-env` → `npx pm2 save`. Full details in `docs/deployment.md`.
- **No `.cursorrules` or Copilot instructions** exist in this repo.
