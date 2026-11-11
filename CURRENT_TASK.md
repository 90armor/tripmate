# TripMate — Current Task

## M0 — Foundation

**Status:** READY  
**Milestone:** M0 — Foundation  
**Next Milestone:** M1 — First Trip

---

# 1. Goal

Establish a clean, production-oriented technical foundation for TripMate so that M1 can begin feature development without restructuring the project.

At the end of M0, the repository should have:

- working Next.js application
- TypeScript
- Tailwind CSS
- responsive application foundation
- PostgreSQL local development environment
- Drizzle ORM and migrations
- Zod validation
- Better Auth foundation
- testing infrastructure
- CI-ready quality commands
- initial design tokens/components
- documented environment setup

M0 must not expand into actual TripMate feature implementation.

---

# 2. Required Reading

Before modifying the repository, read:

```text
PROJECT_OVERVIEW.md
USER_FLOWS.md
FEATURES.md
INFORMATION_ARCHITECTURE.md
DATABASE.md
ARCHITECTURE.md
DESIGN_SYSTEM.md
ROADMAP.md
AGENT_RULES.md
CURRENT_TASK.md
```

`AGENT_RULES.md` is mandatory.

Do not silently override documented product or architecture decisions.

---

# 3. Locked Stack

Use:

```text
Next.js App Router
TypeScript
Tailwind CSS

PostgreSQL
Drizzle ORM
Drizzle Kit

Zod

Better Auth

Vitest
Playwright

pnpm
Docker Compose
```

Do not replace these technologies without explicit approval.

---

# 4. Package Manager

Use:

```text
pnpm
```

Repository should contain:

```text
pnpm-lock.yaml
```

Do not maintain multiple lockfiles.

Remove accidental:

```text
package-lock.json
yarn.lock
```

if the repository is newly bootstrapped and they are not intentionally required.

---

# 5. Runtime

Use the Node.js runtime for server/database behavior.

Do not optimize TripMate's database/domain logic around Edge runtime during M0.

The project should declare/document a supported Node version so local development and CI remain consistent.

Prefer an active LTS release compatible with the selected framework/dependencies.

Do not unnecessarily pin an obsolete runtime.

---

# 6. Next.js Foundation

Use:

```text
App Router
src/ directory
TypeScript
Tailwind CSS
```

Initial structure should support:

```text
src/app
src/components
src/modules
src/domain
src/db
src/lib
src/integrations
```

Do not create unnecessary empty subdirectories simply to mirror architecture documentation.

---

# 7. Initial Application

The root application should render a minimal TripMate foundation screen.

This is not the final landing page.

It should confirm:

- application works
- global typography works
- design tokens work
- responsive layout works

Avoid spending significant time building marketing content.

---

# 8. Design Foundation

Implement semantic design tokens consistent with `DESIGN_SYSTEM.md`.

Initial categories:

```text
background
surface
text
muted text
border
primary action
success
warning
danger
focus
```

Brand identity is not finalized.

Do not overcommit to a permanent brand palette.

---

# 9. Typography

Use:

```text
Inter
```

as the initial product UI font.

Configure it through the Next.js/font strategy appropriate for the current project setup.

Provide sensible fallback fonts.

---

# 10. Global Styling

Establish:

```text
body background
primary text
font
focus-visible behavior
basic selection behavior if appropriate
safe responsive defaults
```

Avoid large global CSS files full of component-specific styling.

Prefer Tailwind and semantic tokens.

---

# 11. Initial UI Primitives

Implement only primitives immediately useful for M1.

Required:

```text
Button
IconButton
Input
Card
```

Recommended if naturally needed:

```text
Textarea
Label
```

Do not build all future primitives during M0.

Defer:

```text
complex Dialog
Sheet
Tabs
Toast
MoneyInput
Timeline
SplitEditor
```

until a real feature requires them.

---

# 12. UI Primitive Requirements

Each implemented primitive should consider:

- semantic HTML
- keyboard interaction
- focus-visible state
- disabled state
- touch target
- accessible name where required
- responsive use

Do not create visual-only components that ignore accessibility.

---

# 13. PostgreSQL Local Development

Use Docker Compose for the default local PostgreSQL environment.

Provide a service such as:

```text
postgres
```

with:

- development database
- development user
- local volume
- health check where practical

Credentials used for local development may come from `.env` configuration.

Do not commit production credentials.

---

# 14. Docker Scope

M0 Docker is primarily for:

```text
PostgreSQL
```

Do not containerize the entire Next.js development environment unless there is a concrete need.

Developers should be able to run Next.js normally on macOS while PostgreSQL runs in Docker.

---

# 15. Environment Configuration

Provide:

```text
.env.example
```

Do not commit:

```text
.env
.env.local
```

with real secrets.

Initial configuration may include:

```text
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
```

Use the names actually required by the installed Better Auth version.

Do not invent unused variables.

---

# 16. Environment Validation

Use Zod to validate required server environment configuration.

Conceptual structure:

```text
src/lib/env.ts
```

Requirements:

- fail early for missing required configuration
- keep server secrets server-only
- do not expose server variables to client bundles
- distinguish public variables explicitly if introduced later

---

# 17. Drizzle Foundation

Configure:

```text
Drizzle ORM
Drizzle Kit
PostgreSQL driver
```

Database configuration should support:

```text
schema definitions
migration generation
migration execution
application queries
tests
```

---

# 18. Database Structure

Initial structure may resemble:

```text
src/db/
├── index.ts
└── schema/
    ├── users.ts
    ├── currencies.ts
    ├── trips.ts
    ├── members.ts
    └── index.ts
```

Migration output should live in one clearly defined repository location.

Follow Drizzle conventions where they are clearer than unnecessary custom structure.

---

# 19. Initial Database Scope

M0 may establish the minimum schemas required to validate the database foundation:

```text
users
currencies
trips
trip_members
```

However:

> Do not implement M1 user-facing Trip CRUD during M0.

The goal is schema/migration readiness.

---

# 20. Currency Reference Data

Prepare a maintainable strategy for currency metadata:

```text
code
name
symbol
minor_units
active
```

Do not manually create an incomplete arbitrary list and treat it as authoritative.

If a complete seed dataset is not appropriate during M0, establish the seed mechanism and include only clearly marked development/test data until the canonical dataset is added.

---

# 21. UUID Strategy

Business entities use UUIDs.

Use PostgreSQL/application UUID generation compatible with the established database architecture.

If UUIDv7 support is straightforward and well-supported by the selected tooling/runtime, it may be considered.

Do not introduce custom UUID complexity solely to obtain UUIDv7 during M0.

Correctness and portability are more important.

---

# 22. Migration Commands

Provide clear package scripts for common database operations.

Conceptually:

```text
db:generate
db:migrate
db:studio
```

Exact names may follow established project conventions.

Commands should be documented.

---

# 23. Database Reset / Development Workflow

Provide a safe documented local-development workflow.

If a destructive reset command is added:

- make its intent obvious
- ensure it targets local/test environments
- do not make production destruction easy by accident

---

# 24. Better Auth Foundation

Better Auth is the locked authentication solution (ROADMAP Decision Log D1).

M0 should establish enough foundation so M1 can implement authentication without architectural restructuring.

This may include:

```text
Better Auth dependency
base auth configuration
Drizzle adapter / database integration preparation if required
auth utility location
session typing strategy
```

Do not build the full user authentication experience unless it is required to prove configuration.

---

# 25. Auth Boundary

Keep Better Auth concerns conceptually under:

```text
src/lib/auth
```

or another clearly defined infrastructure boundary.

Do not place TripMate membership authorization inside Better Auth hooks or callbacks.

Trip authorization belongs to TripMate application logic.

---

# 26. User Identity

TripMate uses its own:

```text
users.id
```

as domain identity.

Map Better Auth's user model onto the TripMate `users` table so that the Better Auth user ID is `users.id` (see `DATABASE.md` §10 and `ARCHITECTURE.md` §26).

Better Auth's session, account, and verification tables are auth infrastructure that reference `users.id`; they may be created in M0 only if required to prove configuration.

Domain tables reference `users.id` only.

Do not make the entire domain depend directly on provider-specific identifiers.

---

# 27. Testing Foundation

Configure:

```text
Vitest
Playwright
```

Add DOM/component testing utilities only if an M0 test actually needs them.

Do not install a large testing stack without usage.

---

# 28. Unit Test

Include at least one meaningful unit test proving the unit-test setup.

Prefer testing:

```text
environment helper
small pure utility
```

rather than:

```text
expect(true).toBe(true)
```

---

# 29. Database Integration Test

Establish a path for PostgreSQL integration tests.

The test should demonstrate:

```text
connect to test database
execute real PostgreSQL behavior
isolate test data
clean up safely
```

Do not run database tests against the normal development database if avoidable.

---

# 30. Test Database

Use a dedicated test database or isolated test PostgreSQL configuration.

Example concept:

```text
tripmate
tripmate_test
```

Tests must never point to production.

---

# 31. Playwright Foundation

Configure Playwright.

Include a minimal smoke test such as:

```text
application loads
main heading is visible
```

Do not build M1 E2E flows before M1 exists.

---

# 32. Quality Scripts

Package scripts should make quality checks straightforward.

Conceptually:

```text
dev
build
start

lint
typecheck
test
test:unit
test:integration
test:e2e

db:generate
db:migrate
```

Exact organization may be adjusted if clearer.

---

# 33. One Quality Command

Prefer a convenient command that runs the main local quality gate.

Example:

```text
pnpm check
```

which may run:

```text
lint
typecheck
unit tests
```

Do not include slow E2E automatically if it makes normal iteration unnecessarily expensive.

---

# 34. CI Foundation

Create a minimal CI workflow appropriate for the repository host.

Initial gate:

```text
install
lint
typecheck
unit tests
build
```

Database integration and Playwright may be included if the CI environment is configured reliably.

Otherwise document them as the next CI extension rather than creating unstable CI.

---

# 35. Git Hygiene

Ensure:

```text
.env*
build output
test artifacts
Playwright artifacts
local database artifacts
```

are ignored appropriately.

Do not ignore:

```text
.env.example
migration files
documentation
```

---

# 36. README

Create/update `README.md` with practical developer onboarding.

Include:

```text
Project summary

Prerequisites

Install

Environment setup

Start PostgreSQL

Run migrations

Run development server

Run tests

Build
```

Keep README operational.

Product specification belongs in the dedicated documentation.

---

# 37. Documentation Location

If the repository stores project documents under:

```text
docs/
```

use a consistent structure.

Example:

```text
docs/
├── PROJECT_OVERVIEW.md
├── USER_FLOWS.md
├── FEATURES.md
├── INFORMATION_ARCHITECTURE.md
├── DATABASE.md
├── ARCHITECTURE.md
├── DESIGN_SYSTEM.md
└── ROADMAP.md
```

Project-operational files may remain at root:

```text
AGENT_RULES.md
CURRENT_TASK.md
README.md
```

Do not move existing documentation unnecessarily if the repository already has an established convention.

---

# 38. Initial Responsive Shell

M0 may create the structural foundation for:

```text
mobile layout
desktop layout
```

but should not fully implement the Trip Workspace navigation before M1 has actual trip context.

Avoid fake navigation containing many dead links.

---

# 39. Mobile Foundation

Verify at minimum:

```text
small phone viewport
large phone viewport
desktop
```

Check:

- typography
- spacing
- overflow
- touch targets
- focus
- no accidental horizontal scrolling

---

# 40. Accessibility Foundation

M0 should establish good defaults.

Required:

```text
semantic page structure
focus-visible style
proper buttons
form labels
sensible color contrast
reduced-motion consideration where motion exists
```

Do not postpone basic accessibility architecture.

---

# 41. Error Boundary Foundation

Use framework-appropriate handling for:

```text
not found
unexpected route error
loading
```

Keep M0 implementation simple.

Do not build an elaborate global error framework.

---

# 42. Logging

Use normal server logging conservatively during M0.

Do not introduce a logging vendor yet.

Do not log:

```text
BETTER_AUTH_SECRET
DATABASE_URL credentials
session token
```

---

# 43. Observability

External monitoring is not required in M0.

Defer provider selection until deployment becomes relevant.

---

# 44. External Integrations

Do not implement during M0:

```text
Maps provider
Exchange-rate provider
Email provider
Storage provider
AI provider
```

Integration directories/interfaces may be created only when needed.

Avoid speculative empty abstractions.

---

# 45. PWA

Do not implement full PWA/offline behavior during M0.

Ensure architecture does not prevent later PWA support.

Actual PWA hardening belongs to:

```text
M7 — Travel Ready
```

---

# 46. Security Baseline

M0 must:

- keep secrets server-side
- validate environment configuration
- avoid exposing DB credentials
- avoid unsafe debug endpoints
- use framework security defaults appropriately

Detailed trip authorization begins with M1/M2.

---

# 47. Performance Baseline

Do not add premature caching.

Do not add Redis.

Do not optimize based on hypothetical scale.

Keep the initial application lightweight and avoid unnecessary client JavaScript.

---

# 48. Explicitly Out of Scope

M0 must not implement:

```text
Full authentication UX

Trip CRUD UI

Trip invitations

Members UI

Saved places

Itinerary

Today Mode

Bookings

Checklist

Expenses

Balances

Settlements

Maps

PWA offline caching

Realtime

AI

Native app
```

These belong to later milestones.

---

# 49. M0 Deliverable

At completion, a developer should be able to:

```text
git clone

pnpm install

copy .env.example

start PostgreSQL

run migrations

pnpm dev
```

and see a functioning TripMate foundation.

They should also be able to run:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

with documented expected behavior.

---

# 50. Acceptance Criteria

M0 is complete only when:

- Next.js application runs
- TypeScript passes
- Tailwind works
- Inter is configured
- semantic design foundation exists
- responsive root UI works
- PostgreSQL runs locally
- Drizzle connects
- migrations run from empty database
- environment validation works
- Better Auth foundation exists
- Vitest works
- PostgreSQL integration-test path works
- Playwright smoke test works
- lint passes
- build passes
- README setup instructions are accurate
- secrets are not committed

---

# 51. Validation Required

Before marking complete, run the applicable commands.

Expected categories:

```text
pnpm lint

pnpm typecheck

pnpm test

pnpm build

database migration validation

Playwright smoke test
```

If database or browser validation cannot run because of environment limitations, report the exact limitation.

Do not claim success without execution evidence.

---

# 52. Completion Report

When M0 is complete, report:

## Implemented

Short summary.

## Architecture Decisions

Only decisions made beyond existing docs.

## Files Added / Changed

Important files only.

## Database

Migration/schema status.

## Validation

Exact commands run and outcomes.

## Deferred

Anything intentionally left for M1+.

## Risks / Follow-Up

Only meaningful remaining concerns.

---

# 53. Do Not Start M1 Automatically

After M0 passes its quality gate:

> Stop.

Do not implement:

```text
Sign Up
Sign In UI
Create Trip
```

unless explicitly instructed to continue into M1.

The next task should update:

```text
CURRENT_TASK.md
```

to:

```text
M1 — First Trip
```

before M1 implementation begins.

---

# 54. Final M0 Principle

The goal is not to create the most sophisticated foundation.

The goal is:

> A small, clean, tested foundation that allows TripMate's first real product slice to be built without architectural rework.