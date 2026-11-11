# TripMate — Database Design

## 1. Purpose

This document defines the PostgreSQL data model for TripMate.

The database must support:

- solo and group trips
- collaborative planning
- saved places
- flexible itineraries
- bookings and checklists
- multi-currency expenses
- deterministic expense splitting
- balances and settlements
- former-member financial history
- mobile/PWA clients
- future native applications

The design favors:

**correctness → maintainability → extensibility → convenience**

---

# 2. Database Technology

Primary database:

```text
PostgreSQL
```

Potential future extensions:

```text
PostGIS
pgvector
```

Neither extension is required for the initial MVP.

PostGIS should be introduced when geographic queries become a concrete requirement.

pgvector should be introduced only when semantic/AI search requires it.

---

# 3. Core Modeling Principles

## 3.1 Relational First

Core business data belongs in relational tables.

Do not store core structures such as:

- trip members
- expense splits
- itinerary activities
- settlements

inside JSON.

---

## 3.2 JSONB Only for Flexible Metadata

`JSONB` is appropriate for information whose structure may legitimately vary.

Examples:

```text
external place provider metadata
future integration metadata
non-critical provider-specific attributes
```

Core business rules must not depend on opaque JSON structures.

---

## 3.3 UUID Primary Keys

Use UUID identifiers for primary business entities.

Conceptually:

```sql
id UUID PRIMARY KEY
```

Benefits include:

- difficult-to-guess public identifiers
- easier distributed creation later
- native-client friendliness
- avoiding sequential-ID exposure

Prefer modern UUID generation such as UUIDv7 when the chosen application/database tooling supports it reliably.

Do not make MVP dependent on UUIDv7 support.

---

# 4. ID Strategy

Recommended:

```text
Application-facing entities
→ UUID

Small static reference data
→ stable text code where appropriate
```

Example:

```text
trip.id → UUID
expense.id → UUID

currency.code → "JPY"
currency.code → "USD"
```

Avoid exposing database sequence IDs through public APIs.

---

# 5. Timestamp Strategy

Standard audit fields:

```text
created_at
updated_at
```

Use:

```text
TIMESTAMPTZ
```

for actual points in time.

Store timestamps in PostgreSQL using timezone-aware semantics.

Examples:

```text
account creation
invitation expiry
expense creation timestamp
settlement completion timestamp
```

---

# 6. Date-Only Strategy

Not every date should be a timestamp.

Use:

```text
DATE
```

for concepts that represent a calendar date rather than an instant.

Examples:

```text
trip.start_date
trip.end_date
itinerary_activity.activity_date
```

This prevents unnecessary timezone conversion bugs.

---

# 7. Local Travel Time Strategy

Scheduled travel activities have an important distinction.

Example:

```text
Dinner
2026-11-18
18:00
Asia/Tokyo
```

The user's intent is:

> Dinner is at 6 PM Tokyo time.

For itinerary activities, MVP should model local schedule semantics explicitly.

Recommended:

```text
activity_date DATE
start_time TIME
end_time TIME nullable
```

The trip provides:

```text
timezone
```

Example:

```text
Asia/Tokyo
```

An activity may override the trip timezone:

```text
itinerary_activities.timezone   VARCHAR nullable   (IANA, e.g. Asia/Seoul)
```

Effective timezone:

```text
effective_timezone = activity.timezone ?? trip.timezone
```

`start_time` / `end_time` are interpreted in the effective timezone.

Today Mode uses the effective timezone of each activity.

This prevents an itinerary item from unexpectedly becoming 16:00 because the user opened TripMate from another timezone.

Bookings representing externally fixed instants may additionally use timezone-aware timestamps when appropriate.

---

# 8. Money Strategy

Never use floating-point types for money.

Use:

```text
NUMERIC
```

Recommended application convention:

```text
NUMERIC(20, 6)
```

for stored monetary/exchange-rate values where flexibility is needed.

Currency metadata determines display/minor-unit behavior.

Examples:

```text
JPY → 0 decimal display
USD → 2
KWD → 3
```

Application logic must perform deterministic currency rounding.

---

# 9. Core Entity Map

High-level model:

```text
users
  │
  └── trip_members ───── trips
                           │
                           ├── trip_destinations
                           ├── trip_invitations
                           ├── saved_places
                           │     └── place_preferences
                           │
                           ├── itinerary_activities
                           │     └── activity_participants
                           │
                           ├── bookings
                           ├── checklist_groups
                           │     └── checklist_items
                           │
                           ├── expenses
                           │     └── expense_splits
                           │
                           └── settlements
```

---

# 10. Users

## Table: `users`

```text
id                  UUID PK
email               VARCHAR / CITEXT
display_name        VARCHAR
avatar_url          TEXT nullable
email_verified      BOOLEAN

created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

Authentication uses Better Auth (ROADMAP Decision Log D1).

Better Auth's user model is mapped onto this table:

```text
Better Auth id            → users.id (UUID)
Better Auth email         → users.email
Better Auth name          → users.display_name
Better Auth image         → users.avatar_url
Better Auth emailVerified → users.email_verified
```

Credentials, sessions, and verification tokens live in Better Auth's own `session`, `account`, and `verification` tables, which reference `users.id`.

Domain tables reference `users.id` only.

## Constraints

```text
email unique
email required where email identity is used
```

Case-insensitive email uniqueness should be enforced safely.

---

# 11. Trips

## Table: `trips`

```text
id                  UUID PK

name                VARCHAR
description         TEXT nullable

start_date          DATE
end_date            DATE

timezone            VARCHAR
base_currency_code  CHAR(3)

status_override     VARCHAR nullable / enum-like constraint

cover_url           TEXT nullable

created_by          UUID FK → users.id

archived_at         TIMESTAMPTZ nullable

created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

Supported status values:

```text
PLANNING
UPCOMING
TRAVELING
COMPLETED
```

## Constraints

```text
start_date <= end_date
```

## Important Note

Trip status is derived, not stored:

```text
derived status   = from start_date / end_date, evaluated against
                   the current date in trips.timezone

effective status = status_override ?? derived status
```

Derivation:

```text
current date > end_date                 → COMPLETED
start_date <= current date <= end_date  → TRAVELING
current date < start_date               → PLANNING or UPCOMING
```

The date rule separating PLANNING from UPCOMING is not yet defined (see ROADMAP Decision Log).

`status_override` is a nullable manual override. Clearing it returns the trip to its derived status.

Do not make trip behavior depend on the server's or viewer's local timezone.

---

# 12. Trip Destinations

A trip may eventually contain multiple destinations.

## Table: `trip_destinations`

```text
id                  UUID PK
trip_id             UUID FK → trips.id

name                VARCHAR
country_code        CHAR(2) nullable

timezone            VARCHAR nullable

latitude            NUMERIC nullable
longitude           NUMERIC nullable

sort_order          INTEGER

created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

MVP requires at least one primary destination.

Potential future field:

```text
is_primary
```

or primary destination may be determined by `sort_order = 0`.

---

# 13. Trip Memberships

## Table: `trip_members`

```text
id                  UUID PK

trip_id             UUID FK → trips.id
user_id             UUID FK → users.id nullable

display_name        VARCHAR nullable

role                VARCHAR
status              VARCHAR

joined_at           TIMESTAMPTZ nullable
left_at             TIMESTAMPTZ nullable

created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

Roles:

```text
OWNER
MEMBER
```

Statuses:

```text
ACTIVE
LEFT
REMOVED
```

Invitation state belongs primarily to invitations rather than active membership.

## Placeholder Members (MVP)

A placeholder member is a traveler without a TripMate account:

```text
user_id      = NULL
display_name = required
```

Rules:

- A placeholder can be payer or participant in expenses and settlements, like any member.
- A placeholder cannot be `OWNER`.
- A placeholder has no access to the trip; authorization applies only to members with a `user_id`.
- A placeholder is claimed through an invitation (see §15). Claiming sets `user_id` (and `joined_at`) on the existing row. The `trip_members.id` is unchanged, so financial history is unchanged.
- A claim is rejected if the claiming user is already a member of the trip.

For linked members, the UI displays `users.display_name`.

## Constraints

```text
UNIQUE(trip_id, user_id)

CHECK (user_id IS NOT NULL OR display_name IS NOT NULL)

CHECK (role <> 'OWNER' OR user_id IS NOT NULL)
```

PostgreSQL treats `NULL` values as distinct in unique constraints, so a trip may have several placeholders. `UNIQUE(trip_id, user_id)` also enforces the claim rejection rule at the database level.

## Critical Rule

Never hard-delete membership merely because someone leaves the trip.

Historical expenses may reference that membership.

---

# 14. Why Expenses Reference Trip Members

Financial entities should generally reference:

```text
trip_member_id
```

rather than only:

```text
user_id
```

because the financial identity exists within a specific trip.

Benefits:

- historical membership survives
- queries remain naturally trip-scoped
- users leaving a trip do not destroy financial history
- placeholder members (no linked user) can hold financial history that survives a later claim

---

# 15. Trip Invitations

## Table: `trip_invitations`

```text
id                  UUID PK
trip_id             UUID FK → trips.id

token_hash          TEXT
invited_by_member_id UUID FK → trip_members.id

email               VARCHAR nullable

placeholder_member_id UUID FK → trip_members.id nullable

status              VARCHAR

expires_at          TIMESTAMPTZ nullable
accepted_by_user_id UUID FK → users.id nullable
accepted_at         TIMESTAMPTZ nullable

revoked_at          TIMESTAMPTZ nullable

created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

Statuses:

```text
PENDING
ACCEPTED
DECLINED
REVOKED
EXPIRED
```

## Claim Invitations

When `placeholder_member_id` is set, accepting the invitation claims that placeholder:

```text
trip_members.user_id   = accepting user
trip_members.joined_at = now
```

No new membership is created.

The claim is rejected if:

- the accepting user is already a member of the trip
- the placeholder already has a `user_id`

The referenced placeholder must belong to the same trip as the invitation.

## Security

Store a secure hash of invitation tokens where practical rather than the raw bearer token.

Invitation tokens must be:

- cryptographically random
- difficult to guess
- revocable

---

# 16. Currencies

## Table: `currencies`

Reference table.

```text
code                CHAR(3) PK
name                VARCHAR
symbol              VARCHAR nullable
minor_units         SMALLINT
active              BOOLEAN
```

Examples:

```text
JPY | Japanese Yen | ¥ | 0
USD | US Dollar    | $ | 2
EUR | Euro         | € | 2
```

Use ISO 4217 codes where applicable.

---

# 17. Saved Places

## Table: `saved_places`

```text
id                  UUID PK
trip_id             UUID FK → trips.id

name                VARCHAR
category            VARCHAR
priority            VARCHAR

address             TEXT nullable

latitude            NUMERIC nullable
longitude           NUMERIC nullable

estimated_cost      NUMERIC(20,6) nullable
currency_code       CHAR(3) nullable

notes               TEXT nullable

external_provider   VARCHAR nullable
external_place_id   VARCHAR nullable
external_url        TEXT nullable
external_metadata   JSONB nullable

created_by_member_id UUID FK → trip_members.id

archived_at         TIMESTAMPTZ nullable

created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

Priorities:

```text
MUST_GO
INTERESTED
OPTIONAL
```

Initial categories:

```text
ATTRACTION
FOOD
CAFE
ACTIVITY
SHOPPING
NIGHTLIFE
ACCOMMODATION
TRANSPORTATION
SOUVENIR
OTHER
```

---

# 18. Geographic Coordinates

Before PostGIS, coordinates can use numeric columns.

Recommended conceptual precision:

```text
latitude  NUMERIC(9,6)
longitude NUMERIC(9,6)
```

Constraints:

```text
latitude between -90 and 90
longitude between -180 and 180
```

If nearby/distance queries become important, migrate/add a PostGIS geography column.

Do not implement manual geographic-distance logic throughout the application.

---

# 19. External Place Uniqueness

Do not globally require:

```text
UNIQUE(external_provider, external_place_id)
```

because the same place may legitimately be saved in many trips.

Potential trip-scoped duplicate detection:

```text
trip_id
external_provider
external_place_id
```

may be used to warn users.

It should not necessarily block intentional duplicates during MVP.

---

# 20. Place Preferences

## Table: `place_preferences`

```text
id                  UUID PK

saved_place_id      UUID FK → saved_places.id
trip_member_id      UUID FK → trip_members.id

preference          VARCHAR

created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

Values:

```text
INTERESTED
NOT_INTERESTED
```

No row can represent `NO_RESPONSE`.

## Constraint

```text
UNIQUE(saved_place_id, trip_member_id)
```

This is preferable to storing an explicit `NO_RESPONSE` record.

---

# 21. Activity Suggestions

P1 feature.

## Table: `activity_suggestions`

```text
id                  UUID PK
trip_id             UUID FK → trips.id

saved_place_id      UUID FK → saved_places.id nullable

title               VARCHAR
suggested_date      DATE nullable
suggested_time      TIME nullable
notes               TEXT nullable

suggested_by_member_id UUID FK → trip_members.id

status              VARCHAR

accepted_activity_id UUID FK → itinerary_activities.id nullable

created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

Statuses:

```text
PENDING
ACCEPTED
DISMISSED
```

---

# 22. Itinerary Activities

## Table: `itinerary_activities`

```text
id                  UUID PK
trip_id             UUID FK → trips.id

saved_place_id      UUID FK → saved_places.id nullable

title               VARCHAR
description         TEXT nullable

activity_date       DATE
start_time          TIME nullable
end_time            TIME nullable
timezone            VARCHAR nullable

sort_order          INTEGER

estimated_cost      NUMERIC(20,6) nullable
currency_code       CHAR(3) nullable

status              VARCHAR

notes               TEXT nullable

created_by_member_id UUID FK → trip_members.id

created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

Statuses:

```text
PLANNED
COMPLETED
SKIPPED
CANCELLED
```

## Important Rule

`saved_place_id` is optional.

Examples that may have no place:

```text
Rest at hotel
Free time
Meet friend
Travel to airport
```

## Timezone

`timezone` is a nullable IANA timezone.

Effective timezone = `timezone ?? trips.timezone` (see §7).

## Itinerary Days

Itinerary days are derived from the trip date range (`trips.start_date` … `trips.end_date`).

There is no itinerary-day table. An activity belongs to a day through `activity_date`.

---

# 23. Activity Date Constraints

Normally:

```text
trip.start_date <= activity_date <= trip.end_date
```

Cross-table CHECK constraints are not straightforward in PostgreSQL.

Enforce through:

- application/domain validation
- tests

Potential database triggers should only be introduced if justified.

---

# 24. Activity Ordering

Do not rely exclusively on `start_time`.

Some activities are unscheduled.

Use:

```text
sort_order
```

within each day.

Presentation can generally order by:

```text
activity_date
sort_order
start_time
```

Application logic should keep ordering deterministic.

---

# 25. Activity Participants

## Table: `activity_participants`

```text
id                  UUID PK

activity_id         UUID FK → itinerary_activities.id
trip_member_id      UUID FK → trip_members.id

status              VARCHAR

created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

Statuses:

```text
GOING
NOT_GOING
UNDECIDED
```

## Constraint

```text
UNIQUE(activity_id, trip_member_id)
```

## Critical Rule

These records must not automatically become expense splits.

---

# 26. Bookings

## Table: `bookings`

```text
id                  UUID PK
trip_id             UUID FK → trips.id

activity_id         UUID FK → itinerary_activities.id nullable

type                VARCHAR
title               VARCHAR

provider            VARCHAR nullable
reference_number    VARCHAR nullable

status              VARCHAR

start_at            TIMESTAMPTZ nullable
end_at              TIMESTAMPTZ nullable

local_date          DATE nullable
local_time          TIME nullable
timezone            VARCHAR nullable

booking_url         TEXT nullable
notes               TEXT nullable

created_by_member_id UUID FK → trip_members.id

created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

Types:

```text
FLIGHT
ACCOMMODATION
TRAIN
ACTIVITY
RESTAURANT
TRANSPORTATION
OTHER
```

Statuses:

```text
NEED_TO_BOOK
BOOKED
CANCELLED
```

## Why Both Timestamp and Local Fields?

Not every reservation provider expresses travel time identically.

For externally fixed events such as flights, timezone-aware timestamps are useful.

For local reservations, local date/time/timezone may better preserve displayed intent.

Application-level booking types should define which representation is required.

Avoid populating conflicting representations without clear rules.

---

# 27. Checklist Groups

## Table: `checklist_groups`

```text
id                  UUID PK
trip_id             UUID FK → trips.id

name                VARCHAR
sort_order          INTEGER

created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

Examples:

```text
Before Travel
Packing
Bookings
```

---

# 28. Checklist Items

## Table: `checklist_items`

```text
id                  UUID PK
trip_id             UUID FK → trips.id
group_id            UUID FK → checklist_groups.id nullable

title               VARCHAR

scope               VARCHAR

created_by_member_id UUID FK → trip_members.id
assigned_member_id  UUID FK → trip_members.id nullable

completed_at        TIMESTAMPTZ nullable
completed_by_member_id UUID FK → trip_members.id nullable

sort_order          INTEGER

created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

Scopes:

```text
SHARED
PERSONAL
```

For personal items, ownership/privacy semantics must be enforced at application authorization level.

---

# 29. Expenses

## Table: `expenses`

```text
id                  UUID PK
trip_id             UUID FK → trips.id

description         VARCHAR
category            VARCHAR

expense_date        DATE
expense_time        TIME nullable

payer_member_id     UUID FK → trip_members.id

original_amount     NUMERIC(20,6)
original_currency_code CHAR(3)

exchange_rate       NUMERIC(24,12)

base_amount         NUMERIC(20,6)
base_currency_code  CHAR(3)

split_method        VARCHAR

notes               TEXT nullable

created_by_member_id UUID FK → trip_members.id

voided_at           TIMESTAMPTZ nullable
voided_by_member_id UUID FK → trip_members.id nullable

created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

Categories:

```text
ACCOMMODATION
FOOD
TRANSPORTATION
ACTIVITY
SHOPPING
FLIGHT
FEE
OTHER
```

Split methods:

```text
EQUAL
EXACT
PERCENTAGE
```

---

# 30. Why Store Base Currency Code on Expense?

The trip already has a base currency.

However, storing:

```text
base_currency_code
```

on the expense provides historical protection.

If a trip's base currency were ever changed later, historical expense calculations should not silently reinterpret previous data.

This is deliberate denormalization for financial integrity.

---

# 31. Exchange Rate Definition

Define exchange rate consistently as:

```text
1 original_currency
=
exchange_rate × base_currency
```

Therefore:

```text
base_amount
=
original_amount × exchange_rate
```

Example:

```text
original_amount = 100 USD
exchange_rate   = 150
base_amount     = 15,000 JPY
```

`base_amount` is rounded `ROUND_HALF_UP` to the base currency's minor units.

When:

```text
original_currency = base_currency
```

use:

```text
exchange_rate = 1
base_amount = original_amount
```

---

# 32. Expense Splits

Use one canonical split table.

## Table: `expense_splits`

```text
id                  UUID PK

expense_id          UUID FK → expenses.id
trip_member_id      UUID FK → trip_members.id

share_original_amount NUMERIC(20,6)
share_base_amount   NUMERIC(20,6)

percentage          NUMERIC(9,6) nullable

created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

## Constraint

```text
UNIQUE(expense_id, trip_member_id)
```

Each row represents one member's financial obligation for that expense.

---

# 33. Why Persist Calculated Split Amounts?

Even for equal or percentage splits, persist the final amounts.

Example:

```text
¥10,000 / 3
```

might produce:

```text
¥3,334
¥3,333
¥3,333
```

Persisting those values provides:

- deterministic historical results
- clear auditability
- simpler balance queries
- protection from future rounding-rule changes

`split_method` explains how they were generated.

`expense_splits` stores the financial result.

---

# 34. Expense Split Invariants

For every active expense:

```text
SUM(share_original_amount)
=
expense.original_amount
```

and:

```text
SUM(share_base_amount)
=
expense.base_amount
```

subject to the defined currency rounding rules.

Rounding rules (defined in `FEATURES.md` §26–27):

```text
share_original_amount
→ EQUAL / PERCENTAGE: rounded down to original currency minor units,
  remainder distributed one minor unit each in participant order
  (trip_members.created_at ASC, then trip_members.id ASC)

share_base_amount
→ base_amount × share_original_amount / original_amount,
  rounded down to base currency minor units,
  remainder distributed by the same participant order
```

Both sums are exact; no tolerance is needed.

For percentage split:

```text
SUM(percentage) = 100
```

These multi-row constraints cannot be handled by ordinary CHECK constraints alone.

They must be enforced transactionally in domain/application logic and tested thoroughly.

---

# 35. Payer Does Not Need to Be Participant

Valid example:

```text
Phyo pays ¥10,000

Expense belongs to:
Su
Aung
```

Therefore:

```text
payer_member_id
```

does not imply an `expense_splits` row for that member.

This is intentional.

---

# 36. Expense Write Transaction

Creating or editing an expense must be atomic.

Conceptually:

```text
BEGIN

Create/update expense
Create/update splits
Validate totals
Validate membership
Calculate base values

COMMIT
```

If validation fails:

```text
ROLLBACK
```

Never allow partially written financial state.

---

# 37. Expense Deletion Strategy

Do not immediately hard-delete financial records.

Use:

```text
voided_at
voided_by_member_id
```

A voided expense:

- remains historically identifiable
- does not affect active balances
- can potentially be restored later

This is safer than physical deletion.

---

# 38. Settlements

## Table: `settlements`

```text
id                  UUID PK
trip_id             UUID FK → trips.id

from_member_id      UUID FK → trip_members.id
to_member_id        UUID FK → trip_members.id

amount              NUMERIC(20,6)
currency_code       CHAR(3)

base_amount         NUMERIC(20,6)
exchange_rate       NUMERIC(24,12)

status              VARCHAR

settled_at          TIMESTAMPTZ nullable

created_by_member_id UUID FK → trip_members.id

voided_at           TIMESTAMPTZ nullable

created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

Statuses:

```text
PENDING
COMPLETED
```

## Constraints

```text
amount > 0

from_member_id != to_member_id
```

---

# 39. Settlement Currency

For MVP, strongly prefer settlement in the trip base currency.

Example:

```text
Trip base = JPY
Settlement = JPY
```

The schema may retain currency/exchange-rate fields for future flexibility.

The initial UI does not need to encourage cross-currency settlements.

This significantly simplifies user understanding.

---

# 40. Balance Calculation

Balances should initially be calculated from source financial records rather than stored as mutable totals.

For each member:

```text
balance
=
payments made
-
expense shares
+
settlement effects
```

Expense contribution:

```text
payer
→ + expense.base_amount

participant
→ - expense_splits.share_base_amount
```

Completed settlement:

```text
sender
→ + settlement.base_amount

receiver
→ - settlement.base_amount
```

Interpretation:

```text
positive = should receive
negative = owes
zero     = settled
```

---

# 41. Example Balance

Dinner:

```text
¥12,000
Paid by Phyo

Phyo ¥3,000
Su   ¥3,000
Aung ¥3,000
Min  ¥3,000
```

Effects:

```text
Phyo:
+12,000 paid
- 3,000 share
= +9,000

Su:
-3,000

Aung:
-3,000

Min:
-3,000
```

Invariant:

```text
+9,000 -3,000 -3,000 -3,000 = 0
```

---

# 42. Settlement Effect Example

Before:

```text
Phyo +9,000
Su   -3,000
Aung -3,000
Min  -3,000
```

Su pays Phyo ¥3,000.

Completed settlement effects:

```text
Su   +3,000
Phyo -3,000
```

After:

```text
Phyo +6,000
Su        0
Aung -3,000
Min  -3,000
```

---

# 43. Balance Invariant

For a trip:

```text
SUM(all active member balances) = 0
```

within defined currency rounding rules.

This should have automated tests covering:

- equal splits
- exact splits
- percentages
- rounding
- edited expenses
- voided expenses
- completed settlements
- voided settlements
- former members

---

# 44. Settlement Suggestions

Suggested settlement transfers do not need to be persisted immediately.

They can be calculated from current balances.

Example algorithm input:

```text
Phyo +8,000
Su   -5,000
Aung -3,000
```

Output:

```text
Su   → Phyo 5,000
Aung → Phyo 3,000
```

Algorithm: simple, deterministic greedy matching of the largest debtor to the largest creditor, ties broken by participant order (`trip_members.created_at`, then `id`). It does not guarantee the minimum number of transfers. Defined in `FEATURES.md` §31.

Persist a `settlement` only when the user chooses to record/track that transfer.

This avoids stale suggestion records after expense changes.

---

# 45. Former Members and Finance

A removed/left member may still appear in:

```text
expenses
expense_splits
settlements
```

Never cascade-delete financial records when membership status changes.

Example:

```text
Su LEFT trip
```

Historical UI may show:

```text
Su
Former member
```

but all balances remain valid.

---

# 46. Foreign Key Delete Strategy

Use destructive cascades carefully.

Potential safe cascade:

```text
place_preferences
→ saved_place deleted
```

Potentially dangerous cascade:

```text
trip_member
→ expenses
```

must NOT happen.

For financial entities, prefer:

```text
RESTRICT
```

or application-managed lifecycle states.

---

# 47. Soft Deletion Strategy

Not every table needs `deleted_at`.

Use lifecycle-specific fields where semantics matter.

Examples:

```text
trips.archived_at

expenses.voided_at

settlements.voided_at

trip_members.status
trip_members.left_at

itinerary_activities.status
```

This is clearer than applying generic soft deletion indiscriminately.

---

# 48. Optimistic Concurrency

Group members may edit shared information concurrently.

P1 recommendation:

Add either:

```text
version INTEGER
```

or use:

```text
updated_at
```

for optimistic concurrency checks on highly editable entities.

Candidates:

```text
itinerary_activities
expenses
saved_places
```

Financial edits deserve stronger conflict handling than ordinary notes.

---

# 49. Trip-Scoped Authorization

Every request involving trip data must establish:

```text
authenticated user
    ↓
active trip membership
    ↓
role / permission
    ↓
entity belongs to same trip
```

Never rely solely on knowing an entity UUID.

Example:

A user must not access:

```text
GET /expenses/{uuid}
```

unless the expense belongs to a trip they are authorized to access.

---

# 50. Cross-Trip Integrity

A subtle but critical rule:

An entity referenced by another trip-scoped entity must belong to the same trip.

Example invalid state:

```text
Expense.trip_id = Trip A

payer_member_id
→ member of Trip B
```

Simple foreign keys do not automatically prevent every cross-trip mismatch.

Application/domain validation must enforce this consistently.

For especially critical financial relationships, composite database constraints may be considered.

---

# 51. Composite Integrity Option

For stronger database enforcement, selected tables can expose composite uniqueness:

```text
trip_members
UNIQUE(trip_id, id)
```

and financial tables may reference:

```text
(trip_id, payer_member_id)
```

to guarantee payer membership belongs to the same trip.

This increases schema verbosity but strengthens financial integrity.

Recommendation:

Use stronger composite integrity for core financial relationships where ORM/tooling supports it cleanly.

---

# 52. Index Strategy

Indexes should follow real access patterns.

Do not index every column.

Initial important indexes:

## Trips

```text
trip_members(user_id, status)
trips(start_date, end_date)
```

## Places

```text
saved_places(trip_id)
saved_places(trip_id, category)
saved_places(trip_id, priority)
```

## Itinerary

```text
itinerary_activities(trip_id, activity_date)
itinerary_activities(trip_id, activity_date, sort_order)
```

## Bookings

```text
bookings(trip_id, start_at)
```

## Expenses

```text
expenses(trip_id, expense_date)
expenses(trip_id, payer_member_id)
expense_splits(expense_id)
expense_splits(trip_member_id)
```

## Settlements

```text
settlements(trip_id, status)
```

---

# 53. Partial Indexes

PostgreSQL partial indexes may be valuable.

Example active expenses:

```sql
CREATE INDEX ...
ON expenses (trip_id, expense_date)
WHERE voided_at IS NULL;
```

Similarly:

```text
active settlements
non-archived trips
```

Use them when query patterns justify them.

---

# 54. Unique Constraints

Important uniqueness examples:

```text
users.email

trip_members(trip_id, user_id)   (placeholders have NULL user_id)

place_preferences(saved_place_id, trip_member_id)

activity_participants(activity_id, trip_member_id)

expense_splits(expense_id, trip_member_id)
```

Uniqueness should express domain rules, not merely optimize queries.

---

# 55. CHECK Constraints

Use database CHECK constraints for local invariants.

Examples:

```text
trips.start_date <= trips.end_date

saved_places.latitude between -90 and 90

saved_places.longitude between -180 and 180

expenses.original_amount > 0

expenses.exchange_rate > 0

expenses.base_amount > 0

settlements.amount > 0

settlements.from_member_id != settlements.to_member_id
```

Do not duplicate complicated business workflows inside giant SQL constraints.

---

# 56. Enum Strategy

Two reasonable PostgreSQL options exist:

```text
native PostgreSQL ENUM
```

or:

```text
VARCHAR + CHECK constraint
```

For TripMate's early product stage, prefer:

```text
VARCHAR/TEXT + CHECK
```

or ORM-supported string enums.

Reason:

Product statuses/categories are likely to evolve during real-trip validation.

Native database ENUM migrations can become unnecessarily rigid.

Stable reference data may later become lookup tables where useful.

---

# 57. Category Strategy

Do not create a database table for every small category during MVP.

Initial categories can use constrained codes.

Example:

```text
FOOD
CAFE
SHOPPING
```

If user-defined categories become a real requirement, normalize them later.

Avoid premature abstraction.

---

# 58. Audit Fields

Most mutable business tables should contain:

```text
created_at
updated_at
```

Where authorship matters:

```text
created_by_member_id
```

Where lifecycle events matter:

```text
completed_at
voided_at
joined_at
left_at
```

Do not add dozens of generic audit columns without product value.

---

# 59. Database-Level Generated Values

Use database defaults for values such as:

```text
created_at
```

where practical.

Business calculations such as expense splits should remain explicit domain logic.

Avoid hiding important financial calculations inside opaque database triggers.

---

# 60. Trigger Philosophy

Use PostgreSQL triggers sparingly.

Good potential uses:

```text
updated_at maintenance
```

Possible later use:

```text
specialized audit history
```

Avoid implementing core expense calculation or settlement algorithms primarily through triggers.

Those rules need:

- clear application tests
- portability
- understandable debugging
- reuse by future API/native clients

---

# 61. Transactions

Database transactions are mandatory for multi-record operations.

Examples:

### Create Expense

```text
expense
+
expense_splits
```

### Edit Expense

```text
expense
+
replace/recalculate splits
+
validate
```

### Accept Invitation

```text
invitation status
+
trip membership (create, or claim placeholder)
```

### Record Settlement

```text
settlement
+
status
```

where applicable.

---

# 62. Isolation and Concurrent Edits

Default PostgreSQL transaction behavior may be sufficient for most planning operations.

Financial operations must also protect against lost updates.

Example:

```text
User A opens expense
User B edits expense
User A submits old version
```

The application should detect stale edits rather than silently overwriting important financial changes.

Optimistic locking is recommended.

---

# 63. Derived Data

Avoid persisting values that can cheaply and reliably be calculated unless historical stability or performance requires persistence.

Calculate:

```text
current member balances
settlement suggestions
trip duration
```

Persist:

```text
expense split amounts
historical exchange rate
base amount
```

because these form part of the historical financial record.

---

# 64. Caching and Summary Tables

Do not introduce balance summary tables in the initial MVP.

Start with source-of-truth queries.

If performance later becomes problematic, consider:

```text
materialized views
cached aggregates
summary tables
```

only after profiling.

Correctness is more important than premature optimization.

---

# 65. Place Provider Metadata

Example `external_metadata`:

```json
{
  "rating": 4.6,
  "price_level": 2,
  "provider_categories": ["museum", "tourist_attraction"]
}
```

This data is informational.

TripMate's own category and priority remain first-class relational fields.

Provider metadata should not become the application's primary data model.

---

# 66. Future PostGIS Migration

When geographic capabilities become important:

Current:

```text
latitude
longitude
```

Future:

```text
location GEOGRAPHY(Point, 4326)
```

Then capabilities may include:

```text
places within 2 km
distance from hotel
nearby saved restaurants
geographic clustering
```

Latitude/longitude may remain for convenience or be derived from geography depending on final implementation.

---

# 67. Future pgvector Usage

Potential future semantic data:

```text
place descriptions
travel preferences
trip notes
recommendation embeddings
```

Possible table:

```text
semantic_documents
```

Do not add embedding columns to core tables during MVP without a concrete feature.

---

# 68. Future Attachments

Potential table:

```text
attachments
```

Conceptually:

```text
id
trip_id
uploaded_by_member_id

entity_type
entity_id

storage_key
file_name
content_type
size

created_at
```

Before implementation, define a secure polymorphic-reference strategy or separate relation tables.

Do not introduce an unconstrained `entity_type/entity_id` pattern casually because the database cannot enforce normal foreign keys across arbitrary entity types.

---

# 69. Data Retention

MVP should preserve completed trip history.

Archiving a trip should not immediately delete:

```text
itinerary
places
expenses
settlements
bookings
```

Future account-deletion/privacy requirements must define appropriate retention and anonymization behavior.

---

# 70. Sensitive Data

Avoid storing unnecessary sensitive information.

Do not require:

```text
passport number
passport scan
bank details
payment card details
```

for MVP.

Booking references may themselves be sensitive and must remain protected by trip authorization.

---

# 71. Initial ERD

```text
USERS
  │
  │
  └────< TRIP_MEMBERS >──── TRIPS
              │               │
              │               ├────< TRIP_DESTINATIONS
              │               │
              │               ├────< TRIP_INVITATIONS
              │               │
              │               ├────< SAVED_PLACES
              │               │          │
              │               │          └────< PLACE_PREFERENCES
              │               │
              │               ├────< ITINERARY_ACTIVITIES
              │               │          │
              │               │          └────< ACTIVITY_PARTICIPANTS
              │               │
              │               ├────< BOOKINGS
              │               │
              │               ├────< CHECKLIST_GROUPS
              │               │          │
              │               │          └────< CHECKLIST_ITEMS
              │               │
              │               ├────< EXPENSES
              │               │          │
              │               │          └────< EXPENSE_SPLITS
              │               │
              │               └────< SETTLEMENTS
              │
              ├── created places
              ├── activity participation
              ├── expense payer
              ├── expense shares
              └── settlements
```

---

# 72. Financial ERD

```text
TRIP
 │
 ├──── TRIP_MEMBER ───────────────────┐
 │          │                         │
 │          │ payer                   │ participant
 │          ↓                         ↓
 │       EXPENSE ─────────────── EXPENSE_SPLIT
 │          │
 │          │
 │          └── original currency
 │          └── exchange rate
 │          └── base amount
 │
 └──── SETTLEMENT
        │         │
        ↓         ↓
      FROM       TO
      MEMBER     MEMBER
```

---

# 73. Expense Example

Trip:

```text
Tokyo Trip
Base Currency = JPY
```

Members:

```text
Phyo
Su
Aung
Min
```

Expense:

```text
Dinner

Original:
120 USD

Rate:
1 USD = 150 JPY

Base:
18,000 JPY

Paid by:
Phyo
```

Splits:

```text
Phyo  30 USD → 4,500 JPY
Su    30 USD → 4,500 JPY
Aung  30 USD → 4,500 JPY
Min   30 USD → 4,500 JPY
```

Financial effect:

```text
Phyo:
+18,000 - 4,500
= +13,500

Su:
-4,500

Aung:
-4,500

Min:
-4,500
```

Total:

```text
0
```

---

# 74. Recommended Schema Build Order

Database migrations should follow dependency order.

## Foundation

```text
users
currencies
trips
trip_destinations
trip_members
trip_invitations
```

## Planning

```text
saved_places
place_preferences
itinerary_activities
activity_suggestions
activity_participants
```

`itinerary_activities` precedes `activity_suggestions` because `activity_suggestions.accepted_activity_id` references it.

## Operations

```text
bookings
checklist_groups
checklist_items
```

## Finance

```text
expenses
expense_splits
settlements
```

Do not create all tables merely because they appear in this document.

Implement them as their vertical product slice is built.

---

# 75. Testing Requirements

Database/domain tests must cover constraints and critical business behavior.

## Trip Tests

```text
start date after end date rejected
duplicate membership rejected
last owner cannot disappear
```

## Expense Tests

```text
amount must be positive

equal split

exact split

percentage split

JPY rounding

USD rounding

remainder distribution

payer not participant

single participant

former member remains in history

editing expense recalculates balance

voiding expense recalculates balance
```

## Settlement Tests

```text
sender != receiver

positive amount

completed settlement changes balance

voided settlement reverses effect
```

## Invariant Test

For every generated financial scenario:

```text
SUM(member balances) = 0
```

Property-based testing should be considered for the financial engine.

---

# 76. Database Decisions Locked for MVP

Unless implementation reveals a strong reason to change them:

1. PostgreSQL is the primary database.
2. Core business data is relational.
3. UUIDs identify primary business entities.
4. Actual instants use `TIMESTAMPTZ`.
5. Calendar concepts use `DATE`.
6. Local itinerary schedules use date + local time semantics.
7. Money uses `NUMERIC`, never floating point.
8. Currency codes follow ISO-style codes.
9. Every trip has a base currency.
10. Original expense currency is preserved.
11. Historical exchange rate is preserved.
12. Calculated expense split amounts are persisted.
13. One expense has one payer for MVP.
14. Payer does not need to be an expense participant.
15. Financial entities reference trip membership.
16. Former members remain in financial history.
17. Financial writes are transactional.
18. Expenses are voided rather than immediately hard-deleted.
19. Current balances are derived from financial source records.
20. Settlement suggestions are calculated rather than persisted until acted upon.
21. Settlement should normally use trip base currency in MVP.
22. PostGIS is deferred until geographic requirements justify it.
23. pgvector is deferred until AI/search requirements justify it.

---

# 77. Open Implementation Decisions

The following should be resolved in `ARCHITECTURE.md` rather than here:

```text
ORM / query builder
Authentication provider (resolved: Better Auth — ROADMAP Decision Log D1)
API style
Server/client boundaries
Validation library
Migration tooling
Repository/service structure
Caching
Background jobs
External maps provider
Exchange-rate provider
Object storage
Testing framework
Deployment platform
Observability
```

Database design should remain compatible with reasonable choices in these areas.

---

# 78. Next Artifact

The next document is:

**ARCHITECTURE.md**

It should define how the application is actually constructed around this data model.

Topics:

```text
Next.js architecture
Frontend/server boundaries
API strategy
PostgreSQL access
ORM decision
Authentication
Authorization
Domain modules
Financial calculation engine
Validation
Transactions
Caching
PWA strategy
Offline strategy
External integrations
Testing architecture
Security
Deployment
Observability
Native-ready API boundaries
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
DATABASE.md                    ← Current
        ↓
ARCHITECTURE.md
        ↓
DESIGN_SYSTEM.md
        ↓
ROADMAP.md
```