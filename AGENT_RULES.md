# TripMate — Agent Rules

## 1. Purpose

This document defines the operating rules for AI coding agents working on TripMate.

It applies to agents such as:

- Codex
- Claude Code
- Cursor agents
- other automated coding assistants

The purpose is to prevent:

- architecture drift
- duplicated business logic
- undocumented product changes
- unsafe financial implementations
- inconsistent UI
- unnecessary dependencies
- premature infrastructure
- agents silently redefining requirements

Agents must treat the repository documentation as part of the source of truth.

---

# 2. Product Context

TripMate is a:

> Mobile-first collaborative travel planning, trip-management, expense-sharing, and settlement application.

Core lifecycle:

```text
Dream
  ↓
Plan
  ↓
Collaborate
  ↓
Book
  ↓
Travel
  ↓
Track
  ↓
Settle
  ↓
Complete
```

Primary product statement:

> Plan together. Travel smoothly. Settle easily.

TripMate is:

```text
Web-first
Mobile-first
PWA-ready
Native-ready
Group-travel aware
Financially reliable
```

---

# 3. Read Documentation Before Coding

Before implementing a task, read the documents relevant to that task.

Core documentation:

```text
PROJECT_OVERVIEW.md
USER_FLOWS.md
FEATURES.md
INFORMATION_ARCHITECTURE.md
DATABASE.md
ARCHITECTURE.md
DESIGN_SYSTEM.md
ROADMAP.md
```

Also read:

```text
CURRENT_TASK.md
```

when present.

Do not make implementation decisions from the task prompt alone when repository documentation already defines the behavior.

---

# 4. Source-of-Truth Hierarchy

Different documents own different kinds of decisions.

## Product Intent

```text
PROJECT_OVERVIEW.md
```

Defines:

- product vision
- target users
- core principles
- MVP direction

## User Behavior

```text
USER_FLOWS.md
```

Defines:

- user journeys
- roles
- workflow transitions
- collaboration behavior

## Feature Requirements

```text
FEATURES.md
```

Defines:

- business rules
- feature scope
- priorities
- acceptance behavior
- invariants

## Navigation / Information Structure

```text
INFORMATION_ARCHITECTURE.md
```

Defines:

- screen ownership
- navigation
- route concepts
- information hierarchy

## Persistence

```text
DATABASE.md
```

Defines:

- relational model
- data integrity
- persistence semantics
- financial storage rules

## Technical Architecture

```text
ARCHITECTURE.md
```

Defines:

- application structure
- framework responsibilities
- domain boundaries
- API boundaries
- infrastructure strategy

## Visual / Interaction Rules

```text
DESIGN_SYSTEM.md
```

Defines:

- visual hierarchy
- component behavior
- responsive principles
- accessibility
- mobile interaction

## Delivery Sequence

```text
ROADMAP.md
```

Defines:

- milestones
- implementation order
- scope timing
- quality gates

---

# 5. Resolving Documentation Conflicts

Do not arbitrarily choose one document when two documents appear inconsistent.

First determine what kind of decision is involved.

Example:

```text
FEATURES.md
```

wins for feature/business behavior.

```text
DATABASE.md
```

wins for persistence strategy.

```text
DESIGN_SYSTEM.md
```

wins for established UI-system behavior.

```text
ROADMAP.md
```

wins for implementation timing.

If a genuine contradiction remains:

> Stop and report it before silently changing product behavior.

---

# 6. Current Locked Technical Baseline

Unless explicitly changed by the project owner:

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
→ Drizzle ORM

Validation
→ Zod

Authentication
→ Better Auth

Architecture
→ Modular Monolith

External Client API
→ REST-style JSON /api/v1

Web Mutations
→ Server Actions where appropriate,
   backed by application services

Testing
→ Unit + PostgreSQL Integration + Playwright E2E
```

Do not replace these technologies simply because another library is preferred by the agent.

---

# 7. Authentication Architecture

Authentication uses:

```text
Better Auth
```

Better Auth is responsible for authentication/session concerns.

TripMate owns its domain identity.

Conceptually:

```text
Better Auth Identity
      ↓
TripMate User
      ↓
users.id
```

Better Auth's user model is mapped onto TripMate's `users` table, so a Better Auth user ID is `users.id` (see `DATABASE.md` §10 and `ARCHITECTURE.md` §26).

Better Auth's own session, account, and verification tables reference `users.id`.

Business entities reference `users.id` only.

Do not reference Better Auth session/account/verification records, or spread provider-specific authentication IDs, throughout domain tables.

---

# 8. Authentication vs Authorization

Authentication:

```text
Who is this user?
```

Authorization:

```text
Can this user perform this action?
```

Better Auth does not replace TripMate authorization.

Every trip-scoped server operation must verify appropriate membership/permission.

---

# 9. Authorization Is Server-Side

Never rely on hidden UI as security.

Bad:

```text
Archive button hidden from MEMBER
therefore archive endpoint accepts request
```

Correct:

```text
UI hides unauthorized action

AND

server independently rejects unauthorized request
```

---

# 10. Trip Authorization

Trip-scoped operations should establish:

```text
Authenticated User
        ↓
Trip Membership
        ↓
Active Status
        ↓
Role / Permission
        ↓
Requested Entity Belongs to Same Trip
```

Centralize common authorization logic.

Examples:

```text
requireTripMember()
requireActiveTripMember()
requireTripOwner()
```

Do not recreate membership queries differently in every module.

---

# 11. Core Domain Modules

Initial domain boundaries:

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

Keep code close to its domain.

Do not create one giant:

```text
services/
```

directory containing unrelated business logic.

---

# 12. Architecture Rule

Business logic must not live primarily in:

- React components
- route handlers
- Server Actions
- database triggers

Preferred:

```text
Presentation
    ↓
Application Service
    ↓
Domain
    ↓
Infrastructure
```

Transport layers coordinate.

Domain/application layers decide behavior.

---

# 13. Server Actions

Server Actions may be used for convenient web mutations.

Example:

```text
createExpenseAction()
```

must delegate to something conceptually like:

```text
createExpense()
```

in the application/domain layer.

Do not make the Server Action itself the only implementation of the use case.

Future native/API clients must be able to reuse the same business behavior.

---

# 14. API Boundary

Future/external clients use:

```text
/api/v1
```

Do not require internal Server Components to call TripMate's own HTTP API when direct server-side application-service access is appropriate.

Avoid:

```text
Server Component
→ fetch localhost API
→ same application
```

without a concrete reason.

---

# 15. Server Components

Use React Server Components by default.

Introduce Client Components only when client-side interaction requires them.

Do not add:

```text
"use client"
```

to broad page trees for convenience.

Keep client boundaries small.

---

# 16. Database Rules

Use PostgreSQL intentionally.

Core data remains relational.

Do not move relational business structures into JSONB.

Good JSONB use:

```text
external provider metadata
```

Bad JSONB use:

```text
expense splits
trip members
itinerary activities
```

---

# 17. IDs

Business entities use UUID identifiers.

Do not switch to public sequential integer IDs without an explicit architectural decision.

---

# 18. Date and Time Rules

Actual instants:

```text
TIMESTAMPTZ
```

Calendar dates:

```text
DATE
```

Local itinerary scheduling:

```text
activity_date
+
local time
+
effective timezone semantics
```

Effective timezone:

```text
itinerary_activities.timezone ?? trips.timezone
```

`itinerary_activities.timezone` is a nullable IANA timezone for activities in a different zone from the trip (see `DATABASE.md` §7).

Today Mode uses each activity's effective timezone.

Do not automatically convert itinerary wall-clock times based on the viewer's device timezone.

Example:

```text
18:00 dinner in Tokyo
```

must remain:

```text
18:00 Tokyo
```

for the traveler.

---

# 19. Trip Lifecycle

Canonical lifecycle statuses:

```text
PLANNING
UPCOMING
TRAVELING
COMPLETED
```

Archiving is separate:

```text
archived_at
```

Do not introduce:

```text
ARCHIVED
```

as another lifecycle status without an explicit decision.

---

# 20. Invitations vs Membership

Invitation state belongs to:

```text
trip_invitations
```

A membership is created when the invitation is accepted.

Exception: an invitation that claims a placeholder member links the accepting user to that existing membership instead of creating a new one (see `DATABASE.md` §13, §15).

Do not create an `INVITED` membership merely to represent an outstanding invitation.

---

# 21. Membership History

Do not hard-delete membership simply because someone leaves or is removed.

Historical financial records may reference:

```text
trip_members.id
```

Former travelers must remain historically identifiable.

---

# 22. Saved Place vs Activity

These are distinct concepts.

```text
Saved Place
!=
Itinerary Activity
```

A place represents:

> Something we may want to visit.

An activity represents:

> Something scheduled or planned for a particular trip day.

Do not collapse them into one table/model.

---

# 23. Preference vs Participation

These are distinct concepts.

Place preference:

```text
INTERESTED
NOT_INTERESTED
NO_RESPONSE
```

Activity participation:

```text
GOING
NOT_GOING
UNDECIDED
```

Do not reuse one model for both.

---

# 24. Participation vs Financial Responsibility

Critical rule:

```text
Activity Participation
!=
Expense Participation
```

Never automatically add someone to an expense because they marked an activity as:

```text
GOING
```

Expense participants must be explicitly reviewed.

---

# 25. Financial Correctness Is Critical

Financial logic has higher integrity requirements than ordinary planning data.

Never use JavaScript floating-point arithmetic for authoritative money calculations.

Bad:

```text
0.1 + 0.2
```

Use the project's deterministic money/decimal strategy.

Database values use:

```text
NUMERIC
```

---

# 26. One Payer per Expense

MVP rule:

> One expense has exactly one payer.

Do not implement multiple payers unless the feature scope is explicitly changed.

Multiple payers are intentionally deferred.

---

# 27. Expense Participants

Expense participants are explicit.

The payer:

- may be a participant
- may not be a participant

Both are valid.

---

# 28. Expense Splits

Canonical split methods:

```text
EQUAL
EXACT
PERCENTAGE
```

Persist final calculated shares.

For every active expense:

```text
SUM(original shares)
=
original expense amount
```

and:

```text
SUM(base shares)
=
base expense amount
```

within the defined deterministic currency rounding policy.

---

# 29. Rounding

Rounding must be deterministic.

Example:

```text
¥10,000 / 3
```

must always produce a consistent result such as:

```text
¥3,334
¥3,333
¥3,333
```

with:

```text
SUM = ¥10,000
```

Never lose or create money through rounding.

The remainder rule (participant ordering by `trip_members.created_at`, then `id`) is defined in `FEATURES.md` §26.

Base-currency amount and base-share rounding are defined in `FEATURES.md` §27.

---

# 30. Multi-Currency

Every expense preserves:

```text
original amount
original currency
exchange rate used
base amount
base currency
```

Historical exchange rates must not silently change because today's market rate changed.

---

# 31. Financial Writes Are Atomic

Creating/editing an expense must be transactional.

Conceptually:

```text
BEGIN

expense
expense splits
validation

COMMIT
```

Failure:

```text
ROLLBACK
```

Never leave partially written financial state.

---

# 32. Expense Deletion

Financial records should not normally be physically deleted after they become meaningful.

Use the established void/cancellation strategy.

Example:

```text
voided_at
```

Do not casually hard-delete expenses.

---

# 33. Balances

Balances are derived from source financial records.

Do not introduce a mutable:

```text
balances
```

table during MVP.

Conceptually:

```text
balance
=
paid
-
personal share
+
settlements sent
-
settlements received
```

Positive:

```text
should receive
```

Negative:

```text
owes
```

---

# 34. Financial Invariant

For a trip:

```text
SUM(all member balances) = 0
```

within defined rounding rules.

This invariant must have automated tests.

---

# 35. Settlement Suggestions

Settlement suggestions are derived.

Do not persist suggested transfers before a user acts on them.

Persist actual settlement records.

The suggestion algorithm is a simple, deterministic greedy match (largest debtor to largest creditor) defined in `FEATURES.md` §31.

Do not describe or test it as producing the minimum number of transfers.

---

# 36. Settlement Currency

MVP should primarily settle in:

```text
trip base currency
```

Do not make cross-currency settlement UX complex unless explicitly required.

---

# 37. Financial Tests

Any work affecting:

```text
expenses
splits
currencies
balances
settlements
financial membership history
```

requires appropriate finance regression tests.

A build passing is not sufficient.

---

# 38. Property-Based Testing

Consider property-based testing for finance calculations.

Important invariants:

```text
sum splits = expense

sum balances = 0

settlement preserves total balance
```

Use generated edge cases where practical.

---

# 39. UI Design Direction

TripMate uses:

> **Warm modern utility**

The product should feel:

```text
Calm
Clear
Modern
Friendly
Practical
Travel-oriented
```

Avoid turning TripMate into a generic SaaS/admin dashboard.

---

# 40. Mobile First

Mobile-first means:

> Purpose-built mobile interaction.

It does not mean:

> Desktop UI squeezed into a smaller viewport.

Core mobile experiences:

```text
Today
Itinerary
Quick Expense
Bookings
```

must be intentionally designed for mobile.

---

# 41. Desktop Purpose

Desktop is primarily stronger for:

```text
planning
organizing
reviewing
```

Mobile is primarily stronger for:

```text
travel-time operation
quick updates
expense entry
```

Same data.

Different composition is allowed.

---

# 42. Today Mode

Today is not simply another itinerary page.

It answers:

> What do I need right now?

During travel prioritize:

```text
next activity
time
leave context
directions
booking/ticket
upcoming activities
quick expense
```

Route should remain stable even if lifecycle-specific content changes.

---

# 43. Mobile Navigation Baseline

Current baseline:

```text
Today
Plan
+
Expenses
Trip
```

Treat this as the implementation baseline.

Do not redesign navigation without evidence or explicit instruction.

---

# 44. Touch Targets

Aim for:

```text
44×44px minimum
```

Approximately:

```text
48px
```

is preferred for frequent travel actions.

---

# 45. Accessibility

Core UI must include:

```text
semantic HTML
keyboard access
visible focus
accessible names
form labels
sufficient contrast
non-color state communication
reduced-motion awareness
adequate touch targets
```

Accessibility is part of feature completion, not a later optional polish phase.

---

# 46. Component Ownership

Generic UI primitives:

```text
components/ui
```

Examples:

```text
Button
Input
Dialog
Sheet
```

Domain-specific components stay near their feature.

Example:

```text
modules/expenses/components/ExpenseSplitEditor
```

Do not move every reusable-looking component into global UI prematurely.

---

# 47. Dependency Rule

Before installing a dependency, ask:

1. Is the capability actually required?
2. Can the existing stack already solve it cleanly?
3. Is the library maintained?
4. Does it materially reduce complexity?
5. Does it create vendor or architectural coupling?

Do not install packages for trivial utilities.

---

# 48. No Premature Infrastructure

Do not introduce without a current requirement:

```text
Microservices
Message broker
Redis
Job queue
Realtime platform
GraphQL
Event sourcing
CQRS
Kubernetes
PostGIS
pgvector
```

These may become valid later.

They are not current defaults.

---

# 49. No Premature AI

Do not add:

```text
AI chatbot
AI itinerary generation
receipt AI
vector database
LLM integration
```

during core MVP work unless explicitly assigned.

The structured product must work without AI.

---

# 50. Maps Are an Integration

TripMate core planning must support manual place entry.

Do not make basic place creation depend entirely on a Maps provider.

Future provider access should go through an integration boundary.

---

# 51. External Service Resilience

External services enhance TripMate.

They should not unnecessarily block core use.

Examples:

```text
Maps unavailable
→ show stored address

Exchange API unavailable
→ allow manual rate

Booking provider unavailable
→ show stored reference
```

---

# 52. PWA Strategy

PWA support is progressive.

Priority:

```text
installability
offline awareness
essential read cache
```

Offline collaborative writes are deferred.

Do not introduce a complex synchronization engine during initial implementation.

---

# 53. Offline UX

Never pretend a server mutation succeeded when it did not.

When offline:

- show state clearly
- preserve useful cached information
- explain when data may be stale

Offline writes require explicit implementation rather than accidental browser behavior.

---

# 54. Performance

Optimize based on product importance.

Highest travel-time priority:

```text
Today Mode
```

Do not block Today on nonessential:

```text
weather
maps
AI
exchange-rate refresh
```

---

# 55. Error Handling

Use meaningful domain/application errors.

Examples:

```text
ValidationError
AuthenticationError
AuthorizationError
NotFoundError
ConflictError
FinancialInvariantError
```

Do not expose raw database errors directly to users.

---

# 56. Empty / Loading / Error States

A feature is incomplete if only its happy state is implemented.

Consider:

```text
empty
loading
error
offline
long content
small viewport
```

where relevant.

---

# 57. Database Migrations

Schema changes must use version-controlled migrations.

Do not:

- manually patch production schema
- rewrite already-applied migrations casually

Create a new migration for subsequent changes.

---

# 58. Database Query Rules

Avoid N+1 query patterns.

Avoid selecting unnecessary sensitive fields.

Prefer explicit queries matching use cases.

Do not create generic data-access abstractions that obscure important SQL behavior.

---

# 59. Security

Never commit:

```text
passwords
API secrets
database credentials
raw auth tokens
private keys
```

Never log:

```text
session secrets
invitation raw tokens
sensitive document contents
```

Use environment configuration.

---

# 60. Invitation Security

Invitation tokens must be:

```text
high entropy
revocable
expirable
```

Store hashes where practical.

Do not use predictable IDs as invitation secrets.

---

# 61. Testing Before Completion

Before declaring a task complete:

Run all tests relevant to the changed scope.

At minimum consider:

```text
TypeScript
Lint
Unit tests
Integration tests
Build
```

For user-critical flows:

```text
Playwright
```

If a test cannot be run, explicitly report that.

Never claim:

```text
all tests pass
```

without running them.

---

# 62. Do Not Fix Unrelated Code Silently

If unrelated problems are discovered:

1. note them
2. determine whether they block the task
3. fix only if necessary or explicitly authorized

Avoid broad opportunistic refactors.

Small necessary cleanup directly supporting the task is acceptable.

---

# 63. Preserve Existing Behavior

When modifying existing functionality:

- understand current behavior
- identify intended change
- preserve unrelated behavior
- add regression coverage

Do not rewrite entire modules simply because a different design is preferred.

---

# 64. Scope Discipline

Follow:

```text
CURRENT_TASK.md
```

for the active implementation scope.

Do not start future roadmap features because they are easy or interesting.

Example:

If implementing Trip Creation, do not also add:

```text
Maps
AI
advanced budgets
```

---

# 65. Vertical Slice Rule

Prefer complete user value.

Example:

```text
Create Trip

UI
Validation
Authorization
Application Service
Database
Error State
Tests
```

over:

```text
Create every trip-related table first
```

---

# 66. Definition of Done

A feature is complete when relevant requirements are satisfied across:

```text
UX
Responsive behavior
Server authorization
Validation
Domain behavior
Persistence
Loading
Empty
Error
Accessibility
Automated tests
```

Not every task requires every category.

But agents must evaluate all of them.

---

# 67. Financial Definition of Done

Financial work additionally requires:

```text
deterministic rounding
transaction safety
split invariants
balance invariants
currency correctness
regression tests
```

Financial correctness must not be traded for delivery speed.

---

# 68. Documentation Updates

Update documentation when implementation intentionally changes a documented decision.

Do not rewrite documentation simply to mirror code structure.

Docs explain:

```text
intent
rules
decisions
```

Code explains implementation details.

---

# 69. Significant Decision Changes

Do not silently change:

```text
PostgreSQL
Drizzle
Better Auth
REST boundary
one-payer expense model
trip lifecycle
financial rules
mobile navigation
```

If a change appears necessary:

> Report the reason and tradeoffs before implementing it.

---

# 70. Coding Style

Prefer:

```text
clear names
small functions
explicit types at boundaries
domain terminology
simple control flow
```

Avoid clever abstractions that make business rules difficult to follow.

---

# 70a. Naming Conventions

Enforced by ESLint and the Git pre-commit hook (ROADMAP D20):

- Files and directories under `src/` and `e2e/`: kebab-case. Next.js forms (`[id]`, `(group)`, `@slot`, `_private`) are allowed; `src/db/migrations/` is exempt.
- Variables and functions: camelCase. React components and types: PascalCase. Constants: UPPER_CASE.
- Parameters: camelCase or PascalCase (component-valued). Test files may also use UPPER_CASE parameters for env-var test tables.
- Destructured names and object properties are not enforced (they mirror DB columns, headers, and third-party shapes).
- `git commit --no-verify`, `HUSKY=0`, and changing `core.hooksPath` are owner-only. Do not bypass the hooks.

---

# 71. Comments

Comments should explain:

```text
why
```

when the reason is not obvious.

Avoid comments that merely repeat code.

Financial rounding rules and unusual timezone decisions deserve explanatory comments.

---

# 72. Type Safety

Avoid:

```text
any
```

unless unavoidable at an external boundary and safely narrowed immediately.

Use Zod or explicit narrowing for untrusted input.

---

# 73. Environment-Specific Code

Keep provider/environment concerns isolated.

Do not scatter:

```text
process.env.*
```

through domain modules.

Centralize validated configuration.

---

# 74. Implementation Reports

When completing a task, report:

```text
What changed

Key implementation decisions

Files changed

Validation/tests run

Any remaining risks

Any deferred work
```

Keep reports concise and factual.

---

# 75. Do Not Hide Failures

If:

```text
test fails
migration fails
build fails
requirement is ambiguous
documentation conflicts
```

report it.

Do not modify unrelated requirements merely to make tests green.

---

# 76. Ask When Necessary

Ask the project owner when a decision would:

- materially change product behavior
- alter a locked architecture decision
- introduce a major dependency
- create security/privacy consequences
- change financial semantics
- significantly increase scope

Do not ask for trivial implementation choices that can be made safely within established architecture.

---

# 77. Product Decision Heuristic

When choosing between two acceptable implementations, ask:

> Which option makes TripMate simpler to use during a real trip while preserving correctness?

Prefer that option.

---

# 78. Engineering Decision Heuristic

When choosing between two technically valid designs, prefer:

> The simplest design that preserves the established domain boundaries and can safely evolve later.

Avoid speculative extensibility.

---

# 79. Current Product Priority

The implementation priority remains:

```text
Trips
 ↓
Members
 ↓
Places
 ↓
Itinerary
 ↓
Today
 ↓
Expenses
 ↓
Balances
 ↓
Settlement
```

Secondary functionality must not destabilize this core path.

---

# 80. Final Rule

TripMate should become a usable product as early as possible.

Every implementation decision should support the cycle:

```text
Build
 ↓
Use
 ↓
Observe
 ↓
Learn
 ↓
Improve
```

Do not optimize the project for architectural sophistication at the expense of reaching a real trip.