# TripMate

Mobile-first web app for planning trips (solo or group) in one shared place:
itinerary, places, hotels/bookings, food, activities, expenses, and settlement.

## Before any task

1. Read `AGENT_RULES.md` — mandatory, every task.
2. Read `CURRENT_TASK.md` — the only scope you may implement.
3. Read the `docs/` files that task names. Docs map:
   - Product: `PROJECT_OVERVIEW`, `USER_FLOWS`, `FEATURES`, `INFORMATION_ARCHITECTURE`
   - Technical: `ARCHITECTURE`, `DATABASE`, `DESIGN_SYSTEM`
   - Scope and locked decisions: `ROADMAP` (see its **Decision Log**, D1–D19)

If the docs contradict each other or do not decide something you need, stop and ask.
Do not pick an answer and write it into the docs as if it were decided.

## Non-negotiables

- Stack is locked (CURRENT_TASK §3). Do not swap or add frameworks without approval.
  Auth is **Better Auth** (D1), not Auth.js / next-auth.
- Money: never use JS floating point. NUMERIC in Postgres, decimal library in code.
  Follow the rounding, remainder (D4), base-share (D5), and settlement (D6) rules exactly.
- Domain code in `src/domain` must not import React, Next.js, Drizzle, or HTTP.
- Authorization is server-side and trip-scoped on every operation. Hidden UI is not security.
- Schema changes go through committed migrations only. Never `drizzle-kit push`.
  Never edit a migration that has already been applied.
- Never read, print, or edit `.env` files with real values. Use `.env.example`.
- Ask before adding any dependency; say why it is needed.
- Insert trip_members one row per INSERT (D9). Emails are stored lowercase (D10).

## Workflow

- Start in plan mode: read, then write a plan. No code until the owner approves the plan.
- Work in small steps. Run the quality commands after each meaningful step.
- Never say "done" or "tests pass" without having run the commands; show the output summary.
- When the milestone's acceptance criteria are met, write the completion report
  (CURRENT_TASK "Completion Report") and **stop**. Do not start the next milestone.
- After implementation, the `reviewer` subagent audits the change before the owner approves.

## Commands

- `pnpm db:up` — start local PostgreSQL (Docker Compose) and wait until healthy
- `pnpm db:migrate` — apply committed migrations; `pnpm db:generate` — create a migration from schema changes
- `pnpm db:seed` — upsert currency reference data
- `pnpm dev` — run the Next.js dev server
- `pnpm check` — lint + format check + typecheck + unit tests (main local gate)
- `pnpm test:integration` — PostgreSQL integration tests against `tripmate_test`
- `pnpm test:e2e` — Playwright (360, 430 and 1280px)
- `pnpm build` — production build

M0 baseline: check 29/29 unit, integration 16/16, e2e 15/15, build OK.

## Blocked by hooks (do not try to work around them)

Destructive shell commands (`rm -rf` outside build/cache folders, force push, `git reset --hard`,
dropping databases or volumes, `drizzle-kit push`) and access to real `.env` files are blocked.
If you genuinely need one, explain why and ask the owner to run it.
