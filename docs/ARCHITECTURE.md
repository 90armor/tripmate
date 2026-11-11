# TripMate — Technical Architecture

## 1. Purpose

This document defines the technical architecture for TripMate.

It translates the established product, user-flow, information-architecture, and database decisions into an implementation strategy.

The architecture should optimize for:

- fast MVP development
- strong domain correctness
- mobile-first web delivery
- financial reliability
- maintainability
- real-trip validation
- future native-client reuse

TripMate should avoid both extremes:

- a quick prototype with business logic scattered everywhere
- an over-engineered distributed architecture before product validation

---

# 2. Architecture Summary

TripMate will begin as a:

> **Modular monolith with explicit domain boundaries**

Primary stack:

```text
Next.js
TypeScript
Tailwind CSS
PostgreSQL
Drizzle ORM
Zod
```

Architecture:

```text
Browser / PWA
      │
      ▼
Next.js Application
      │
      ├── UI Layer
      ├── Application Layer
      ├── Domain Layer
      ├── API Boundary
      └── Infrastructure Layer
                │
                ▼
            PostgreSQL
```

Future:

```text
Web / PWA ───────┐
                 │
Native Mobile ───┼── API / Application Services
                 │
Other Clients ───┘
                         │
                         ▼
                     PostgreSQL
```

---

# 3. Architecture Principles

## 3.1 Modular Monolith First

Do not begin with microservices.

TripMate's domains should remain logically separated while running inside one deployable application.

Benefits:

- simpler deployment
- simpler transactions
- easier local development
- faster feature delivery
- easier debugging
- less infrastructure
- strong domain boundaries without network complexity

Potential future service extraction should be driven by actual operational needs.

---

# 4. Domain Boundaries

Initial modules:

```text
Auth
Users
Trips
Members
Places
Itinerary
Bookings
Checklist
Expenses
Settlements
```

Potential structure:

```text
src/
├── modules/
│   ├── trips/
│   ├── members/
│   ├── places/
│   ├── itinerary/
│   ├── bookings/
│   ├── checklist/
│   ├── expenses/
│   └── settlements/
```

Each module owns its domain behavior.

Modules may collaborate through explicit application services rather than reaching into each other's internals arbitrarily.

---

# 5. Layering

Recommended conceptual layers:

```text
Presentation
     ↓
Application
     ↓
Domain
     ↓
Infrastructure
```

These are architectural responsibilities, not necessarily separate packages for every small file.

---

# 6. Presentation Layer

Responsibilities:

- pages
- layouts
- React components
- forms
- client interactions
- responsive behavior
- loading/error/empty states

Presentation must not contain authoritative business rules.

Bad:

```text
React component calculates final settlement balances.
```

Good:

```text
React component asks financial service for balances
and renders the result.
```

---

# 7. Application Layer

Coordinates use cases.

Examples:

```text
createTrip()
inviteMember()
savePlace()
scheduleActivity()
createExpense()
editExpense()
voidExpense()
recordSettlement()
```

Responsibilities:

- authorization coordination
- validation orchestration
- transactions
- domain operations
- repository calls
- side effects

Example:

```text
createExpense()

1. Authenticate user
2. Verify trip membership
3. Validate request
4. Calculate splits
5. Validate invariant
6. Begin transaction
7. Save expense
8. Save splits
9. Commit
```

---

# 8. Domain Layer

Contains business rules independent of UI and transport.

Examples:

```text
calculateEqualSplit()
calculatePercentageSplit()
calculateBalances()
suggestSettlements()

canEditTrip()
canEditExpense()

validateTripDates()
```

Domain functions should generally accept plain typed data and return plain typed results.

They should not depend directly on:

- React
- HTTP
- Next.js routing
- database connections

This makes them easy to test and reuse.

---

# 9. Infrastructure Layer

Responsibilities:

- PostgreSQL
- Drizzle
- external APIs
- storage
- email
- maps
- exchange rates
- logging

Domain logic should not directly depend on a specific external provider.

Example:

```text
Domain/Application
        ↓
PlaceProvider interface
        ↓
Google/Mapbox/etc.
```

Provider choice can therefore change later.

---

# 10. Next.js

Use:

```text
Next.js App Router
```

Next.js provides:

- routing
- layouts
- server rendering
- React Server Components
- server-side operations
- route handlers
- PWA-compatible web foundation

TripMate should use Next.js as an application framework rather than only a frontend SPA host.

---

# 11. Route Structure

Conceptual route structure:

```text
app/
├── (auth)/
│   ├── sign-in/
│   └── sign-up/
│
├── trips/
│   ├── page.tsx
│   ├── new/
│   │
│   └── [tripId]/
│       ├── layout.tsx
│       ├── today/
│       ├── plan/
│       │   ├── itinerary/
│       │   └── places/
│       ├── expenses/
│       │   ├── transactions/
│       │   ├── balances/
│       │   └── settlements/
│       ├── members/
│       ├── bookings/
│       ├── checklist/
│       └── settings/
│
└── profile/
```

Route groups may be used where they improve layout organization.

---

# 12. Server Components by Default

Use React Server Components by default.

Client Components should be introduced when interaction requires them.

Good Server Component candidates:

```text
Trip overview
Expense list
Member list
Booking list
Initial itinerary data
```

Client Components are appropriate for:

```text
interactive forms
drag/reorder interactions
bottom sheets
optimistic controls
local interactive filters
```

Do not mark entire page trees `"use client"` unnecessarily.

---

# 13. Data Fetching

Server-rendered pages should generally retrieve data on the server.

Conceptually:

```text
Server Component
      ↓
Application Query
      ↓
Repository
      ↓
PostgreSQL
```

Avoid:

```text
Server Component
→ HTTP call to its own API
→ same Next.js server
→ database
```

Internal server code can call application services directly.

External clients use the API boundary.

---

# 14. Mutation Strategy

For web-only interactions, Next.js Server Actions can provide convenient mutation handling.

However:

> Core use cases must not exist only inside Server Actions.

Correct:

```text
Server Action
    ↓
createExpense()
    ↓
Application / Domain
```

Later:

```text
REST API
    ↓
createExpense()
    ↓
same Application / Domain
```

This allows native clients to reuse the same backend behavior.

---

# 15. API Strategy

Use:

> **REST-style JSON API**

for the explicit external/client boundary.

Reasons:

- straightforward
- native-friendly
- easy debugging
- mature tooling
- appropriate for TripMate's domain

Conceptual API:

```text
/api/v1/trips

/api/v1/trips/{tripId}/members

/api/v1/trips/{tripId}/places

/api/v1/trips/{tripId}/activities

/api/v1/trips/{tripId}/expenses

/api/v1/trips/{tripId}/balances

/api/v1/trips/{tripId}/settlements
```

Not every web interaction needs to go through REST initially.

But domain/application behavior must be reusable from it.

---

# 16. API Versioning

Start with:

```text
/api/v1
```

Do not build sophisticated API version negotiation.

The prefix creates a clear future migration boundary for native clients.

---

# 17. API Response Philosophy

Avoid exposing raw database rows.

Return API DTOs.

Example:

```text
ExpenseDTO

id
description
category
originalAmount
originalCurrency
baseAmount
payer
splits
date
```

Database representation and public API representation should be allowed to evolve independently.

---

# 18. PostgreSQL Access

Recommended:

> **Drizzle ORM**

---

# 19. Why Drizzle for TripMate

Both Prisma and Drizzle are viable.

TripMate benefits particularly from:

- PostgreSQL-aware schema design
- explicit SQL concepts
- financial queries
- constraints
- indexes
- transactions
- eventual PostGIS possibility
- predictable relational control

Drizzle stays relatively close to SQL while providing strong TypeScript integration.

This matches TripMate's data-heavy domain well.

---

# 20. Why Not Prisma as the Default Choice

Prisma has excellent developer ergonomics and is a reasonable alternative.

However, TripMate is expected to contain:

- financial aggregate queries
- explicit PostgreSQL constraints
- potentially advanced PostgreSQL features
- geographic capabilities later

The project benefits from retaining stronger visibility into SQL/database behavior.

Therefore:

```text
Preferred: Drizzle
Alternative: Prisma
```

This is not because Prisma is unsuitable.

It is an architectural preference for this product.

---

# 21. Drizzle Structure

Possible structure:

```text
src/
└── db/
    ├── index.ts
    ├── schema/
    │   ├── users.ts
    │   ├── trips.ts
    │   ├── members.ts
    │   ├── places.ts
    │   ├── itinerary.ts
    │   ├── bookings.ts
    │   ├── checklist.ts
    │   ├── expenses.ts
    │   └── settlements.ts
    │
    └── migrations/
```

Do not create one giant schema file.

---

# 22. Repository Strategy

Avoid unnecessary generic repositories.

Bad abstraction:

```text
GenericRepository<T>
create()
update()
delete()
find()
```

It often hides useful SQL behavior without adding domain value.

Prefer focused query/repository functions.

Examples:

```text
findTripForMember()
listTripPlaces()
getTripItinerary()
insertExpense()
replaceExpenseSplits()
getTripFinancialEntries()
```

Repositories should reflect product use cases.

---

# 23. Validation

Recommended:

> **Zod**

Use validation at trust boundaries.

Examples:

```text
form input
API request
external API response
environment variables
```

Concept:

```text
Untrusted Input
      ↓
Zod
      ↓
Typed Input
      ↓
Application Service
```

Zod validation does not replace database constraints or domain validation.

---

# 24. Three Layers of Validation

TripMate should use three complementary levels.

## Input Validation

Zod.

Example:

```text
amount is required
currency code format
date format
```

## Domain Validation

Business logic.

Example:

```text
split totals equal expense amount
member belongs to trip
activity date belongs to trip
```

## Database Validation

Constraints.

Example:

```text
amount > 0
unique membership
valid foreign key
```

Do not rely on only one layer.

---

# 25. Authentication

Authentication should be handled by a proven authentication solution rather than building password/session security manually.

TripMate uses:

> **Better Auth**

(ROADMAP Decision Log D1.)

Architecture requirement:

```text
Authentication
→ stable internal user ID
→ users table
```

The domain should not depend heavily on provider-specific identity structures.

---

# 26. Authentication Decision Boundary

The authentication library should remain replaceable.

Concept:

```text
Better Auth
     ↓
Authenticated Identity
     ↓
TripMate User
```

## Better Auth ↔ users Mapping

Better Auth's user model is mapped onto TripMate's `users` table rather than a separate auth-only user table:

```text
Better Auth user field   → users column
id                       → id (UUID)
email                    → email
name                     → display_name
image                    → avatar_url
emailVerified            → email_verified
createdAt / updatedAt    → created_at / updated_at
```

Better Auth is configured so user IDs are UUIDs, matching `DATABASE.md` §3.3. Exact configuration options depend on the installed Better Auth version.

Better Auth also owns its infrastructure tables:

```text
session
account        (credentials and linked providers)
verification
```

These reference `users.id`.

TripMate business tables reference:

```text
users.id
```

only — never Better Auth session/account/verification records, and not external provider IDs everywhere.

This prevents provider lock-in across the domain model.

---

# 27. Authorization

Authentication answers:

> Who are you?

Authorization answers:

> Can you perform this action in this trip?

TripMate authorization is primarily membership-based.

Every trip-scoped use case should establish:

```text
user
 ↓
trip membership
 ↓
membership status
 ↓
role
 ↓
permission
```

---

# 28. Authorization Must Be Server-Side

Never rely on:

```text
button hidden in UI
```

as security.

Example:

A MEMBER might not see:

```text
Archive Trip
```

but the server must independently reject unauthorized archive requests.

---

# 29. Authorization Helpers

Centralize common rules.

Examples:

```text
requireTripMember()
requireActiveTripMember()
requireTripOwner()

canEditActivity()
canEditExpense()
```

Avoid reimplementing role checks independently in every page.

---

# 30. Financial Engine

Financial logic should be its own domain package/module.

Recommended:

```text
src/
└── domain/
    └── finance/
        ├── money.ts
        ├── split.ts
        ├── balance.ts
        ├── settlement.ts
        └── rounding.ts
```

This code must not depend on React or Drizzle.

---

# 31. Money Representation in Application Code

Avoid JavaScript floating-point arithmetic.

Bad:

```text
0.1 + 0.2
```

Financial calculations should use:

- integer minor units where suitable, or
- a reliable decimal representation/library

Database remains:

```text
NUMERIC
```

Exact implementation should maintain deterministic conversion between application and database representations.

---

# 32. Financial Functions

Core pure functions:

```text
splitEqually()
splitByExactAmounts()
splitByPercentages()

convertCurrency()

calculateMemberBalances()

suggestSettlements()
```

Example:

```text
splitEqually(
  amount = 10000,
  members = [A, B, C]
)

→

A = 3334
B = 3333
C = 3333
```

The remainder rule must remain deterministic.

It is defined in `FEATURES.md` §26 (participants ordered by `trip_members.created_at`, then `id`).

---

# 33. Financial Invariant

The finance module must guarantee:

```text
SUM(member balances) = 0
```

within defined currency precision.

This should be tested heavily.

---

# 34. Financial Domain Independence

The finance engine should be reusable from:

```text
Web
API
Native App
Background Jobs
Tests
```

Example:

```text
HTTP request
     ↓
Application service
     ↓
Finance engine
```

Never:

```text
React component
→ custom balance calculation
```

---

# 35. Transactions

Financial mutations require PostgreSQL transactions.

Example:

```text
createExpense()

BEGIN
  insert expense
  insert splits
  verify invariant
COMMIT
```

Edit:

```text
BEGIN
  lock/check expense version
  update expense
  replace splits
  validate
COMMIT
```

Any failure:

```text
ROLLBACK
```

---

# 36. Concurrency

Planning data can use optimistic interaction.

Financial data requires stronger stale-edit protection.

Recommended:

```text
updated_at
```

or:

```text
version
```

Example:

```text
Expense version 4 loaded

Another member saves version 5

Original user submits version 4

→ conflict
```

Do not silently overwrite version 5.

---

# 37. Error Model

Application errors should use meaningful categories.

Examples:

```text
ValidationError
AuthenticationError
AuthorizationError
NotFoundError
ConflictError
FinancialInvariantError
ExternalServiceError
```

Transport layers convert these to appropriate responses.

Example:

```text
AuthorizationError
→ HTTP 403
```

Domain code should not need to know HTTP status codes.

---

# 38. Forms

Recommended architecture:

```text
Form
 ↓
Client validation
 ↓
Server Action / API
 ↓
Server validation
 ↓
Application service
 ↓
Domain
 ↓
Database
```

Client validation improves UX.

Server validation remains authoritative.

---

# 39. UI State

Prefer server state as the source of truth for persisted domain information.

Local React state should handle:

- temporary UI interaction
- form state
- dialogs
- sheets
- transient selection

Avoid building a large global client store prematurely.

---

# 40. Client Data Library

Do not introduce React Query/TanStack Query everywhere by default.

Server Components already cover many read flows.

Use a client data library only where it provides concrete value, such as:

- live interactive views
- optimistic mutations
- repeated client refresh
- offline synchronization later

This reduces initial complexity.

---

# 41. PWA Architecture

TripMate should be PWA-ready from the beginning.

Foundation:

```text
Web App Manifest
Installable shell
Responsive UI
HTTPS
Service worker strategy
```

PWA functionality should be introduced incrementally.

---

# 42. Offline Strategy

Offline support should evolve in stages.

## Stage 1 — Network-Aware

Detect poor/offline connectivity.

Show meaningful status.

## Stage 2 — Essential Read Cache

Cache:

```text
Today itinerary
Trip basics
Important booking references
```

## Stage 3 — Offline Mutations

Potentially:

```text
Add expense offline
Queue
Sync later
```

Stage 3 is deliberately deferred because conflict resolution is significantly more complex.

---

# 43. Offline Source of Truth

PostgreSQL remains authoritative.

Offline data is:

```text
local cache
```

not an independent truth.

When online:

```text
Server
→ authoritative
```

Offline UX must show when information may be stale.

---

# 44. Service Worker Scope

Do not cache every API response indiscriminately.

Prefer explicit caching strategies.

Examples:

```text
App shell
→ cache-first

Today itinerary
→ network-first with cached fallback

Static assets
→ cache-first

Sensitive account endpoints
→ avoid persistent caching unless intentionally designed
```

Security must be considered when caching private trip information on shared devices.

---

# 45. Maps Architecture

Core product must not depend on one maps provider.

Create an integration boundary:

```text
PlaceProvider

searchPlaces()
getPlaceDetails()
```

Potential future:

```text
DirectionsProvider

getDirectionsLink()
getTravelEstimate()
```

Initial directions may simply open the device's preferred maps application.

---

# 46. Exchange Rate Architecture

Create a provider abstraction:

```text
ExchangeRateProvider

getRate(
  from,
  to,
  date
)
```

But manual exchange-rate entry must always remain available.

If provider fails:

```text
User enters rate manually
```

Core expense recording therefore remains operational.

---

# 47. Booking Integrations

MVP does not need direct booking-provider integrations.

Bookings are user-managed references.

Future integrations should enter through explicit adapters rather than contaminating core booking entities with provider-specific logic.

---

# 48. Background Jobs

Do not introduce a job queue until required.

Potential future use cases:

```text
notification delivery
exchange-rate refresh
flight status checks
AI processing
receipt processing
scheduled reminders
```

MVP can initially avoid persistent background-job infrastructure.

---

# 49. Realtime

Do not make realtime collaboration a Day-1 requirement.

Initial collaboration can use:

```text
save
→ refresh/revalidate
```

Potential future realtime use:

```text
member edits itinerary
others see update immediately
```

Realtime infrastructure should be introduced only if real group usage demonstrates meaningful value.

---

# 50. Caching

Use caching conservatively for private collaborative data.

Potential cache candidates:

```text
currency metadata
static reference data
external place responses
```

Trip state and financial balances should favor correctness and freshness.

Avoid complicated cache invalidation during MVP.

---

# 51. Security Architecture

Core security requirements:

```text
HTTPS
secure authentication
server-side authorization
input validation
secure cookies/session handling
CSRF-safe mutation strategy
secure invitation tokens
rate limiting where needed
database least privilege
secret management
```

Never expose database credentials to the browser.

---

# 52. Invitation Security

Invitation URLs contain bearer-like secrets.

Requirements:

- high-entropy token
- expiration support
- revocation
- hashed token storage where practical
- rate-limited validation
- minimal pre-auth trip exposure

Do not use predictable invitation IDs.

---

# 53. Financial Security

Expense and settlement mutations should verify:

```text
authenticated user
trip membership
permission
all referenced members belong to trip
currency validity
amount validity
split invariant
```

Client-provided calculated totals must not be blindly trusted.

The server recalculates authoritative values.

---

# 54. Environment Configuration

Validate environment variables at application startup.

Potential groups:

```text
DATABASE_URL

AUTH_*

MAPS_*

EXCHANGE_RATE_*

STORAGE_*
```

Use schema validation.

Application should fail early when critical configuration is invalid.

---

# 55. Logging

Use structured logging.

Important context:

```text
request ID
user ID where safe
trip ID
operation
error category
```

Do not log:

```text
passwords
auth tokens
invitation raw tokens
sensitive document content
```

Financial errors should contain enough context for debugging without leaking private data.

---

# 56. Observability

Initial observability:

```text
application errors
server logs
database errors
API latency
```

Later:

```text
tracing
performance metrics
external-provider metrics
sync failures
```

Do not introduce enterprise observability complexity before deployment needs justify it.

---

# 57. Testing Strategy

TripMate requires multiple test layers.

```text
Unit
Integration
Component
End-to-End
```

---

# 58. Unit Tests

Best suited for pure domain logic.

Highest priority:

```text
money
rounding
expense splitting
balance calculation
settlement suggestion
authorization rules
trip date validation
```

Financial unit tests are mandatory.

---

# 59. Property-Based Financial Tests

Strongly recommended.

Generate many combinations of:

```text
amounts
members
currencies
splits
rounding situations
```

Verify invariants such as:

```text
sum splits = expense amount

sum balances = 0
```

This can catch edge cases example-based tests miss.

---

# 60. Integration Tests

Test:

```text
application service
+
database
```

Examples:

```text
create trip

accept invitation

create expense transaction

edit expense

void expense

record settlement
```

Use a real PostgreSQL test database where practical.

Do not rely exclusively on mocked database behavior for financial persistence tests.

---

# 61. Component Tests

Use for important interactive UI behavior.

Examples:

```text
expense split form
itinerary editor
member selector
mobile navigation
```

Avoid testing implementation details.

---

# 62. End-to-End Tests

Recommended tool:

```text
Playwright
```

Critical flows:

```text
Sign up
Create trip
Invite/join
Save place
Add itinerary activity
Add expense
Review balance
Record settlement
```

Also test mobile viewport flows.

---

# 63. Critical E2E Scenario

Automate the product's core validation journey.

```text
User A creates Tokyo trip

User B joins

A adds teamLab

A schedules it

A records ¥10,000 expense
split with A and B

System shows:
A +¥5,000
B -¥5,000

B settles ¥5,000

Both balances become 0
```

This should remain a regression test throughout development.

---

# 64. Accessibility Testing

Use:

- semantic HTML
- automated accessibility checks where useful
- keyboard testing
- screen-reader-aware markup
- real mobile interaction testing

Automated accessibility tools do not replace manual UX verification.

---

# 65. Responsive Testing

Minimum testing categories:

```text
small mobile
large mobile
tablet
desktop
```

Do not optimize around one iPhone resolution only.

---

# 66. Folder Architecture

Recommended starting structure:

```text
src/
├── app/
│
├── components/
│   ├── ui/
│   └── shared/
│
├── modules/
│   ├── trips/
│   ├── members/
│   ├── places/
│   ├── itinerary/
│   ├── bookings/
│   ├── checklist/
│   ├── expenses/
│   └── settlements/
│
├── domain/
│   └── finance/
│
├── db/
│   ├── schema/
│   └── migrations/
│
├── lib/
│
└── integrations/
    ├── maps/
    ├── currency/
    └── storage/
```

This is a starting point rather than a rigid framework.

---

# 67. Module Internal Structure

A complex module may evolve toward:

```text
expenses/
├── components/
├── schemas/
├── queries/
├── actions/
├── services/
└── types/
```

Do not create every folder before it contains useful code.

Prefer organic structure over empty architecture ceremony.

---

# 68. Shared UI Components

Reusable visual primitives belong in:

```text
components/ui/
```

Examples:

```text
Button
Input
Select
Dialog
Sheet
Card
Tabs
Badge
```

Product/domain components should remain closer to their module.

Example:

```text
modules/expenses/components/ExpenseCard
```

Do not place every component in a global components folder.

---

# 69. Design System Boundary

Tailwind provides styling utilities.

TripMate still requires a product design system defining:

```text
colors
typography
spacing
radius
elevation
states
touch targets
responsive behavior
```

This will be defined in `DESIGN_SYSTEM.md`.

Avoid arbitrary styling values throughout feature code.

---

# 70. API and Native Readiness

Future native app:

```text
Native UI
    ↓
REST API
    ↓
Application Services
    ↓
Domain
    ↓
PostgreSQL
```

Native should not reproduce:

```text
expense calculations
settlement algorithms
authorization rules
```

The server remains authoritative.

Some pure shared TypeScript domain code could potentially be packaged later, but correctness must not depend on clients running it.

---

# 71. API Authentication for Native

Web authentication may initially use cookie-based sessions.

Future native API authentication may use an appropriate token/session mechanism.

Therefore domain/application services must not assume HTTP cookies directly.

Transport layer resolves:

```text
request
→ authenticated user
```

Application layer receives:

```text
userId
```

---

# 72. Deployment Architecture

Initial deployment can remain simple.

Conceptually:

```text
CDN / Edge
     ↓
Next.js Application
     ↓
Managed PostgreSQL
```

Optional later services:

```text
Object Storage
Email Provider
Maps Provider
Exchange Rate Provider
Job Queue
```

Prefer managed infrastructure for a small product team.

---

# 73. Environment Separation

At minimum:

```text
Development
Test
Production
```

Potential staging environment later.

Never run automated tests against production data.

Database migrations should be version-controlled.

---

# 74. Database Migration Strategy

Use Drizzle migration tooling.

Rules:

- migrations committed to Git
- never manually modify production schema without migration
- review destructive migrations
- backups before risky production changes
- migrations should support safe deployment where possible

Do not casually edit old applied migrations.

Create new migrations.

---

# 75. Seed Strategy

Seed static reference data such as:

```text
currencies
```

Development seeds may create:

```text
sample users
Tokyo sample trip
sample places
sample itinerary
sample expenses
```

Production seed operations should remain controlled.

---

# 76. Local Development

Recommended local dependencies:

```text
Next.js
PostgreSQL
```

PostgreSQL can run through:

```text
Docker
```

This provides consistent developer setup.

Potential later:

```text
Docker Compose
```

for additional infrastructure if needed.

---

# 77. CI

Initial continuous integration should run:

```text
TypeScript check
Lint
Unit tests
Integration tests
Build
```

Potential:

```text
Playwright critical E2E
```

on pull requests or selected branches.

No change touching financial logic should merge with failing finance tests.

---

# 78. Code Quality Rules

Prefer:

```text
small explicit functions
typed boundaries
domain terminology
clear database transactions
tests for business rules
```

Avoid:

```text
giant service classes
generic abstraction layers
premature design patterns
business logic in UI
business logic hidden in SQL triggers
duplicated authorization
duplicated financial calculations
```

---

# 79. Performance Strategy

Do not optimize before measurement.

Initial priorities:

- correct indexes
- avoid N+1 queries
- server-side filtering
- reasonable payload sizes
- image optimization
- route-level loading
- mobile network awareness

Later optimize based on real production metrics.

---

# 80. Today Mode Performance

Today Mode deserves special performance attention.

Goal:

> Useful information appears quickly even on poor travel networks.

Prefer:

```text
small initial payload
cached essential data
minimal provider dependencies
progressive enhancement
```

Do not block today's itinerary because:

```text
weather API failed
maps API is slow
exchange-rate API unavailable
```

Core itinerary remains usable.

---

# 81. External Service Failure Principle

TripMate should degrade gracefully.

### Maps unavailable

Show address and itinerary.

### Exchange-rate API unavailable

Allow manual rate.

### Booking provider unavailable

Show stored booking reference.

### AI unavailable

Core planning remains unchanged.

### Network unavailable

Show cached essential trip information.

External services enhance TripMate.

They must not become unnecessary single points of failure.

---

# 82. AI Architecture — Future

When AI is introduced:

```text
User Intent
    ↓
AI Orchestration
    ↓
Structured Proposed Action
    ↓
Validation
    ↓
User Confirmation
    ↓
Application Service
```

Example:

```text
"Move teamLab to Thursday"
```

AI should not directly mutate the database.

Instead:

```text
AI proposes:
moveActivity(activityId, Thursday)

Domain validates

User confirms

Application executes
```

This preserves safety and predictability.

---

# 83. Receipt AI — Future

Potential flow:

```text
Receipt Image
    ↓
Extraction
    ↓
Structured Draft

Merchant
Amount
Currency
Date
Category
    ↓
User Reviews
    ↓
Create Expense
```

AI output remains untrusted input.

Normal expense validation still applies.

---

# 84. Architecture Decision Records

Important technical decisions should eventually be documented as lightweight ADRs.

Examples:

```text
ADR-001 PostgreSQL
ADR-002 Drizzle ORM
ADR-003 Modular Monolith
ADR-004 REST API Boundary
ADR-005 Financial Calculation Strategy
```

An ADR should explain:

```text
Context
Decision
Alternatives
Consequences
```

This prevents future agents/developers from repeatedly reopening settled decisions without context.

---

# 85. Architecture Anti-Patterns

Avoid these during MVP:

### Microservices

No operational justification yet.

### Event-driven everything

Unnecessary complexity.

### Global Redux-style store for all server data

Not required.

### Generic repository framework

Likely abstraction without value.

### Provider-specific domain model

Creates lock-in.

### Business rules inside React

Hard to test/reuse.

### Financial calculations in SQL/UI copies

Creates inconsistent results.

### Offline-first everything

High complexity before validation.

### AI-first architecture

Core product does not depend on AI.

---

# 86. MVP Technical Decisions

The following are now the recommended baseline:

```text
Framework
→ Next.js App Router

Language
→ TypeScript

Styling
→ Tailwind CSS

Database
→ PostgreSQL

ORM
→ Drizzle

Validation
→ Zod

Architecture
→ Modular Monolith

External API
→ REST JSON /api/v1

Web mutations
→ Server Actions where convenient,
   backed by application services

Financial logic
→ Pure domain module

Testing
→ Unit + PostgreSQL Integration + Playwright E2E

PWA
→ Progressive implementation

Offline
→ Essential read caching first

Native
→ Later client using shared backend/API
```

---

# 87. Decisions Intentionally Not Locked Yet

Do not choose these prematurely:

```text
Hosting provider

Managed PostgreSQL provider

Maps provider

Exchange-rate provider

Object storage provider

Email provider

Analytics provider

Monitoring provider

Native framework
```

Choose them when implementation reaches the relevant slice.

This avoids designing the product around vendors unnecessarily.

Authentication provider is no longer open: Better Auth (ROADMAP Decision Log D1).

---

# 88. Initial Request Flow

Example: create expense from web.

```text
Expense Form
     ↓
Server Action
     ↓
Zod Input Validation
     ↓
Authentication
     ↓
Trip Authorization
     ↓
Expense Application Service
     ↓
Finance Domain
     │
     ├── currency conversion
     ├── split calculation
     └── invariant validation
     ↓
Drizzle Transaction
     │
     ├── expenses
     └── expense_splits
     ↓
PostgreSQL
     ↓
Revalidate Expense UI
```

---

# 89. Future Native Request Flow

```text
Native Expense Screen
     ↓
POST /api/v1/trips/{tripId}/expenses
     ↓
API Authentication
     ↓
Zod
     ↓
Trip Authorization
     ↓
Same Expense Application Service
     ↓
Same Finance Domain
     ↓
Same Drizzle Transaction
     ↓
PostgreSQL
```

This is the central reason business logic must remain independent from Next.js UI mechanics.

---

# 90. System Architecture

```text
                    ┌────────────────────┐
                    │     Web / PWA      │
                    │ Next.js + React    │
                    └─────────┬──────────┘
                              │
                              │
                    ┌─────────▼──────────┐
                    │ Presentation Layer │
                    └─────────┬──────────┘
                              │
                  ┌───────────▼───────────┐
                  │  Application Services │
                  │                       │
                  │ Trips                 │
                  │ Places                │
                  │ Itinerary             │
                  │ Expenses              │
                  │ Settlements           │
                  └───────────┬───────────┘
                              │
                  ┌───────────▼───────────┐
                  │     Domain Layer      │
                  │                       │
                  │ Rules                 │
                  │ Money                 │
                  │ Splits                │
                  │ Balances              │
                  │ Authorization Rules   │
                  └───────────┬───────────┘
                              │
                  ┌───────────▼───────────┐
                  │ Infrastructure Layer  │
                  │                       │
                  │ Drizzle               │
                  │ PostgreSQL            │
                  │ Maps                  │
                  │ Currency Provider     │
                  │ Storage               │
                  └───────────────────────┘


                    FUTURE

                    ┌────────────────────┐
                    │   Native Mobile    │
                    └─────────┬──────────┘
                              │
                         REST API v1
                              │
                              ▼
                    Application Services
```

---

# 91. Definition of Architectural Success

The architecture is successful if:

### Product Development

A developer can implement features without touching unrelated modules.

### Financial Reliability

Financial rules have one authoritative implementation.

### Mobile Experience

The web application remains fast and usable during travel.

### Database Integrity

Invalid financial and membership states are difficult to create.

### Testing

Important domain behavior can be tested without rendering UI.

### Native Readiness

A future mobile client can reuse the backend without rewriting the product's business logic.

### Simplicity

The team can understand and operate the system without unnecessary infrastructure.

---

# 92. Implementation Order

Architecture should be introduced incrementally.

## Stage 1

```text
Next.js
TypeScript
Tailwind
PostgreSQL
Drizzle
Zod

Project structure
Environment validation
Testing foundation
```

## Stage 2

```text
Authentication
Users
Trips
Membership authorization
```

## Stage 3

```text
Places
Itinerary
```

## Stage 4

```text
Today Mode
Bookings
Checklist
```

## Stage 5

```text
Finance domain
Expenses
Splits
Balances
Settlements
```

## Stage 6

```text
PWA
Essential offline reads
Performance hardening
Accessibility
```

---

# 93. Next Artifact

The next product artifact is:

**DESIGN_SYSTEM.md**

It should translate TripMate's product principles into a visual and interaction system covering:

```text
Design personality
Color roles
Typography
Spacing
Radius
Surfaces
Buttons
Inputs
Cards
Navigation
Bottom navigation
Tabs
Timeline
Place cards
Expense UI
Status treatment
Mobile touch behavior
Desktop adaptation
Loading / empty / error states
Accessibility
Motion
Dark mode strategy
```

Document sequence:

```text
PROJECT_OVERVIEW.md
        ↓
USER_FLOWS.md
        ↓
FEATURES.md
        ↓
INFORMATION_ARCHITECTURE.md
        ↓
DATABASE.md
        ↓
ARCHITECTURE.md             ← Current
        ↓
DESIGN_SYSTEM.md
        ↓
ROADMAP.md
```