# Open Mic Night

The simplest way to run an open mic queue. Create an event in under 30 seconds,
share a QR code, and let performers sign themselves up while estimated set times
update live. Free to host, no accounts, and every event auto-deletes when it's over.

- **Mobile-first & installable** — a PWA you can add to your home screen.
- **Realtime** — the queue updates instantly across performers, the host, and the TV display.
- **Privacy by design** — only a display name is collected; all data is deleted a few hours after the event.

Built with Next.js (App Router) + React, TypeScript (strict), Tailwind CSS v4,
shadcn/ui, Supabase (Postgres + Realtime), and Framer Motion.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/create` | Create an event |
| `/[slug]` | Public event page + join queue |
| `/[slug]/manage/[token]` | Host control (private link) |
| `/[slug]/display` | TV / projector display screen |
| `/api/cleanup` | Deletes expired events (secured) |

## Getting started

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

Create a free project at [supabase.com](https://supabase.com). Then, in the SQL
Editor, run the migrations in [`supabase/migrations`](supabase/migrations) in order:

1. `0001_init.sql` — tables, RLS, Realtime and the cleanup function.
2. `0002_cleanup_cron.sql` — *(optional)* schedules hourly cleanup with `pg_cron`.

> The schema keeps the host token hash in a separate `event_secrets` table with no
> anonymous access, so it can never leak through the public API or Realtime. All
> writes go through server actions using the service role key; the public anon key
> only has read access (enforced by RLS) for live updates.

### 3. Configure environment

Copy `.env.example` to `.env.local` and fill in the values from
**Project Settings → API**:

```bash
cp .env.example .env.local
```

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (safe in the browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only.** Never expose to the browser |
| `NEXT_PUBLIC_SITE_URL` | Base URL for links + QR codes (e.g. `http://localhost:3000`) |
| `CLEANUP_SECRET` | Any long random string; required to call `/api/cleanup` |

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run check` | Biome lint/format check + TypeScript |
| `npm run lint:fix` | Apply Biome fixes |
| `npm run typecheck` | TypeScript only |

A Husky pre-commit hook runs `lint-staged` (Biome) on staged files.

## Automatic cleanup

Every event stores an `expires_at` timestamp (a few hours after its finish time).
Choose one of:

- **pg_cron** — run `0002_cleanup_cron.sql` and Supabase deletes expired events hourly.
- **Platform cron** — call the cleanup endpoint on a schedule:

  ```bash
  curl -X POST https://your-host/api/cleanup -H "Authorization: Bearer $CLEANUP_SECRET"
  ```

  On Vercel, [`vercel.json`](vercel.json) already defines an hourly cron for
  `/api/cleanup`; set `CLEANUP_SECRET` (and Vercel's `CRON_SECRET` to the same value)
  in your project.

## Deploying

Deploy to any platform that supports Next.js (Vercel recommended). Set the same
environment variables as above, and point `NEXT_PUBLIC_SITE_URL` at your public URL.

## Regenerating icons

```bash
node scripts/generate-icons.mjs
```

Renders the PWA icons from the brand mark in [`app/icon.svg`](app/icon.svg).

## License

MIT
