# TripMate — Product & Development Roadmap

## 1. Purpose

This document turns TripMate's product and technical foundation into an executable development plan.

It defines:

- development phases
- vertical slices
- milestone goals
- dependencies
- quality gates
- real-trip validation
- decision points
- deferred scope
- MVP completion criteria
- post-MVP direction

This roadmap should be used together with:

```text
PROJECT_OVERVIEW.md
USER_FLOWS.md
FEATURES.md
INFORMATION_ARCHITECTURE.md
DATABASE.md
ARCHITECTURE.md
DESIGN_SYSTEM.md
```

---

# 2. Roadmap Philosophy

TripMate should be built as:

> **Working vertical slices, not horizontal technical layers.**

Avoid:

```text
Build entire database
        ↓
Build every API
        ↓
Build every UI
        ↓
Integrate everything
```

Prefer:

```text
Create Trip
UI → Validation → Domain → Database → Tests

then

Invite Member
UI → Authorization → Database → Tests

then

Save Place
UI → Domain → Database → Tests
```

Every meaningful milestone should leave TripMate in a usable state.

---

# 3. Primary Product Goal

The MVP is successful when a real group can use TripMate for an actual trip from planning through settlement without needing a separate:

- itinerary spreadsheet
- expense spreadsheet
- planning notes document
- manual expense calculator

External services such as Maps or messaging may still be used where appropriate.

TripMate does not need to replace every travel application.

---

# 4. MVP Validation Journey

The roadmap should ultimately support this journey:

```text
Create Trip
    ↓
Invite Friends
    ↓
Save Places
    ↓
Decide What to Visit
    ↓
Build Itinerary
    ↓
Track Bookings
    ↓
Prepare Checklist
    ↓
Start Trip
    ↓
Use Today Mode
    ↓
Adjust Plans
    ↓
Record Expenses
    ↓
Review Balances
    ↓
Settle Up
    ↓
Complete Trip
```

---

# 5. Development Principles

Throughout implementation:

1. Build the smallest complete vertical slice.
2. Keep business rules outside UI components.
3. Keep financial logic deterministic and heavily tested.
4. Optimize mobile flows early rather than after desktop.
5. Test authorization from the beginning.
6. Avoid premature external integrations.
7. Avoid premature realtime architecture.
8. Avoid premature AI.
9. Use the application on realistic sample trips continuously.
10. Validate with a real trip before expanding scope.

---

# 6. Phase Overview

```text
Phase 0
Project Foundation

Phase 1
Trips & Identity

Phase 2
Group Collaboration

Phase 3
Planning

Phase 4
Travel Operations

Phase 5
Expenses

Phase 6
Settlement

Phase 7
Mobile / PWA Hardening

Phase 8
Real Trip Validation

Phase 9
MVP Stabilization

Phase 10
Post-MVP Decisions
```

---

# 7. Phase 0 — Project Foundation

## Goal

Create a reliable technical foundation without overbuilding infrastructure.

## Deliverables

```text
Next.js project
TypeScript
Tailwind CSS

PostgreSQL
Drizzle
Zod

Linting
Formatting
Testing foundation

Environment validation
Database migrations
Development seed strategy

Responsive application shell
Basic design tokens
CI foundation
```

---

# 8. Project Structure

Establish:

```text
src/
├── app/
├── components/
├── modules/
├── domain/
├── db/
├── lib/
└── integrations/
```

Do not create empty architectural layers merely to match documentation.

Directories should grow with implementation.

---

# 9. Design Foundation

Implement only essential primitives initially:

```text
Button
IconButton
Input
Textarea
Select
Checkbox
Radio
Tabs
Badge
Card
Dialog
Sheet
Toast
```

Also establish:

```text
Typography
Spacing
Radius
Semantic colors
Focus treatment
Touch targets
```

Do not build the entire component library before feature development.

---

# 10. Database Foundation

Initial migrations:

```text
users
currencies
trips
trip_members
```

Seed:

```text
ISO-style currency metadata
```

Do not create all future tables in Phase 0.

---

# 11. Testing Foundation

Configure:

```text
Unit testing
Database integration testing
Playwright
```

CI should initially run:

```text
TypeScript
Lint
Unit tests
Build
```

Database integration and critical E2E should be added as their corresponding features appear.

---

# 12. Phase 0 Quality Gate

Before proceeding:

- project runs locally
- PostgreSQL connection works
- migrations work from empty database
- production build succeeds
- responsive shell renders correctly
- focus styles work
- test runner works
- CI passes
- environment configuration is validated

---

# 13. Decision Gate A — Authentication

**Status: RESOLVED (2026-11-03) — Better Auth.** See Decision Log D1 (§113).

The evaluation criteria below are retained for context.

Before implementing Phase 1 authentication, choose the authentication solution.

Evaluate:

```text
Next.js compatibility
email/password requirements
OAuth requirements
session security
native-app compatibility
cost
vendor lock-in
developer experience
```

Do not build custom password authentication unless there is a compelling reason.

---

# 14. Phase 1 — Trips & Identity

## Goal

A user can authenticate and create/manage a trip.

This is TripMate's first real vertical product slice.

---

# 15. Slice 1.1 — Authentication

Implement:

```text
Sign Up
Sign In
Sign Out
Current User
Basic Profile
Protected Routes
```

Acceptance:

> An unauthenticated user cannot access private trip data.

---

# 16. Slice 1.2 — My Trips

Implement:

```text
My Trips
Trip Cards
Empty State
Create Trip CTA
```

Initially support:

```text
current
upcoming
completed
```

through lifecycle information where available.

---

# 17. Slice 1.3 — Create Trip

Fields:

```text
Trip Name
Primary Destination
Start Date
End Date
Timezone
Base Currency
```

Flow:

```text
Create Trip
    ↓
Validate
    ↓
Create trip
    ↓
Create OWNER membership
    ↓
Open Trip Workspace
```

This must be transactional.

---

# 18. Slice 1.4 — Trip Workspace

Implement the responsive shell.

Mobile:

```text
Today
Plan
+
Expenses
Trip
```

Desktop:

```text
Today
Plan
Expenses

Trip
Members
Bookings
Checklist
Settings
```

Destinations not implemented yet may use intentional placeholder/empty states during development.

Do not ship dead navigation to production.

---

# 19. Slice 1.5 — Trip Settings

Implement:

```text
Name
Destination
Dates
Timezone
Base Currency
Archive
```

Permission:

```text
OWNER
```

for sensitive trip-level changes where defined.

---

# 20. Phase 1 Quality Gate

User can:

1. create account
2. sign in
3. create trip
4. view trip
5. edit trip
6. switch between trips
7. archive trip

Security tests verify users cannot access another user's private trip.

---

# 21. Phase 2 — Group Collaboration

## Goal

A real group can join and share one trip workspace.

---

# 22. Slice 2.1 — Membership Authorization

Implement centralized:

```text
requireTripMember()
requireActiveTripMember()
requireTripOwner()
```

All trip-scoped server operations use these rules.

---

# 23. Slice 2.2 — Invitation

Implement:

```text
Create invitation
Secure token
Share invitation URL
Open invitation
Accept
Decline
Expire / revoke
```

Acceptance flow:

```text
Invite Link
    ↓
Authentication if needed
    ↓
Invitation Preview
    ↓
Accept
    ↓
Create Membership
    ↓
Trip Workspace
```

---

# 24. Slice 2.3 — Members

Implement:

```text
Traveler List
Owner Indicator
Member Status
Pending Invitations
Invite Traveler
Remove Member
Leave Trip
```

Protect the final owner invariant.

---

# 25. Phase 2 Quality Gate

Test with at least two separate users.

Scenario:

```text
User A creates trip
User A invites User B
User B accepts
Both see same trip
Unauthorized User C cannot access it
```

Also verify:

```text
duplicate invitation behavior
expired invitation
revoked invitation
member removal
last-owner protection
```

---

# 26. Phase 3 — Planning

## Goal

A group can collect ideas and turn them into a usable itinerary.

This is the first major product-value milestone.

---

# 27. Slice 3.1 — Saved Places

Database:

```text
saved_places
```

Implement:

```text
Add Place
Edit Place
Archive/Remove Place
Place List
Place Detail
Category
Priority
Estimated Cost
Notes
```

Manual place entry is mandatory.

No Maps API dependency yet.

---

# 28. Slice 3.2 — Place Search & Filters

Implement local TripMate search/filter:

```text
Search by name
Category
Priority
```

Do not confuse this with external place discovery.

---

# 29. Slice 3.3 — Place Preferences

Database:

```text
place_preferences
```

Implement:

```text
Interested
Not Interested
No Response
```

Display lightweight group preference summaries.

---

# 30. Slice 3.4 — Itinerary

Database:

```text
itinerary_activities
```

Implement:

```text
Day navigation
Add activity
Edit activity
Move activity
Reorder
Skip
Restore
Cancel
```

Support:

```text
timed activity
unscheduled activity
custom activity
saved-place activity
```

---

# 31. Slice 3.5 — Saved Place → Itinerary

Critical workflow:

```text
Saved Place
    ↓
Add to Itinerary
    ↓
Choose Day
    ↓
Optional Time
    ↓
Activity Created
```

Remember:

```text
Saved Place != Itinerary Activity
```

The saved place remains available independently.

---

# 32. Slice 3.6 — Activity Participation

Database:

```text
activity_participants
```

Implement:

```text
Going
Not Going
Undecided
```

Critical rule:

> Activity participation does not automatically create expense participation.

---

# 33. Slice 3.7 — Suggestions

P1.

If schedule allows before real-trip validation:

```text
Suggest activity
Pending
Accept
Dismiss
```

If implementation pressure appears, this can move after core itinerary without blocking MVP usability.

---

# 34. Phase 3 Mobile QA

Test planning on a phone.

Required tasks:

```text
Save place
Find place
Add place to itinerary
Move activity
Change day
Skip activity
Review full day
```

No task should require a desktop interface.

---

# 35. Phase 3 Quality Gate

Create a realistic:

> **5-day Tokyo sample trip**

with:

```text
4 travelers
20 saved places
12 scheduled activities
multiple categories
timed activities
unscheduled activities
different participant combinations
```

If this feels cumbersome, fix planning UX before adding more modules.

---

# 36. Decision Gate B — Maps Integration

After manual place planning works, evaluate whether external place search is necessary before real-trip validation.

Questions:

```text
Is manual entry too slow?

Are addresses difficult to enter?

Do users frequently leave TripMate to search places?

Would provider integration significantly reduce friction?
```

If yes, introduce a provider adapter.

If not, defer deeper Maps integration.

---

# 37. Phase 4 — Travel Operations

## Goal

Make TripMate useful during the actual trip.

---

# 38. Slice 4.1 — Today Mode

Implement lifecycle-aware Today.

Traveling state prioritizes:

```text
Trip Day
Current / Next Activity
Start Time
Leave Context
Upcoming Activities
Participants
```

Immediate actions:

```text
Directions
Booking
View Full Day
Add Expense
```

Unavailable integrations should not block the screen.

---

# 39. Slice 4.2 — Bookings

Database:

```text
bookings
```

Implement:

```text
Add Booking
Edit Booking
Booking Status
Booking Reference
Provider
URL
Date / Time
Notes
Link to Activity
```

No document uploads required initially.

---

# 40. Slice 4.3 — Booking in Today

When relevant:

```text
Today
    ↓
Activity
    ↓
Ticket / Booking
```

Important booking information should be reachable quickly.

---

# 41. Slice 4.4 — Checklist

Database:

```text
checklist_groups
checklist_items
```

Implement:

```text
Shared Item
Personal Item
Assignee
Complete / Reopen
Groups
```

Default groups may include:

```text
Before Travel
Packing
Bookings
```

---

# 42. Slice 4.5 — Flexible Travel Changes

From Today:

```text
Move Later
Move Another Day
Skip
```

Users should not need to navigate through a complex planning editor for common travel changes.

---

# 43. Phase 4 Stress Test

Simulate actual travel.

Test while using only mobile viewport.

Questions:

```text
Can next activity be found in 2–3 seconds?

Can directions be reached quickly?

Can booking information be found quickly?

Can an activity be skipped quickly?

Can the rest of today's plan still be understood?
```

---

# 44. Phase 4 Quality Gate

TripMate must now be useful during a trip even before expenses are complete.

Planning + operational flows should form a coherent product.

---

# 45. Phase 5 — Expenses

## Goal

Replace the separate group-expense spreadsheet/calculator.

Financial correctness is the priority.

---

# 46. Slice 5.1 — Finance Domain

Before expense UI complexity, implement pure domain functions.

```text
Money representation
Currency precision
Equal split
Exact split
Percentage split
Rounding
Currency conversion
Balance calculation
```

Tests first.

---

# 47. Finance Test Gate

Mandatory cases:

```text
¥10,000 / 3

$10.00 / 3

payer is participant

payer is not participant

single participant

two participants

many participants

exact split

percentage split

multi-currency

rounding remainder
```

Invariant:

```text
SUM(splits) = expense
```

must always hold.

---

# 48. Slice 5.2 — Expense Entry

Database:

```text
expenses
expense_splits
```

Implement:

```text
Amount
Currency
Description
Category
Date / Time
Payer
Participants
Split Method
Notes
```

One payer per expense for MVP.

---

# 49. Slice 5.3 — Quick Expense

Optimize mobile flow.

Default path:

```text
+
    ↓
Amount
    ↓
Description
    ↓
Paid By
    ↓
Split Between
    ↓
Save
```

Advanced options remain available without dominating the default flow.

---

# 50. Slice 5.4 — Multi-Currency

Implement:

```text
Original Amount
Original Currency
Exchange Rate
Base Amount
```

Manual exchange rate must work.

Historical rate is frozen after saving unless deliberately edited.

---

# 51. Slice 5.5 — Expense List

Implement:

```text
Chronological transactions
Expense detail
Edit expense
Void expense
Basic filters
```

Financial edits require stale-update protection.

---

# 52. Slice 5.6 — Expense Summary

Show:

```text
Trip Spending
Your Spending
Your Share
Your Balance
```

Do not introduce advanced analytics yet.

---

# 53. Phase 5 Quality Gate

Using the Tokyo sample trip:

Record at least:

```text
20 expenses

multiple payers

JPY expenses

foreign-currency expenses

all-member splits

partial-member splits

equal splits

exact splits

percentage splits
```

Verify all calculations manually against expected values.

---

# 54. Financial Regression Gate

Any change affecting:

```text
expenses
splits
currency
settlements
membership
```

must run the finance regression suite.

No financial feature is considered complete without automated tests.

---

# 55. Phase 6 — Balances & Settlement

## Goal

Complete the group financial lifecycle.

---

# 56. Slice 6.1 — Balances

Implement derived member balances.

Formula:

```text
Paid
-
Personal Share
±
Completed Settlements
```

Invariant:

```text
SUM(member balances) = 0
```

---

# 57. Slice 6.2 — Settlement Suggestions

Implement deterministic transfer suggestions.

Example:

```text
Su   → Phyo ¥5,000
Aung → Phyo ¥3,000
```

Suggestions remain derived.

Do not persist until a user records a settlement.

Algorithm: simple, deterministic greedy matching (largest debtor to largest creditor), as defined in `FEATURES.md` §31. It is not a minimum-transfers algorithm.

---

# 58. Slice 6.3 — Record Settlement

Database:

```text
settlements
```

Implement:

```text
From
To
Amount
Status
Completed Date
```

MVP primarily uses trip base currency.

---

# 59. Slice 6.4 — Settlement History

Users can review:

```text
Pending
Completed
Voided
```

where applicable.

Changes recalculate balances.

---

# 60. Phase 6 Quality Gate

Scenario:

```text
4 travelers
20+ expenses
multiple currencies
multiple split patterns
```

Then:

```text
calculate balances
generate settlement suggestions
record transfers
```

Final expected result:

```text
all balances = 0
```

after complete settlement.

---

# 61. Former Member Test

Mandatory scenario:

```text
Member pays expenses
Member participates in expenses
Member leaves trip
```

Financial history and balances must remain valid.

This is a critical domain test.

---

# 62. Phase 7 — Mobile & PWA Hardening

## Goal

Prepare TripMate for realistic travel conditions.

This phase improves an already functional mobile product.

It does not begin mobile support.

Mobile support exists from Phase 1.

---

# 63. Slice 7.1 — Installable PWA

Implement:

```text
Manifest
Icons
Standalone launch
Installability
HTTPS requirements
```

---

# 64. Slice 7.2 — Offline Awareness

Implement:

```text
Online / Offline detection
Last updated state
Useful offline messaging
```

Avoid generic failure screens.

---

# 65. Slice 7.3 — Essential Read Cache

Cache only high-value travel information initially:

```text
Today itinerary
Trip basics
Important booking references
```

Do not cache everything.

---

# 66. Offline Acceptance

Scenario:

```text
Open TripMate online
Load today's trip
Disable network
Reopen / revisit travel information
```

User should still understand:

```text
where they are going
when
important booking information
```

with clear stale/offline indication.

---

# 67. Slice 7.4 — Mobile Performance

Review:

```text
initial page load
Today Mode
navigation
images
JavaScript bundle
server queries
external dependencies
```

Today should not wait on nonessential integrations.

---

# 68. Slice 7.5 — Accessibility Audit

Review:

```text
keyboard
focus
screen-reader semantics
contrast
touch targets
reduced motion
form errors
dialog/sheet focus management
```

---

# 69. Slice 7.6 — Responsive Audit

Verify:

```text
small mobile
large mobile
tablet
desktop
```

Do not merely check screenshots.

Complete actual tasks at each important size.

---

# 70. Phase 7 Quality Gate

TripMate should now feel:

```text
Mobile-first
Installable
Travel-ready
Fast
Accessible
Resilient
```

rather than like a desktop website viewed on a phone.

---

# 71. Phase 8 — Real Trip Validation

## Goal

Use TripMate for a real trip.

This is a product milestone, not merely QA.

---

# 72. Real Trip Rule

During validation:

> Use TripMate as the primary source of truth whenever the relevant feature exists.

Avoid immediately falling back to:

```text
Google Sheets
Notes
manual expense spreadsheet
```

Otherwise real friction will remain hidden.

---

# 73. Validation Data to Capture

Record friction such as:

```text
Where did I hesitate?

What took too many taps?

What information was hard to find?

What did I still use another app for?

What did my friends misunderstand?

Which feature was never used?

Which information did we enter twice?

What failed with poor network?

Which financial result did we distrust?

What did we need urgently but could not find?
```

---

# 74. Lightweight Product Telemetry

If analytics is introduced, focus on product behavior rather than vanity metrics.

Useful examples:

```text
trip created
member joined
place saved
place scheduled
Today opened
expense created
settlement completed
```

Avoid excessive event instrumentation before real questions exist.

---

# 75. Group Validation

Do not validate only as the trip organizer.

Observe:

```text
Can friends join easily?

Can they understand Plan?

Can they add an expense without explanation?

Can they understand balances?

Do they know where bookings live?

Do they understand the + action?
```

Organizer familiarity can hide UX problems.

---

# 76. Today Mode Validation

Specifically evaluate:

```text
Is Today opened naturally?

Is the next activity obvious?

Are Directions and Ticket easy enough?

Is the full-day timeline understandable?

Does Today remain useful during schedule changes?
```

---

# 77. Expense Validation

Specifically evaluate:

```text
How quickly can an expense be added?

Are defaults correct?

Are participants easy to select?

Does multi-currency make sense?

Are balances trusted?

Does settlement need explanation?
```

---

# 78. IA Validation

Observe whether users repeatedly look in the wrong place.

Examples:

```text
Bookings searched under Plan?

Checklist searched under Today?

Settlement searched outside Expenses?

Places and Itinerary separation misunderstood?
```

Repeated navigation mistakes indicate IA problems.

Do not solve every discoverability issue with more buttons.

---

# 79. Real Trip Output

After the trip, create:

```text
REAL_TRIP_FINDINGS.md
```

Suggested sections:

```text
What Worked
High-Friction Flows
Missing Capabilities
Unused Features
Mobile Issues
Offline Issues
Financial Issues
Group Collaboration Issues
Priority Fixes
Deferred Ideas
```

This becomes the evidence for post-MVP prioritization.

---

# 80. Phase 9 — MVP Stabilization

## Goal

Fix evidence-based problems before expanding the product.

Prioritize:

```text
P0 correctness
P0 security
P0 financial trust

high-frequency friction
mobile travel friction
group collaboration confusion
performance
accessibility
```

---

# 81. Stabilization Rule

Do not immediately add exciting new features after the real trip.

First ask:

> Is the existing core workflow excellent enough to deserve expansion?

Fix core product friction first.

---

# 82. Potential Stabilization Work

Examples:

```text
reduce expense entry taps

improve itinerary movement

improve trip switching

clarify participant selection

simplify settlement wording

improve offline fallback

improve Today hierarchy

improve booking access

improve empty states
```

Actual work must come from validation evidence.

---

# 83. MVP Release Gate

TripMate MVP is considered ready when all of the following are true.

## Trip Management

Users can:

```text
create
edit
archive
switch trips
```

## Group

Users can:

```text
invite
join
view travelers
leave/remove safely
```

## Planning

Users can:

```text
save places
express preferences
build itinerary
move/skip activities
manage participation
```

## Travel

Users can:

```text
open Today
understand next activity
access booking information
adjust the plan
```

## Preparation

Users can:

```text
manage bookings
manage checklist
```

## Finance

Users can:

```text
record expense
use multiple currencies
split accurately
edit safely
review balances
settle
```

## Mobile

Core workflows are comfortable on a phone.

## Security

Cross-trip unauthorized access is blocked.

## Reliability

Critical financial invariants are automated and passing.

---

# 84. MVP Definition of Done

A feature is not complete merely because its UI works.

Definition of Done:

```text
UX implemented

Responsive behavior verified

Server-side authorization implemented

Input validation implemented

Domain rules implemented

Database constraints where appropriate

Loading state

Empty state

Error state

Automated tests

Accessibility checked

Mobile verified
```

Financial features additionally require:

```text
rounding tests
balance invariant tests
transaction tests
```

---

# 85. Deferred Until After Validation

Do not let these delay MVP:

```text
AI itinerary generation

AI chatbot

Receipt AI

Advanced route optimization

Realtime collaborative editing

Offline write synchronization

Native application

Photo memories

Public profiles

Social feed

Travel marketplace

Flight search

Hotel price comparison

Direct booking

Advanced analytics

Complex permission builder

Real-time friend location
```

---

# 86. Decision Gate C — AI

After real-trip validation, ask:

```text
Where did planning require repetitive manual reasoning?

Where did itinerary changes become difficult?

Did users struggle to combine saved places into days?

Would receipt extraction materially reduce expense friction?
```

Then choose a specific AI use case.

Do not add:

```text
Chat with TripMate
```

without a concrete workflow problem.

---

# 87. Potential AI Priority

Likely order if validated:

```text
1. Receipt extraction
2. Day planning assistance
3. Schedule optimization
4. Contextual replanning
5. Natural-language trip operations
```

Actual priority depends on real usage.

---

# 88. Decision Gate D — PostGIS

Introduce PostGIS if product requirements become:

```text
places near hotel

distance between saved places

nearby restaurant discovery

geographic clustering

location-aware recommendations
```

Do not introduce it solely because PostgreSQL supports it.

---

# 89. Decision Gate E — Offline Writes

Evaluate after real travel.

Ask:

```text
How often were expenses entered without connectivity?

How often were itinerary changes needed offline?

Did users lose work because the network disappeared?
```

If significant:

```text
local mutation queue
sync engine
conflict handling
```

becomes justified.

---

# 90. Decision Gate F — Native App

Build native only when native capabilities or mobile UX limitations justify the cost.

Strong reasons may include:

```text
better offline behavior

push notifications

camera / receipt capture

background location

wallet integration

deeper OS integration

higher mobile usage
```

Do not build native merely because TripMate is a travel product.

The PWA should validate product behavior first.

---

# 91. Native Architecture Path

When justified:

```text
TripMate Web/PWA
        │
        ├──────────────┐
        │              │
        ▼              ▼
    REST API       Native App
        │              │
        └──────┬───────┘
               ▼
      Application Services
               ↓
            Domain
               ↓
          PostgreSQL
```

Core business rules remain server-authoritative.

---

# 92. Post-MVP Product Paths

After stabilization, possible expansion tracks include:

## Smart Planning

```text
Maps
Distances
Route optimization
AI planning
Weather-aware replanning
```

## Better Travel Operations

```text
Offline writes
Notifications
Flight status
Native application
```

## Better Finance

```text
Receipt scanning
Advanced budgets
Expense analytics
Multiple payers
```

## Memories

```text
Trip recap
Favorites
Photos
Visited places
```

Choose based on actual usage rather than building all tracks simultaneously.

---

# 93. Suggested Milestone Names

For project tracking:

```text
M0 — Foundation

M1 — First Trip

M2 — Travel Together

M3 — Plan the Trip

M4 — Travel Day

M5 — Track Spending

M6 — Settle Up

M7 — Travel Ready

M8 — Real Trip

M9 — MVP
```

These names describe user value rather than technical implementation.

---

# 94. Milestone Dependency Map

```text
M0 Foundation
      ↓
M1 First Trip
      ↓
M2 Travel Together
      ↓
M3 Plan the Trip
      ↓
M4 Travel Day
      ↓
M5 Track Spending
      ↓
M6 Settle Up
      ↓
M7 Travel Ready
      ↓
M8 Real Trip
      ↓
M9 MVP
```

Some work can overlap, but avoid implementing later complexity before its dependencies are stable.

---

# 95. Suggested Issue Organization

Git issues can use labels such as:

```text
area:trip
area:members
area:places
area:itinerary
area:today
area:booking
area:checklist
area:expense
area:settlement

type:feature
type:bug
type:ux
type:technical
type:test

priority:p0
priority:p1
priority:p2
```

Avoid excessive label taxonomy.

---

# 96. Feature Issue Template

Each meaningful implementation issue should answer:

```text
Goal

User Story

Scope

Out of Scope

Business Rules

UX Notes

Authorization

Data Changes

Edge Cases

Acceptance Criteria

Tests
```

This structure is particularly useful when coding agents are involved.

---

# 97. Agent Implementation Rule

Coding agents must read relevant source-of-truth documents before modifying a domain.

At minimum:

```text
PROJECT_OVERVIEW.md
FEATURES.md
ARCHITECTURE.md
DATABASE.md
DESIGN_SYSTEM.md
```

plus relevant:

```text
USER_FLOWS.md
INFORMATION_ARCHITECTURE.md
```

depending on the task.

Agents must not silently redefine locked product rules.

---

# 98. Documentation Maintenance

These documents are living architecture/product documentation.

Update documentation when implementation intentionally changes a locked decision.

Do not update documentation merely to describe every small code detail.

Documentation should explain:

```text
why the system works this way
```

not duplicate source code.

---

# 99. Architecture Decision Changes

When a significant technical decision changes:

Example:

```text
Drizzle → another ORM
```

document:

```text
Reason
Tradeoff
Migration impact
Affected documentation
```

Prefer a lightweight ADR for major decisions.

---

# 100. Product Decision Changes

When a locked product rule changes:

Example:

```text
One payer per expense
→ Multiple payers
```

update:

```text
FEATURES.md
DATABASE.md
USER_FLOWS.md
ARCHITECTURE.md
```

where relevant.

Avoid documentation drift.

---

# 101. Realistic Build Priority

If development capacity becomes constrained, preserve this order:

```text
1. Trips
2. Members
3. Places
4. Itinerary
5. Today
6. Expenses
7. Balances
8. Settlement
```

Bookings and checklist remain important but can be simplified before cutting core trip/financial workflows.

Never sacrifice financial correctness to ship more secondary features.

---

# 102. Scope Reduction Strategy

If MVP becomes too large, reduce complexity before removing core workflows.

Examples:

### Keep

```text
Expenses
```

but reduce:

```text
advanced expense filters
```

### Keep

```text
Bookings
```

but reduce:

```text
attachments
provider integrations
```

### Keep

```text
Itinerary
```

but reduce:

```text
drag and drop
advanced optimization
```

### Keep

```text
Places
```

but reduce:

```text
external discovery integration
```

This preserves the end-to-end product.

---

# 103. First Development Target

The first meaningful development milestone should be:

> **M1 — First Trip**

A user should be able to:

```text
Sign In
    ↓
Create Trip
    ↓
Open Trip
    ↓
Edit Trip
    ↓
Return Later
    ↓
Open Same Trip
```

Do not begin implementation with:

```text
AI
Maps
Expense analytics
Advanced itinerary interactions
```

---

# 104. First Product Demo

The first internal demo should show:

```text
Mobile

Sign in
Create Tokyo Trip
Open TripMate trip workspace
See lifecycle-aware home
Edit trip settings


Desktop

Open same trip
See desktop planning shell
```

This validates the foundation before collaborative complexity is added.

---

# 105. Second Product Demo

M2:

```text
Create trip
Invite friend
Friend joins
Both see travelers
Authorization works
```

---

# 106. Third Product Demo

M3:

```text
Save 20 Tokyo places
Mark preferences
Build 5-day itinerary
Move activities
Review on mobile
```

At this point TripMate begins delivering meaningful planning value.

---

# 107. Fourth Product Demo

M4:

```text
Open Day 3
See next activity
Open directions
Open booking
Skip activity
See updated day
```

TripMate now delivers travel-time value.

---

# 108. Fifth Product Demo

M5/M6:

```text
Add restaurant expense
Split between selected travelers
Add taxi expense
Use another currency
Review balances
Settle debts
```

TripMate now supports the full core lifecycle.

---

# 109. Roadmap Success Criterion

The roadmap succeeds if development repeatedly produces:

```text
working product
        ↓
usable workflow
        ↓
real feedback
        ↓
better decision
```

rather than:

```text
more infrastructure
        ↓
more abstraction
        ↓
more documentation
        ↓
no usable trip
```

---

# 110. Foundation Documentation Complete

With this document, the initial product foundation set is complete:

```text
PROJECT_OVERVIEW.md       ✓
USER_FLOWS.md             ✓
FEATURES.md               ✓
INFORMATION_ARCHITECTURE.md ✓
DATABASE.md               ✓
ARCHITECTURE.md           ✓
DESIGN_SYSTEM.md          ✓
ROADMAP.md                ✓
```

These documents now form the initial TripMate source of truth.

---

# 111. Recommended Next Step

Do **not** immediately add another large planning document.

The next step should move from planning into implementation preparation.

Recommended sequence:

```text
1. Review documentation for contradictions
2. Resolve implementation-time decisions for M0/M1
3. Create repository structure
4. Create AGENT_RULES.md
5. Create CURRENT_TASK.md
6. Create initial milestone/issues
7. Bootstrap M0 — Foundation
8. Build M1 — First Trip
```

Before coding M0/M1, resolve only decisions that are immediately required.

Initial decision list:

```text
Authentication provider (resolved: Better Auth — D1)
Package manager
Testing libraries
Local PostgreSQL strategy
Deployment target if needed
Repository conventions
```

Do not resolve later provider decisions such as AI, Maps, or native framework yet.

---

# 112. Final Roadmap Rule

When uncertain about adding a feature, ask:

> Does this help us successfully plan, travel, track spending, or settle a real trip?

If not:

> Defer it until real-trip evidence says otherwise.

---

# 113. Decision Log

Owner-approved decisions. Treat as locked unless the project owner changes them.

| ID | Date | Decision | Documents updated |
|---|---|---|---|
| D1 | 2026-11-03 | **Authentication: Better Auth** replaces Auth.js. Better Auth's user model maps onto the TripMate `users` table; domain entities reference `users.id` only. Resolves Decision Gate A. | AGENT_RULES, CURRENT_TASK, ARCHITECTURE, DATABASE, ROADMAP |
| D2 | 2026-11-03 | **Placeholder members (MVP):** `trip_members.user_id` is nullable; `trip_members.display_name` added. A placeholder can be payer/participant in expenses and settlements, cannot be OWNER, and is claimed via invitation (sets `user_id`; financial history unchanged). A claim is rejected if the user is already a member of the trip. | FEATURES, USER_FLOWS, DATABASE, INFORMATION_ARCHITECTURE, AGENT_RULES |
| D3 | 2026-11-03 | **Activity timezone:** `itinerary_activities.timezone` (nullable IANA). Effective timezone = `activity.timezone ?? trip.timezone`. Today Mode uses the effective timezone. | DATABASE, FEATURES, AGENT_RULES |
| D4 | 2026-11-03 | **Remainder rule:** order participants by `trip_members.created_at` ASC, then `id` ASC; distribute leftover minor units one each from the top. Applies to Equal and Percentage splits. | FEATURES, DATABASE, ARCHITECTURE, AGENT_RULES |
| D5 | 2026-11-03 | **Base shares:** `base_amount = original_amount × exchange_rate`, rounded ROUND_HALF_UP to base currency minor units. Base shares are allocated proportionally to original shares, rounded down, remainder distributed by D4. Invariants: sum(original shares) = original_amount; sum(base shares) = base_amount. | FEATURES, DATABASE, AGENT_RULES |
| D6 | 2026-11-03 | **Settlement suggestions:** greedy matching of largest debtor to largest creditor, ties broken by D4 ordering. Documented as simple and deterministic, not minimum transfers. | FEATURES, DATABASE, AGENT_RULES, ROADMAP, PROJECT_OVERVIEW |
| D7 | 2026-11-03 | **Trip status:** derived from dates in the trip timezone; nullable manual status override (`trips.status_override`). | DATABASE, FEATURES, USER_FLOWS |
| D8 | 2026-11-03 | **Cleanup:** member states ACTIVE/LEFT/REMOVED only; "Not Required" booking status removed; preference wording aligned to INTERESTED/NOT_INTERESTED; itinerary days derived from trip date range (no table); "default expense configuration" removed; budget fields deferred to budget slice; FK added for `activity_suggestions.accepted_activity_id`; stray code-fence attributes removed; this Decision Log added. | FEATURES, USER_FLOWS, PROJECT_OVERVIEW, DATABASE, CURRENT_TASK, AGENT_RULES, ROADMAP |
| D9 | 2026-11-11 | **Member ordering timestamp:** `trip_members.created_at` defaults to `clock_timestamp()` (not `now()`), and members are inserted one row per INSERT, so join order is preserved for the D4 ordering even within one transaction. | ROADMAP, DATABASE |
| D10 | 2026-11-11 | **Email storage:** emails are stored lowercase, enforced by `CHECK (email = lower(email))` plus `UNIQUE(email)`; relies on Better Auth lowercasing emails before writing. | ROADMAP, DATABASE |

Open item arising from D7: the date rule that separates PLANNING from UPCOMING is not yet defined.

Open item: add `UNIQUE(trip_id, id)` on `trip_members` (DATABASE §51) before the expenses milestone, so financial foreign keys can enforce that payer and participants belong to the same trip.