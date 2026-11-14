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
| jq                     | Any recent version. Required by the Claude Code hooks in `.claude/hooks/` (e.g. `block-main.sh`); without it they block Bash/Edit/Write by design |

Next.js runs directly on your machine; only PostgreSQL runs in Docker.

## Setup

```sh
pnpm install
cp .env.example .env
```

Then edit `.env`:

- `BETTER_AUTH_SECRET` — replace the placeholder with a real secret:
  `openssl rand -base64 32`. The placeholder works for local development but the app **refuses to
  start with it when `NODE_ENV=production` or when `BETTER_AUTH_URL`'s host is not `localhost` /
  `127.0.0.1`** (for example a staging or preview deployment).
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
pnpm db:seed      # upsert ISO 4217 currency reference data (safe to re-run)
```

`db:seed` refuses to run with `NODE_ENV=production`; production seeding is set up with deployment.

### Currency reference data

Currencies come from a committed snapshot of **ISO 4217 List One**,
[`src/db/seed/iso-4217-list-one.json`](src/db/seed/iso-4217-list-one.json), which records its
source URL, publication date and retrieval date (ROADMAP D13). Excluded: codes without minor units
(metals, bond units, XDR, XSU, XUA, XTS, XXX) and ISO fund codes (`IsFund="true"`, e.g. USN, BOV,
CLF). `symbol` stays NULL; money is displayed with `Intl.NumberFormat` currency formatting. The
seed upserts every listed code; a code that disappears from a newer list (or a fund code seeded
before D13 was amended) is set `active = false`, never deleted.

To refresh the snapshot:

1. Download List One XML from SIX (linked from SIX "Data standards"):
   `https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml`
2. `pnpm exec tsx src/db/seed/import-iso-4217.ts path/to/list-one.xml`
3. Review the JSON diff, commit it, then run `pnpm db:seed`.

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
| `pnpm lint`             | ESLint (warnings fail the run)                     | nothing                       |
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
- run each test in a transaction that is rolled back, so no data is left behind. Exception:
  `src/lib/auth/create-auth.int.test.ts` lets Better Auth write through its own connection,
  so those rows are committed; the test deletes the users it created in `afterEach`.

`pnpm test:e2e` starts its own dev server on port 3100 (or reuses one already running there).

## Git hooks

`pnpm install` sets up [husky](https://typicode.github.io/husky/) hooks automatically (the
`prepare` script). Nothing else to configure.

| Hook         | Runs                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------- |
| `pre-commit` | kebab-case check for files added or renamed under `src/` and `e2e/` (migrations exempt), then Prettier + ESLint (zero warnings) on the staged files via lint-staged |
| `pre-push`   | `pnpm check`                                                                                  |

Integration and e2e tests run in CI only. When Claude Code edits a file it is also formatted and
linted by `.claude/hooks/format-lint.sh`.

Skipping the hooks (`git commit --no-verify`, `HUSKY=0`, changing `core.hooksPath`) is for the
owner only; `.claude/hooks/guard-bash.sh` blocks agents from doing it. Decision: ROADMAP D20.

## Build

```sh
pnpm build
pnpm start        # serves the production build; requires a real BETTER_AUTH_SECRET
```

## Continuous integration

`.github/workflows/ci.yml` (GitHub Actions) runs on pull requests and on merges to `main`:

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
