# TripMate — Feature Specification

## 1. Purpose

This document translates the product vision and user flows into implementable product requirements.

It defines:

- feature scope
- MVP priorities
- functional requirements
- business rules
- acceptance criteria
- important edge cases
- deferred functionality

This document should be used together with:

- `PROJECT_OVERVIEW.md`
- `USER_FLOWS.md`

---

# 2. Priority Definitions

## P0 — Core MVP

Required for the first real-trip validation.

If a P0 feature is missing or unreliable, the MVP should not be considered ready.

## P1 — MVP Enhancement

Important and desirable, but the first usable version can operate without the complete feature.

## P2 — Post-Validation

Useful after real-world usage validates the core workflow.

## Later

Explicitly deferred functionality.

---

# 3. MVP Feature Map

| Domain | Feature | Priority |
|---|---|---:|
| Authentication | Sign up / sign in | P0 |
| Trips | Create and manage trip | P0 |
| Trips | Trip lifecycle | P0 |
| Members | Invite travelers | P0 |
| Members | Member management | P0 |
| Places | Save places | P0 |
| Places | Categorization / priority | P0 |
| Collaboration | Member preferences | P1 |
| Collaboration | Suggestions | P1 |
| Itinerary | Day-by-day itinerary | P0 |
| Itinerary | Activity participation | P1 |
| Itinerary | Flexible schedule changes | P0 |
| Today | Today Mode | P0 |
| Bookings | Booking references | P1 |
| Checklist | Trip checklist | P1 |
| Expenses | Expense entry | P0 |
| Expenses | Shared expenses | P0 |
| Expenses | Multiple currencies | P0 |
| Expenses | Split calculations | P0 |
| Expenses | Balances | P0 |
| Settlement | Suggested settlements | P0 |
| Settlement | Payment completion | P0 |
| Offline | Cached essential trip data | P1 |
| PWA | Installable web experience | P1 |

---

# 4. Authentication

**Priority: P0**

## Goal

Allow users to securely maintain their own trips and participate in shared trips.

## Requirements

Users must be able to:

- create an account
- sign in
- sign out
- maintain a basic profile
- access trips they own or belong to

Minimum profile:

```text
User
- Display Name
- Email
- Avatar (optional)
```

## Business Rules

- Email identity must be unique where email authentication is used.
- Unauthenticated users cannot access private trip content.
- Invitation acceptance may require authentication.

## Acceptance Criteria

A user can:

1. create an account
2. sign in
3. create a trip
4. sign out
5. sign back in
6. see the same trip

## M1 Scope (ROADMAP D14, D18)

- Email + password only; minimum password length 8.
- No email verification or password reset until an email provider is chosen.
- Profile: display name editable; email read-only; avatar deferred until a storage provider is chosen.
- These rules are enforced server-side on every write path, including Better Auth endpoints: the display name is validated and no avatar can be set (ROADMAP D18).

## Deferred

- email verification and password reset (until an email provider is chosen)
- avatar upload (until a storage provider is chosen)
- social login providers
- passkeys
- enterprise authentication
- complex account linking

---

# 5. Trip Management

**Priority: P0**

## Goal

Create and manage the central workspace for a journey.

## Required Fields

```text
Trip Name
Primary Destination
Start Date
End Date
Timezone
Base Currency
```

Timezone is chosen from a searchable IANA timezone list with no preselected default; the device timezone is not assumed (ROADMAP D15).

The primary destination is stored in `trip_destinations` with `sort_order = 0` (ROADMAP D11).

Optional:

```text
Cover Image
Description
Additional Destinations
```

## User Actions

Users must be able to:

- create trip
- view trip
- edit trip
- archive trip

Permanent deletion may be restricted or deferred.

Archived trips appear in a collapsed "Archived" section of My Trips. The OWNER can archive and unarchive a trip (ROADMAP D16).

Archived trips are read-only: members can still open them, but every change is rejected except the OWNER's unarchive (ROADMAP D22). Archiving an already archived trip is a no-op (idempotent).

## Business Rules

```text
Start Date <= End Date
```

The creator becomes the initial Trip Owner.

Every trip must have at least one owner.

## Acceptance Criteria

Creating a trip produces:

- trip record
- owner membership
- itinerary days corresponding to the date range (derived from start/end date; not stored as records)
- usable trip workspace

---

# 6. Trip Lifecycle

**Priority: P0**

Supported states:

```text
PLANNING
UPCOMING
TRAVELING
COMPLETED
```

## Requirements

Lifecycle affects the default product experience.

### Planning

Prioritize:

- saved places
- itinerary
- collaboration

### Upcoming

Prioritize:

- final itinerary
- bookings
- checklist

### Traveling

Prioritize:

- Today Mode
- directions
- bookings
- quick expenses

### Completed

Prioritize:

- expense review
- balances
- settlement

## Business Rule

Trip status is derived from the trip's start and end dates, evaluated against the current date in the trip timezone.

A trip may have a nullable manual status override. When set, the override is the trip's status; clearing it returns the trip to its derived status.

This ensures users never become trapped by an incorrect automatic transition.

Before the start date:

```text
start_date - 14 days <= today < start_date → UPCOMING
today < start_date - 14 days               → PLANNING
```

`today` is the current date in the trip timezone (ROADMAP D12).

---

# 7. Trip Members

**Priority: P0**

## Requirements

Owners must be able to:

- invite travelers
- add placeholder travelers (travelers without an account)
- view invitation state
- view trip members
- remove eligible members

Members must be able to:

- view other travelers
- leave a trip where business rules permit

## Member States

```text
ACTIVE
LEFT
REMOVED
```

Invitation state (pending, accepted, declined, revoked, expired) lives in `trip_invitations`, not in membership.

## Placeholder Members (MVP)

A placeholder member represents a traveler who has no TripMate account yet.

```text
Display Name   (required)
Linked User    (none until claimed)
```

Rules:

- A placeholder can be the payer or a participant in expenses and settlements.
- A placeholder cannot be OWNER.
- A placeholder cannot sign in or access the trip.
- A placeholder is claimed through an invitation. Claiming links the accepting user to the existing membership; the placeholder's financial history is unchanged.
- A claim is rejected if the accepting user is already a member of the trip.

## Roles

Initial roles:

```text
OWNER
MEMBER
```

Avoid introducing additional role complexity during MVP.

## Business Rules

- The final owner cannot leave without transferring ownership.
- Removed users lose access to private trip information.
- Historical financial records must remain valid when a member leaves.

---

# 8. Invitations

**Priority: P0**

## Goal

Make group onboarding simple from mobile messaging apps.

## MVP Flow

```text
Owner
→ Generate Invite Link
→ Share Link
→ Recipient Opens
→ Sign In
→ Accept
→ Join Trip
```

## Requirements

Invitation must support:

- unique token
- trip reference
- invitation status
- expiry where appropriate
- optional placeholder member to claim

## Claiming a Placeholder

An invitation may target a placeholder member.

Accepting it links the user to that placeholder's existing membership instead of creating a new one.

All expenses, splits, and settlements recorded for the placeholder remain unchanged and now belong to the linked user's membership.

## Security Rule

An invitation preview must not expose sensitive trip information unnecessarily.

## Edge Cases

- expired invitation
- revoked invitation
- already accepted
- user already belongs to trip
- owner creates multiple invitation links
- claim invitation accepted by a user who is already a member of the trip (rejected)
- claim invitation for a placeholder that has already been claimed (rejected)

---

# 9. Saved Places

**Priority: P0**

## Goal

Allow travelers to collect ideas without immediately scheduling them.

## Place Information

```text
Name
Category
Priority
Address (optional)
Latitude / Longitude (optional)
Estimated Cost (optional)
Notes (optional)
External Reference (optional)
```

## Initial Categories

```text
Attraction
Food
Cafe
Activity
Shopping
Nightlife
Accommodation
Transportation
Souvenir
Other
```

Categories should be extensible.

## Priority

```text
MUST_GO
INTERESTED
OPTIONAL
```

## Actions

Users can:

- add
- edit
- view
- remove/archive
- add to itinerary

## Critical Rule

**Saved Place and Itinerary Activity are separate entities.**

Scheduling a saved place must not destroy the original planning information.

---

# 10. Place Entry

**Priority: P0**

MVP must not depend entirely on a third-party place provider.

Users must be able to manually enter a place.

This provides recovery when:

- place search fails
- location is not indexed
- internet connectivity is poor
- the activity does not represent a conventional location

## P1

External place search and map provider integration.

---

# 11. Member Place Preferences

**Priority: P1**

For a saved place, each member may choose:

```text
INTERESTED
NOT_INTERESTED
NO_RESPONSE
```

## Requirements

The system should show aggregate preference information.

Example:

```text
teamLab Planets

3 Interested
1 Not Interested
```

## Rule

Preference does not mean confirmed activity participation.

---

# 12. Activity Suggestions

**Priority: P1**

Members can propose an activity without directly changing the confirmed itinerary.

Suggestion may contain:

```text
Place
Suggested Date
Suggested Time
Notes
Suggested By
```

States:

```text
PENDING
ACCEPTED
DISMISSED
```

Accepted suggestions may become itinerary activities.

Dismissal should not automatically delete the associated saved place.

---

# 13. Itinerary

**Priority: P0**

## Goal

Create a flexible day-by-day travel schedule.

## Itinerary Activity

Required:

```text
Trip
Date
Title
```

Optional:

```text
Place
Start Time
End Time
Duration
Estimated Cost
Currency
Notes
Booking
Transportation Notes
```

## Actions

Members with permission can:

- create
- edit
- reorder
- move
- skip
- restore
- delete where permitted

## Activity State

Recommended initial states:

```text
PLANNED
COMPLETED
SKIPPED
CANCELLED
```

## Acceptance Criteria

A five-day trip can contain different activities for every day and display them chronologically.

---

# 14. Flexible Schedule Management

**Priority: P0**

Users must be able to:

- change time
- move activity within a day
- move activity to another day
- skip activity
- restore skipped activity

Schedule changes should not require deleting and recreating the activity.

## Edge Cases

- activity moved outside trip dates
- overlapping activities
- no start time
- activity spans midnight

MVP should warn where useful but should avoid unnecessarily blocking flexible travel planning.

---

# 15. Unscheduled Activities

**Priority: P1**

Some activities may belong to a day without requiring a specific time.

Example:

```text
Day 4

Anytime
- Buy souvenirs
- Visit convenience store

Scheduled
14:00 Museum
18:30 Dinner
```

The data model should not require every itinerary activity to have a start time.

---

# 16. Activity Participation

**Priority: P1**

Members can indicate:

```text
GOING
NOT_GOING
UNDECIDED
```

## Critical Rule

**Activity participation must not automatically determine expense participation.**

The user entering an expense must be able to review who shares that expense.

---

# 17. Today Mode

**Priority: P0**

Today Mode is the primary travel-time experience.

## Must Display

- current trip
- trip day
- current/next activity
- start time
- useful booking reference
- subsequent activities

When location/navigation integration exists:

- directions
- travel estimate

## Quick Actions

At minimum:

```text
Add Expense
View Full Day
Open Booking
```

Directions appear when enough location information exists.

## Empty State

If no activities exist:

```text
Nothing planned yet today.
```

The user should still be able to:

- view saved places
- add activity
- add expense

## Acceptance Criteria

During an active trip, opening the product should make today's next relevant activity discoverable without navigating through the full planner.

---

# 18. Bookings

**Priority: P1**

Bookings may relate to:

- accommodation
- flight
- train
- activity
- restaurant
- transportation
- other reservation

## Booking Information

```text
Type
Title
Provider
Reference Number
Start Date/Time
End Date/Time
URL
Notes
Status
```

Statuses:

```text
NEED_TO_BOOK
BOOKED
CANCELLED
```

Attachments may be added later depending on storage/security design.

## Security Principle

Do not encourage storage of unnecessary highly sensitive personal documents.

---

# 19. Checklist

**Priority: P1**

Checklist supports:

- personal items
- shared items
- optional assignee
- completion state
- grouping

Example groups:

```text
Before Travel
Packing
Bookings
Custom
```

## Item

```text
Title
Group
Scope
Assignee (optional)
Completed
```

## Business Rule

A personal checklist item is visible only according to the selected privacy model.

Shared items are visible to trip members.

---

# 20. Expense Management

**Priority: P0**

Expense handling is a core TripMate capability.

## Expense Fields

```text
Trip
Description
Category
Date / Time

Original Amount
Original Currency

Exchange Rate
Base Currency Amount

Paid By
Participants
Split Method

Notes
```

## Initial Categories

```text
Accommodation
Food
Transportation
Activity
Shopping
Flight
Fee
Other
```

## Actions

Users can:

- add expense
- view expense
- edit eligible expense
- remove/cancel eligible expense

---

# 21. Quick Expense Entry

**Priority: P0**

Common travel expenses must be fast to record on mobile.

Default flow:

```text
+ Expense
→ Amount
→ Description / Category
→ Paid By
→ Participants
→ Save
```

Defaults should use trip context where safe.

Examples:

```text
Currency = trip/default recent currency
Paid By = current user
Participants = sensible previous/group selection
```

Defaults must remain reviewable.

Advanced fields can live under:

```text
More Options
```

---

# 22. Expense Payer Model

**Priority: P0**

Initial MVP assumes one payer per expense.

Example:

```text
Dinner ¥18,000
Paid by Phyo
```

Multiple payers for a single expense are deferred unless real usage proves the requirement.

This keeps the initial financial model significantly simpler.

---

# 23. Expense Participants

**Priority: P0**

Every shared expense must explicitly identify who shares it.

Example:

```text
Taxi ¥6,000

Phyo ✓
Su   ✓
Aung ✓
Min  ✕
```

The participant set may differ from:

- all trip members
- activity participants
- payer

---

# 24. Split Methods

**Priority: P0**

## Equal Split

```text
¥12,000 / 4
= ¥3,000 each
```

## Exact Amount

```text
Phyo  ¥4,000
Su    ¥3,000
Aung  ¥3,000
Min   ¥2,000
```

Validation:

```text
Sum(shares) = expense total
```

## Percentage

```text
Phyo 40%
Su   20%
Aung 20%
Min  20%
```

Validation:

```text
Sum(percentages) = 100%
```

---

# 25. Financial Precision

**Priority: P0**

Money must never use floating-point arithmetic for financial calculations.

Implementation should use:

- PostgreSQL decimal/numeric representation
- deterministic rounding rules
- currency-aware precision

Example:

JPY normally has no minor currency unit.

USD commonly has two decimal places.

Currency metadata should define the supported precision.

---

# 26. Rounding

**Priority: P0**

Equal splitting may create indivisible remainders.

Example:

```text
¥10,000 / 3
```

The system must produce deterministic shares whose sum exactly equals the expense.

Example:

```text
¥3,334
¥3,333
¥3,333
```

The remainder assignment rule must be consistent and tested.

Never silently lose or create money due to rounding.

## Remainder Rule

Applies to Equal and Percentage splits.

1. Compute each participant's share in the currency's minor units, rounded down:
   - Equal: amount ÷ number of participants
   - Percentage: amount × percentage ÷ 100
2. Leftover = amount − sum of rounded-down shares (in minor units).
3. Order participants by `trip_members.created_at` ascending, then `trip_members.id` ascending.
4. Distribute the leftover one minor unit each, starting from the top of that order.

In the example above, the participant who joined the trip first receives ¥3,334.

Exact Amount splits have no remainder: entered shares must already sum to the expense amount.

---

# 27. Multi-Currency

**Priority: P0**

Every trip has a base currency.

Expenses may use another currency.

Example:

```text
Trip base:
JPY

Expense:
100 USD

Exchange rate:
1 USD = 150 JPY

Stored base amount:
15,000 JPY
```

## Requirements

Persist:

- original amount
- original currency
- rate used
- converted base amount

## Critical Rule

Historical expenses do not automatically change when market exchange rates change.

## Base Currency Rounding

Base amount:

```text
base_amount = original_amount × exchange_rate
```

rounded `ROUND_HALF_UP` to the base currency's minor units.

Base shares:

1. For each participant, base share = base_amount × original share ÷ original_amount, rounded down to base currency minor units.
2. Distribute any leftover base minor units using the Remainder Rule ordering (§26).

Invariants:

```text
sum(original shares) = original_amount
sum(base shares)     = base_amount
```

Example:

```text
$10.00 USD, rate 149.995 → base ¥1,500 (1,499.95 rounded half-up)

Original shares:  $3.34   $3.33   $3.33
Base (rounded down): ¥501  ¥499   ¥499   = ¥1,499
Leftover ¥1 → first participant in order

Base shares:      ¥502    ¥499    ¥499   = ¥1,500
```

---

# 28. Exchange Rates

**P0**

Manual exchange-rate entry must be supported.

This guarantees the expense flow works without an external currency service.

**P1**

Automatically suggest current exchange rates.

The user should still be able to review or override the rate where appropriate.

---

# 29. Expense Editing

**Priority: P0**

Users must be able to correct mistakes.

Potential editable fields:

- amount
- description
- category
- payer
- participants
- split
- exchange rate
- date
- notes

Changes must trigger recalculation of balances.

## P1

Basic change history for financially meaningful modifications.

---

# 30. Balance Calculation

**Priority: P0**

For every member:

```text
Net Balance
=
Amount Paid
-
Personal Share
± Settlements
```

Interpretation:

```text
Positive → should receive money
Negative → owes money
Zero     → settled
```

## Acceptance Criteria

Across all expense splits:

```text
Sum(all member balances) = 0
```

subject only to defined currency rounding rules.

This invariant must have automated tests.

---

# 31. Settlement Suggestions

**Priority: P0**

TripMate should reduce net balances into suggested transfers.

Example:

```text
Phyo  +¥8,000
Su    -¥5,000
Aung  -¥3,000
```

Suggested:

```text
Su → Phyo    ¥5,000
Aung → Phyo  ¥3,000
```

The objective is to settle balances with a simple set of payments.

The algorithm must remain deterministic and testable.

## Algorithm

Simple, deterministic greedy matching:

1. Compute each member's net balance in base currency minor units.
2. While any balance is non-zero:
   - select the largest debtor (most negative balance) and the largest creditor (most positive balance)
   - break ties using the Remainder Rule ordering (§26): `trip_members.created_at`, then `id`
   - suggest a transfer of the smaller of the two absolute amounts
   - apply it to both balances

This produces a simple, deterministic set of transfers.

It is not guaranteed to produce the minimum possible number of transfers.

---

# 32. Settlement Recording

**Priority: P0**

A settlement contains:

```text
From Member
To Member
Amount
Currency
Status
Date
```

Initial statuses:

```text
PENDING
COMPLETED
```

## Business Rule

Completed settlement payments affect outstanding balances.

Deleting or reversing a settlement must recalculate balances correctly.

---

# 33. Expense Summary

**Priority: P0**

Users should be able to see:

```text
Trip Total
Your Spending
Your Share
Your Balance
```

Group view:

```text
Member Balances
Outstanding Settlements
```

P1:

Category breakdown.

P2:

Advanced spending analytics.

---

# 34. Budget

**Priority: P1**

Basic trip-level budget:

```text
Estimated Budget
Actual Spending
Remaining / Over Budget
```

Potential categories:

```text
Accommodation
Food
Transportation
Activities
Shopping
Flights
Other
```

Advanced budget forecasting is deferred.

Budget fields are not yet part of `DATABASE.md`; they are added when the budget slice is built.

---

# 35. Search and Filtering

**Priority: P1**

Saved places:

- search
- category
- priority

Itinerary:

- date
- activity status

Expenses:

- member
- category
- date
- currency

MVP filtering should remain lightweight.

---

# 36. Offline Read Access

**Priority: P1**

Essential travel information should remain available after temporary network loss.

Initial offline targets:

- today's itinerary
- basic trip information
- important booking references

UI must clearly indicate stale/offline data.

Example:

```text
Offline
Last updated 08:42
```

---

# 37. Offline Writes

**Priority: P2**

Potential future behavior:

```text
Add Expense
→ Save Locally
→ Pending Sync
→ Network Returns
→ Sync
```

Offline mutation introduces conflict and synchronization complexity.

It should not block initial MVP validation.

---

# 38. PWA

**Priority: P1**

Target capabilities:

- installable application
- app manifest
- mobile-friendly launch experience
- appropriate icons
- essential caching
- standalone display where supported

PWA support should enhance the web application rather than create a separate application architecture.

---

# 39. Responsive UX

**Priority: P0**

TripMate is mobile-first.

Primary breakpoint philosophy:

### Mobile

Optimize for:

- Today Mode
- quick expenses
- itinerary viewing
- bookings
- lightweight editing

### Tablet/Desktop

Enhance:

- planning
- itinerary organization
- place management
- expense review

Responsive behavior must not simply shrink desktop layouts.

---

# 40. Accessibility

**Priority: P0**

Core workflows must support:

- keyboard navigation
- visible focus states
- semantic controls
- accessible names
- sufficient contrast
- non-color status indicators
- usable touch targets

Mobile interaction targets should be comfortably tappable.

Accessibility should be part of the base design system rather than a later cleanup phase.

---

# 41. Timezones

**Priority: P0**

Travel inherently crosses timezones.

Each trip should have a primary timezone.

Important trip date/time values should have explicit timezone semantics.

The application must avoid assuming that the user's current device timezone is always the trip timezone.

Example:

A traveler in Cambodia plans a future Tokyo activity.

```text
Activity:
18:00 Tokyo time
```

It should remain 18:00 Tokyo time after the traveler enters Japan.

An itinerary activity may have its own timezone when it takes place in a different zone from the trip (for example, a Seoul day trip within a Tokyo trip).

```text
Effective timezone = activity timezone ?? trip timezone
```

Activity times are interpreted in the effective timezone.

Today Mode uses each activity's effective timezone.

Database and application date-time rules will be defined in `DATABASE.md` and `ARCHITECTURE.md`.

---

# 42. Date-Only vs Date-Time

**Priority: P0**

The system must distinguish between:

```text
Date-only
2026-11-18
```

and:

```text
Timestamp
2026-11-18 14:00 Asia/Tokyo
```

Examples of date-only concepts:

- trip start date
- itinerary day

Examples of timestamp concepts:

- expense creation
- booking timestamp
- invitation expiry

Avoid unnecessary timezone conversion for date-only concepts.

---

# 43. Location Data

**Priority: P1**

Places should eventually support:

```text
Latitude
Longitude
Address
Provider Place ID
```

PostgreSQL is the system of record.

PostGIS may be introduced when requirements justify:

- nearby search
- distance calculations
- geographic filtering
- route-oriented discovery

Do not introduce PostGIS solely because PostgreSQL supports it.

---

# 44. External Links

**Priority: P1**

Places and bookings may reference external services.

Examples:

- map link
- booking URL
- attraction website
- restaurant website

TripMate should avoid tightly coupling core data to one external provider.

---

# 45. Attachments

**Priority: P2**

Potential attachments:

- tickets
- booking PDFs
- receipts
- images

Before implementation, define:

- storage provider
- access control
- retention
- upload limits
- malware/file validation
- sensitive-document policy

Do not store passport scans by default.

---

# 46. Notifications

**Priority: P2**

Potential meaningful notifications:

- trip invitation
- major itinerary change
- checklist assignment
- booked activity approaching
- settlement request

Avoid notification noise.

---

# 47. Audit / Activity History

**Priority: P2**

Potential history:

```text
Su moved teamLab
Day 3 → Day 4

Phyo changed Dinner
¥12,000 → ¥14,000
```

Financial change history has greater priority than general planning history.

---

# 48. Maps Integration

**Priority: P1/P2**

Potential capabilities:

- place search
- map preview
- directions
- nearby saved places

MVP must remain functional without deep map integration.

Directions may initially open an external map application.

---

# 49. AI Features

**Priority: Later**

AI must not be required for core functionality.

Potential features:

- itinerary generation
- route optimization
- contextual replanning
- receipt parsing
- natural-language trip editing
- personalized recommendations

Example:

```text
Move teamLab to Thursday afternoon
and find dinner nearby.
```

AI must operate on the structured trip model rather than replacing it.

---

# 50. Native Mobile Application

**Priority: Later**

The native application should reuse:

- backend
- authentication model
- domain rules
- database
- APIs
- financial calculations

Potential native-only advantages:

- push notifications
- deeper offline support
- background location features where justified
- camera receipt capture
- wallet integration

Native development should begin only after web/PWA product validation.

---

# 51. Privacy and Security

**Priority: P0**

Trip data is private by default.

Core requirements:

- authenticated access
- trip membership authorization
- server-side authorization
- secure invitation tokens
- secure session handling
- input validation
- protected financial information
- no reliance on hidden UI controls for security

Authorization must be enforced server-side.

---

# 52. Ownership Rules

Every shared entity should have explicit ownership/context.

Examples:

```text
Trip → Trip Members
Trip → Places
Trip → Activities
Trip → Expenses
Trip → Checklists
```

Queries must always respect trip membership.

Cross-trip data leakage is a critical security failure.

---

# 53. Deletion Strategy

Prefer state transitions over destructive deletion where historical integrity matters.

Examples:

```text
Trip → ARCHIVED
Activity → CANCELLED / SKIPPED
Member → REMOVED
Booking → CANCELLED
```

Expenses require special care because deletion affects balances.

Database design should support safe removal or soft-deletion where justified.

---

# 54. Core Domain Invariants

The following invariants should be enforced through application logic, database constraints, and tests where appropriate.

### Trip

```text
start_date <= end_date
```

### Ownership

```text
trip has >= 1 owner
owner is never a placeholder member
```

### Expense

```text
amount > 0
```

### Exact Split

```text
sum(split amounts) = expense amount
```

### Percentage Split

```text
sum(percentages) = 100%
```

### Balance

```text
sum(member balances) = 0
```

### Settlement

```text
amount > 0
payer != receiver
```

### Membership

Financial records referencing former members remain valid.

---

# 55. Critical Edge Cases

Implementation and testing must explicitly consider:

### Trips

- one-day trip
- long trip
- trip dates changed after itinerary exists
- trip already in progress when created

### Members

- member leaves with expenses
- owner wants to leave
- removed member paid for expenses
- duplicate invitation
- placeholder pays or participates, then is claimed
- claim by a user who is already a member of the trip

### Itinerary

- no activities
- activity without time
- overlapping activities
- activity moved to another date
- activity cancelled after booking

### Expenses

- payer is not a participant
- only one participant
- unequal split
- rounding remainder
- member removed after paying
- expense edited after settlement
- expense deleted after settlement
- foreign currency rate changed manually

### Connectivity

- network disappears during travel
- stale cached itinerary
- external map provider unavailable

---

# 56. MVP Quality Gates

TripMate is not ready for real-trip validation until the following are reliable.

## Planning

A group can:

- create a trip
- join it
- save places
- build a multi-day itinerary

## Travel

A traveler can:

- open today's schedule quickly
- find the next activity
- access booking information
- record an expense from mobile

## Finance

The system can:

- represent shared expenses correctly
- handle multiple currencies
- split amounts without precision loss
- calculate balances
- create settlements

## Security

A user cannot access another private trip without valid membership.

## Responsive UX

Core workflows are comfortable on a phone-sized screen.

## Reliability

Financial calculation tests pass deterministically.

---

# 57. Recommended MVP Build Order

Do not implement the entire feature list horizontally.

Use vertical slices.

## Slice 1 — Foundation

```text
Authentication
Application Shell
Trip Creation
Trip Switching
```

## Slice 2 — Group

```text
Trip Members
Invitation
Membership Authorization
```

## Slice 3 — Planning

```text
Saved Places
Itinerary
Schedule Editing
```

## Slice 4 — Travel

```text
Today Mode
Booking References
Basic Checklist
```

## Slice 5 — Expenses

```text
Expense Entry
Participants
Splits
Multi-Currency
```

## Slice 6 — Settlement

```text
Balances
Settlement Suggestions
Settlement Recording
```

## Slice 7 — Mobile/PWA Hardening

```text
Responsive Polish
Offline Read
PWA
Accessibility
Performance
```

## Slice 8 — Real Trip Validation

Use the application on an actual trip.

Do not begin large P2 features before completing this validation.

---

# 58. Feature Completion Definition

A feature is not complete merely because the UI exists.

For a P0 feature, "Done" means:

```text
UX works
+
Server behavior works
+
Authorization works
+
Validation works
+
Database integrity works
+
Important edge cases handled
+
Automated tests pass
+
Mobile experience verified
```

For financial functionality:

```text
Calculation tests are mandatory.
```

---

# 59. Deferred Feature Register

The following features should not silently enter MVP scope:

- multiple payers per expense
- full accounting audit trail
- automatic itinerary generation
- AI chatbot
- AI receipt parsing
- direct booking marketplace
- flight price search
- hotel price search
- social travel feed
- public profiles
- travel influencer functionality
- real-time friend location sharing
- complex permission builder
- offline-first collaborative editing
- native mobile application
- advanced travel analytics

Adding one requires an explicit scope decision.

---

# 60. Product Validation Questions

During the first real trip, evaluate:

### Planning

- Did we still use Notes or Sheets?
- Were saved places easy to organize?
- Was group decision-making clear?
- Was itinerary editing faster than chat coordination?

### During Travel

- Did Today Mode show enough information?
- Could an expense be entered quickly?
- Did poor connectivity create problems?
- Did we frequently need another app for information TripMate should have surfaced?

### Expenses

- Did participants trust the balances?
- Were split options sufficient?
- Did multi-currency handling match real behavior?
- Was settlement understandable?

### Product Complexity

- Which features were never used?
- Which screens felt overloaded?
- Which actions required too many taps?
- What did users repeatedly search for?

Real usage should determine the next product phase.

---

# 61. Next Artifact

The next document is:

**INFORMATION_ARCHITECTURE.md**

It will define:

- application hierarchy
- mobile navigation
- desktop navigation
- trip workspace structure
- screen inventory
- page relationships
- lifecycle-aware navigation
- global vs trip-scoped features
- primary and secondary actions
- mobile information hierarchy

The document sequence remains:

```text
PROJECT_OVERVIEW.md
        ↓
USER_FLOWS.md
        ↓
FEATURES.md          ← Current
        ↓
INFORMATION_ARCHITECTURE.md
        ↓
DATABASE.md
        ↓
ARCHITECTURE.md
        ↓
DESIGN_SYSTEM.md
        ↓
ROADMAP.md
```