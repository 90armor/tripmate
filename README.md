# TripMate

Mobile-first web app for planning trips — solo or as a group — in one shared place: itinerary,
places, bookings, expenses, and settlement.

This README is operational: how to run, test, and build. Product and technical decisions live in
[`docs/`](docs/), agent rules in [`AGENT_RULES.md`](AGENT_RULES.md), and the active scope in
[`CURRENT_TASK.md`](CURRENT_TASK.md).

**Current state:** M1 — First Trip. Sign up / sign in / sign out (email + password), profile
(display name), My Trips, Create Trip, the Trip Workspace (Overview plus intentional empty states for
sections not built yet), and Trip Settings with archive / unarchive. Trips are single-member until
invitations arrive in M2.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · PostgreSQL · Drizzle ORM · Zod · Better Auth ·
Vitest · Playwright · pnpm · Docker Compose (PostgreSQL; optionally the whole dev stack).

## Prerequisites

| Tool                   | Version                                      |
| ---------------------- | -------------------------------------------- |
| Node.js                | 24 LTS (see `.nvmrc`)                        |
| pnpm                   | 11 (pinned in `package.json` → `packageManager`; `corepack enable` picks it up) |
| Docker + Docker Compose | Any recent version                          |
| jq                     | Any recent version. Required by the Claude Code hooks in `.claude/hooks/` (e.g. `block-main.sh`); without it they block Bash/Edit/Write by design |

By default Next.js runs directly on your machine and only PostgreSQL runs in Docker. To run the
whole development stack in Docker instead (only Docker needed), see
[Run everything in Docker](#run-everything-in-docker-optional).

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
| `DEV_ALLOWED_ORIGINS` | `pnpm dev` only (optional)     | Comma-separated extra hostnames, e.g. your LAN IP — see [Test on a phone](#test-on-a-phone) |

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

Open it and **create an account** on the Sign Up page — there are no built-in users. Accounts are
email + password ([Better Auth](https://www.better-auth.com/), sessions in PostgreSQL); there is no
email verification yet, so any address works locally. Run `pnpm db:seed` first, or Create Trip has no
currencies to offer. To try it on a phone, see [Test on a phone](#test-on-a-phone).

## Run everything in Docker (optional)

An alternative to the host setup above: PostgreSQL, migrations + seed and the Next.js dev server all
run in Docker Compose. Nothing but Docker is needed — no Node.js, pnpm or `.env` on your machine.
Decision: ROADMAP D23.

```sh
pnpm docker:dev
# without pnpm on the host, run the same command directly:
docker compose up --build --renew-anon-volumes migrate app
```

It starts, in order:

1. **`postgres`** — the same container and data volume as `pnpm db:up`. If it is already running it
   is left alone.
2. **`migrate`** — one-shot `pnpm db:migrate && pnpm db:seed`, then exits. The app starts only if it
   succeeds.
3. **`app`** — `next dev` on <http://localhost:3000>, with your working tree bind-mounted so edits
   hot-reload (about 1–2 s).

Stop with Ctrl+C or `docker compose stop`. Data stays in the volume `tripmate_tripmate-pgdata`.

> **This is a local development image, not a production image.** It contains every
> devDependency, runs `next dev`, and uses a public placeholder secret. No hosting or production
> image decision has been made (ARCHITECTURE §87).

### Configuration in the container

- **No `.env` needed.** `docker-compose.yml` sets `DATABASE_URL` (the in-network address
  `postgres:5432`), `BETTER_AUTH_URL=http://localhost:3000`, and the `.env.example` placeholder
  `BETTER_AUTH_SECRET`. The placeholder is accepted only because the container runs in development
  with a localhost `BETTER_AUTH_URL`.
- **Values set by compose win over `.env`.** If you have a `.env`, its `BETTER_AUTH_URL`,
  `BETTER_AUTH_SECRET` and `DATABASE_URL` are ignored in the container. Variables compose does not
  set, such as `DEV_ALLOWED_ORIGINS`, are still read from `.env` through the bind mount.
- `.env` files are never copied into the image (`.dockerignore`).

### Things to know

- **Use `pnpm docker:dev`, not a bare `docker compose up`.** A bare `up` skips `--build` and
  `--renew-anon-volumes`: after a dependency change the container keeps its old image and its old
  `node_modules` volume, and fails or behaves differently from the lockfile.
- **Cold compile on every start.** `--renew-anon-volumes` also gives the container an empty `.next`,
  so the first request to each page compiles from scratch (a few seconds).
- **Port 3000 is open on your network, with a public secret.** Like host `pnpm dev`, the app listens
  on all interfaces (so a phone can reach it), and its sessions are signed with the public
  placeholder secret. Anyone on the same network can open it. Use trusted networks only and never
  real data.
- **Host `pnpm dev` and the container both use port 3000** — run one at a time
  (`docker compose stop app`). They use the **same database** (`tripmate`), so accounts and trips
  are shared. They also share `localhost` cookies; switching between them signs you out only when
  the secrets differ (a host `.env` that still uses the `.env.example` placeholder has the same
  secret, so you stay signed in).
- **`.next/types` is not shared.** The container keeps its own `.next` (including generated route
  types) in a container volume. Your editor and host `pnpm typecheck` use the host's `.next`;
  `pnpm typecheck` regenerates it (`next typegen`).
- **Linux hosts:** the container runs as uid/gid 1000 (`node`), and files it writes into the
  bind-mounted working tree (for example `next-env.d.ts`) are owned by uid 1000. If your user is not
  uid 1000, expect permission errors. Also, the anonymous volume mount points can leave empty,
  root-owned `node_modules/` and `.next/` folders in the working tree, so a later host
  `pnpm install` may fail with `EACCES`. Fix: remove those empty folders with `sudo`, or run the
  stack as your own uid. Docker Desktop on macOS maps ownership, so none of this applies there.
- **Phone testing:** add `DEV_ALLOWED_ORIGINS=<your LAN IP>` to `.env` as in
  [Test on a phone](#test-on-a-phone), then `docker compose restart app`.
- Quality checks and tests (`pnpm check`, `test:integration`, `test:e2e`) still run on the host.

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
| `pnpm test:e2e`         | Playwright at 360px, 430px, 1280px (Chromium) plus iPhone WebKit for Create Trip and Trip Settings | `.env`; first time: `pnpm exec playwright install chromium webkit` |

Integration tests:

- refuse to run unless `TEST_DATABASE_URL` names a `*_test` database that differs from
  `DATABASE_URL`;
- apply the committed migrations to the test database first;
- run each test in a transaction that is rolled back, so no data is left behind. Exception:
  `src/lib/auth/create-auth.int.test.ts` lets Better Auth write through its own connection,
  so those rows are committed; the test deletes the users it created in `afterEach`.

`pnpm test:e2e` starts its own dev server on port 3100 against `tripmate_test` (never the
development database), first applying migrations and seeding currencies there. Each test signs up its
own random account. Next.js allows one `next dev` per project folder, so stop any other `pnpm dev`
first.

### Test on a phone

`pnpm dev` listens on your network, but Next.js only lets `localhost` use its dev reload socket.
From a phone the page then never becomes interactive and **reloads itself after about 40 seconds,
clearing the form**. To allow your computer's LAN address:

1. Find it: `ipconfig getifaddr en0` (macOS).
2. Add it to `.env`: `DEV_ALLOWED_ORIGINS=192.168.1.20` (hostname only — no `http://`, no port).
3. Restart `pnpm dev`, then open `http://192.168.1.20:3000` on the phone (same Wi-Fi).

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
- **docker-build:** builds the `dev` target of the `Dockerfile` (nothing is pushed or run), so the
  Docker dev stack keeps working with the current lockfile

Playwright tests are not in CI yet; they are the next CI extension.

## Project structure

```text
src/
├── app/              Next.js routes, layout, global styles and design tokens
├── components/       Shared UI primitives (ui/) and app chrome (shared/)
├── db/               Drizzle client, schema, migrations, seed
├── domain/           Pure business rules (trip status, dates) — no React, Next.js or database
├── lib/              Validated env config, Better Auth setup, errors, small utilities
├── modules/          Feature modules: schemas, services, queries, actions, components
│                     (auth, users, trips — incl. the trip access guard — currencies)
└── test/integration/ Integration test harness and test-database guard
e2e/                  Playwright end-to-end tests
docker/               PostgreSQL init scripts
Dockerfile            Local development image for `pnpm docker:dev` (not a production image)
```

`src/integrations` is added when the first external integration exists.
