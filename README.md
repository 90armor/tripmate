# TripMate

Mobile-first web app for planning trips — solo or as a group — in one shared place: itinerary,
places, bookings, expenses, and settlement.

This README is operational: how to run, test, and build. Product and technical decisions live in
[`docs/`](docs/), agent rules in [`AGENT_RULES.md`](AGENT_RULES.md), and the active scope in
[`CURRENT_TASK.md`](CURRENT_TASK.md).

**Current state:** M0 — Foundation. The app renders a foundation preview page; no product features
exist yet.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · PostgreSQL · Drizzle ORM · Zod · Better Auth ·
Vitest · Playwright · pnpm · Docker Compose (PostgreSQL only).

## Prerequisites

| Tool                   | Version                                      |
| ---------------------- | -------------------------------------------- |
| Node.js                | 24 LTS (see `.nvmrc`)                        |
| pnpm                   | 11 (pinned in `package.json` → `packageManager`; `corepack enable` picks it up) |
| Docker + Docker Compose | Any recent version                          |

Next.js runs directly on your machine; only PostgreSQL runs in Docker.

## Setup

```sh
pnpm install
cp .env.example .env
```

Then edit `.env`:

- `BETTER_AUTH_SECRET` — replace the placeholder with a real secret:
  `openssl rand -base64 32`. The placeholder works for local development but the app **refuses to
  start with it when `NODE_ENV=production`**.
- The database URLs already match `docker-compose.yml`; leave them unless you changed the compose
  file.

`.env` is git-ignored. Never commit real secrets.

### Environment variables

| Variable             | Used by                         | Notes                                                       |
| -------------------- | ------------------------------- | ----------------------------------------------------------- |
| `DATABASE_URL`       | app, `db:migrate`, `db:seed`    | Local dev database `tripmate` on port **5433**              |
| `TEST_DATABASE_URL`  | integration tests only          | Must name a database ending in `_test`, different from `DATABASE_URL` |
| `BETTER_AUTH_SECRET` | app (Better Auth)               | ≥ 32 characters                                             |
| `BETTER_AUTH_URL`    | app (Better Auth)               | Base URL of the app, e.g. `http://localhost:3000`           |

The server validates configuration at startup and **exits with a list of the missing or invalid
variable names** (never their values) if anything is wrong.

## Start PostgreSQL

```sh
pnpm db:up        # docker compose up -d --wait postgres
```

- Listens on `127.0.0.1:5433` (port 5432 is left free for a local Homebrew PostgreSQL).
- On first start it creates two databases: `tripmate` (development) and `tripmate_test`
  (integration tests).
- Data persists in the Docker volume `tripmate_tripmate-pgdata`.
- Stop it with `docker compose stop` (data is kept).

## Run migrations and seed

```sh
pnpm db:migrate   # apply committed migrations to DATABASE_URL
pnpm db:seed      # upsert development reference data (safe to re-run)
```

> **Currency data is a development/test subset** (JPY, USD, EUR, KWD), clearly marked in
> `src/db/seed/currencies.ts`. It is **not** the canonical ISO 4217 list, which must be added before
> M1 Create Trip. `db:seed` refuses to run with `NODE_ENV=production`.

### Changing the schema

1. Edit `src/db/schema/*`.
2. `pnpm db:generate --name <short-description>` — writes a new SQL file to `src/db/migrations/`.
3. Review the generated SQL, then `pnpm db:migrate`.
4. Commit the schema change and the migration together.

Never use `drizzle-kit push`, and never edit a migration that has already been applied — create a
new one. `pnpm db:studio` opens Drizzle Studio against `DATABASE_URL`.

### Resetting the local database

There is deliberately no reset script. To wipe **local** data and start from empty:

```sh
docker compose down
docker volume rm tripmate_tripmate-pgdata
pnpm db:up && pnpm db:migrate && pnpm db:seed
```

This deletes all local development and test data.

## Run the app

```sh
pnpm dev          # http://localhost:3000
```

## Tests and quality checks

| Command                 | What it runs                                       | Needs                         |
| ----------------------- | -------------------------------------------------- | ----------------------------- |
| `pnpm check`            | lint + format check + typecheck + unit tests       | nothing                       |
| `pnpm lint`             | ESLint                                             | nothing                       |
| `pnpm format:check`     | Prettier check (`pnpm format` to fix)              | nothing                       |
| `pnpm typecheck`        | `tsc --noEmit`                                     | nothing                       |
| `pnpm test:unit`        | Vitest unit tests                                  | nothing                       |
| `pnpm test:integration` | Vitest against real PostgreSQL (`tripmate_test`)   | PostgreSQL running (`db:up`)  |
| `pnpm test`             | unit + integration                                 | PostgreSQL running            |
| `pnpm test:e2e`         | Playwright smoke tests at 360px, 430px, 1280px     | `.env`; first time: `pnpm exec playwright install chromium` |

Integration tests:

- refuse to run unless `TEST_DATABASE_URL` names a `*_test` database that differs from
  `DATABASE_URL`;
- apply the committed migrations to the test database first;
- run each test in a transaction that is rolled back, so no data is left behind.

`pnpm test:e2e` starts its own dev server on port 3100 (or reuses one already running there).

## Build

```sh
pnpm build
pnpm start        # serves the production build; requires a real BETTER_AUTH_SECRET
```

## Continuous integration

`.github/workflows/ci.yml` (GitHub Actions) runs on pushes to `main` and on pull requests:

- **quality:** install → lint → format check → typecheck → unit tests → build
- **integration:** the integration suite against a fresh PostgreSQL 18 service container, which also
  proves the migrations apply to an empty database

Playwright smoke tests are not in CI yet; they are the next CI extension.

## Project structure

```text
src/
├── app/              Next.js routes, layout, global styles and design tokens
├── components/ui/    Shared UI primitives (Button, IconButton, Input, Textarea, Label, Card)
├── db/               Drizzle client, schema, migrations, seed
├── lib/              Validated env config, Better Auth setup, small utilities
└── test/integration/ Integration test harness and test-database guard
e2e/                  Playwright smoke tests
docker/               PostgreSQL init scripts
```

Further directories (`src/modules`, `src/domain`, `src/integrations`) are added when the first
code that belongs in them exists.
