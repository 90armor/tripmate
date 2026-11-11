# TripMate — Information Architecture

## 1. Purpose

This document defines how TripMate's product information, screens, and navigation are organized.

It establishes:

- application hierarchy
- mobile navigation
- desktop navigation
- trip workspace structure
- screen inventory
- lifecycle-aware navigation
- global vs trip-scoped areas
- primary actions
- information hierarchy

This document defines structure rather than visual styling.

---

# 2. Core IA Principle

TripMate has two different usage modes.

### Planning Mode

Before travel, users need depth.

They:

- research
- organize places
- build schedules
- coordinate people
- review bookings
- estimate costs

### Travel Mode

During travel, users need speed.

They primarily ask:

> What do I need right now?

Therefore TripMate should not force the same information hierarchy throughout the entire trip lifecycle.

The application should become more operational while a trip is active.

---

# 3. Application Hierarchy

The product has three conceptual levels.

```text
TripMate
│
├── Account Level
│
│   ├── Trips
│   ├── Invitations
│   └── Profile / Settings
│
└── Trip Workspace
    │
    ├── Today
    ├── Plan
    │   ├── Itinerary
    │   └── Places
    │
    ├── Expenses
    │
    └── Trip
        ├── Overview
        ├── Members
        ├── Bookings
        ├── Checklist
        └── Settings
```

The majority of product usage occurs inside a selected Trip Workspace.

---

# 4. Global Scope vs Trip Scope

TripMate must clearly distinguish global application context from trip-specific context.

## Global Scope

Information belonging to the user rather than one specific trip.

Includes:

```text
My Trips
Invitations
Profile
Account Settings
```

Potential future additions:

```text
Notifications
Travel History
Personal Preferences
```

## Trip Scope

Information belonging to one trip.

Includes:

```text
Today
Places
Itinerary
Members
Bookings
Checklist
Expenses
Settlements
Trip Settings
```

Trip-scoped routes should always identify the active trip.

Conceptually:

```text
/trips/{tripId}/...
```

---

# 5. Primary Mobile Navigation

Mobile is the primary UX target.

Recommended bottom navigation:

```text
┌──────────────────────────────┐
│                              │
│        Screen Content        │
│                              │
│                              │
├──────────────────────────────┤
│ Today   Plan   +   Expenses  Trip │
└──────────────────────────────┘
```

Primary destinations:

### Today

Current travel context.

### Plan

Planning workspace containing:

- itinerary
- saved places

### +

Context-aware quick action.

### Expenses

Spending and settlement.

### Trip

Trip administration and supporting information.

---

# 6. Why Today Is a Primary Destination

Today should not be buried inside Itinerary.

During travel, the user's mental model is:

> What are we doing now?

not:

> Open itinerary → choose day → locate current activity.

Therefore:

```text
Today ≠ Itinerary
```

Today is a contextual operational view built from itinerary and booking data.

---

# 7. Today Navigation

## Traveling State

Today becomes the strongest primary destination.

Structure:

```text
Today
│
├── Current / Next Activity
│
├── Departure Context
│
├── Directions
│
├── Booking / Ticket
│
├── Today's Timeline
│
└── Quick Actions
```

Quick actions may include:

```text
Add Expense
Add Activity
View Full Day
Open Booking
```

---

# 8. Today Before the Trip

Before travel, Today still needs a useful state.

It should not show an empty travel dashboard.

Instead:

```text
Tokyo Autumn Trip

Starts in 18 days

Next things to do

☐ Book teamLab
☐ Buy eSIM
☐ Complete itinerary for Day 4

Upcoming booking
Hotel check-in
Nov 15
```

This can be thought of as a lightweight trip dashboard.

The label may remain **Today** for navigation consistency, while its content adapts to lifecycle.

This decision should be validated during UX prototyping.

---

# 9. Today After the Trip

For a completed trip:

```text
Tokyo Autumn Trip
Completed

Trip spending
¥384,200

Your balance
¥4,400 to receive

2 settlements remaining

[ Review Expenses ]
[ Settle Up ]
```

Therefore the same primary destination becomes lifecycle-aware:

```text
Planning  → Trip readiness
Traveling → Today's operations
Completed → Closure / settlement
```

---

# 10. Plan

Plan combines the two most closely related planning concepts:

```text
Plan
│
├── Itinerary
└── Places
```

Recommended internal navigation:

```text
[ Itinerary ] [ Places ]
```

This avoids consuming two bottom-navigation destinations for closely related planning tasks.

---

# 11. Plan — Itinerary

Primary structure:

```text
Plan
└── Itinerary

    Day 1
    Nov 15

    Day 2
    Nov 16

    Day 3
    Nov 17
```

Mobile should prioritize one day at a time.

Example:

```text
‹  Day 2  |  Day 3  |  Day 4  ›

Wednesday · Nov 17

09:00
Breakfast

10:30
Asakusa

14:00
teamLab

17:30
Ginza
```

Avoid rendering the entire multi-day trip as a compressed desktop-style calendar on mobile.

---

# 12. Plan — Places

Structure:

```text
Places
│
├── All
├── Must Go
├── Interested
└── Optional
```

Additional filtering:

```text
Category
Search
```

Place cards should emphasize:

```text
Name
Category
Priority
Group interest
Estimated cost
```

Primary place action:

```text
Add to Itinerary
```

---

# 13. Place Detail

A saved place opens a detail view.

Structure:

```text
Place Detail
│
├── Name
├── Category
├── Address / Location
├── Priority
├── Estimated Cost
├── Notes
├── Member Preferences
└── Actions
```

Primary actions:

```text
Add to Itinerary
Edit
Directions
```

Directions appears only when location information exists.

---

# 14. Add Place Flow

Mobile entry should avoid a large form initially.

Suggested progressive structure:

```text
Add Place
    ↓
Search or Enter Name
    ↓
Basic Details
    ↓
Save
```

Advanced information may be edited afterward.

Core rule:

> Saving an idea should be faster than fully documenting it.

---

# 15. Contextual + Action

The center `+` should not open an unstructured menu with dozens of options.

Context determines the recommended action.

## During Planning

Possible sheet:

```text
Add

Place
Activity
Checklist Item
Expense
```

## During Travel

Order changes:

```text
Add

Expense
Activity
Place
```

Expense becomes the highest-frequency travel action.

## From Expenses

The `+` action may directly open:

```text
Add Expense
```

Contextual behavior must remain predictable.

If testing shows confusion, the center button should become a fixed **Add Expense** action during active travel.

---

# 16. Expenses

Primary expense navigation:

```text
Expenses
│
├── Overview
├── Transactions
└── Balances
```

Possible mobile tabs:

```text
[ Overview ] [ Expenses ] [ Balances ]
```

---

# 17. Expense Overview

Structure:

```text
Trip Spending
¥384,200

Your Spending
¥110,000

Your Share
¥105,600

You Are Owed
¥4,400

Recent Expenses
...

[ Add Expense ]
```

Budget information may appear here when enabled.

---

# 18. Expense Transactions

Chronological list:

```text
NOV 17

Dinner
¥18,000
Paid by Phyo

Taxi
¥4,800
Paid by Su


NOV 16

teamLab
¥16,800
Paid by Aung
```

Filters remain secondary.

Potential filters:

```text
Member
Category
Date
Currency
```

---

# 19. Expense Detail

Structure:

```text
Dinner

¥18,000 JPY

Paid by
Phyo

Split between
Phyo
Su
Aung
Min

¥4,500 each

Date
Nov 17

Category
Food

Notes
...

[ Edit Expense ]
```

Financial information should prioritize clarity over visual decoration.

---

# 20. Balances

Structure:

```text
Your Balance

You are owed
¥4,400

────────────

Su owes you
¥2,800

Aung owes you
¥1,600

────────────

[ Settle Up ]
```

Group-level balance view may follow below.

---

# 21. Settlement

Settlement should be accessed from Balances rather than occupying primary navigation.

```text
Expenses
    ↓
Balances
    ↓
Settle Up
```

Structure:

```text
Suggested Payments

Su → Phyo
¥2,800

Aung → Phyo
¥1,600
```

Completed settlements remain available in history.

---

# 22. Trip Section

The Trip destination contains supporting trip information that does not need permanent primary navigation.

```text
Trip
│
├── Overview
├── Members
├── Bookings
├── Checklist
└── Settings
```

Potential later additions:

```text
Documents
Trip Activity
```

---

# 23. Trip Overview

Trip Overview answers:

> What is this trip?

Structure:

```text
Tokyo Autumn Trip

Tokyo, Japan
Nov 15 – Nov 21
6 days

4 Travelers

JPY

────────────

Members
4

Bookings
6

Checklist
8 / 12 complete

────────────

Trip Settings
```

This differs from Today, which answers:

> What matters right now?

---

# 24. Members

Structure:

```text
Travelers

Phyo
Owner

Su
Member

Aung
Member

Min
Member

Nilar
Not joined yet
[ Invite to Claim ]

────────────

Pending Invitations

Kyaw
Invited

[ Invite Traveler ]
[ Add Traveler Without Account ]
```

Placeholder travelers (no account yet, such as Nilar above) appear in the traveler list so they can be chosen as payer or participant in expenses. They are marked as not joined and offer an invitation to claim the placeholder.

Member detail can initially remain lightweight.

---

# 25. Bookings

Bookings should be presented chronologically.

```text
Bookings

NOV 15

Flight
Phnom Penh → Tokyo
Booked

Hotel
Check-in 15:00
Booked


NOV 17

teamLab
14:00
Booked
```

Filters may later support:

```text
Flights
Accommodation
Activities
Transport
Restaurants
```

---

# 26. Booking Detail

Structure:

```text
teamLab Planets

Nov 17
14:00

Status
Booked

Reference
ABC123

Provider
teamLab

[ Open Booking ]
```

Related itinerary activity should be linked when available.

---

# 27. Checklist

Structure:

```text
Checklist

Before Travel
3 / 4

✓ Hotel
✓ Insurance
✓ Passport
○ Buy eSIM


Packing
2 / 5

✓ Charger
✓ Adapter
○ Clothes
○ Medicine
○ Camera
```

Shared assignment:

```text
Buy eSIM
Su
```

Personal and shared items should remain visually distinguishable.

---

# 28. Trip Settings

Contains lower-frequency configuration.

```text
Trip Settings
│
├── Trip Name
├── Destinations
├── Dates
├── Timezone
├── Base Currency
├── Cover
├── Member Permissions
└── Archive Trip
```

Destructive actions belong at the bottom.

---

# 29. Global Trips Screen

Outside a selected trip:

```text
My Trips

CURRENT

Tokyo Autumn
Nov 15 – Nov 21
Planning


UPCOMING

Bangkok Weekend
Dec 8 – Dec 10


PAST

Seoul
Completed

[ + New Trip ]
```

Trip cards should communicate status clearly.

---

# 30. Trip Switching

Users may belong to multiple trips.

Trip switching should be accessible without returning through many navigation levels.

Potential desktop behavior:

```text
Tokyo Autumn ▾
```

Potential mobile behavior:

Trip title in header opens a trip switcher.

Trip switcher:

```text
Your Trips

✓ Tokyo Autumn
  Bangkok Weekend
  Seoul

────────────

+ New Trip
View All Trips
```

---

# 31. Invitations

Pending invitations may appear:

- on My Trips
- in a global notification area later

Example:

```text
Trip Invitation

Bangkok Weekend
Dec 8 – Dec 10

Invited by Su

[ Join ]
[ Decline ]
```

A dedicated Invitations screen is unnecessary for MVP unless usage requires it.

---

# 32. Profile & Account

Global account area:

```text
Account
│
├── Profile
├── Preferences
└── Sign Out
```

Potential future settings:

```text
Default Currency
Language
Measurement Units
Notification Preferences
```

Avoid overbuilding account settings for MVP.

---

# 33. Mobile Header

Inside a trip, the header should remain compact.

Potential structure:

```text
Tokyo Autumn        ⋯
Day 3 of 6
```

or during planning:

```text
Tokyo Autumn        ⋯
Nov 15 – Nov 21
```

The header should not compete with primary screen content.

---

# 34. Desktop Navigation

Desktop planning benefits from persistent navigation.

Recommended structure:

```text
┌──────────────────┬─────────────────────────────┐
│ TripMate         │                             │
│                  │                             │
│ Tokyo Autumn ▾   │       Main Workspace        │
│                  │                             │
│ Today            │                             │
│ Plan             │                             │
│ Expenses         │                             │
│                  │                             │
│ Trip             │                             │
│   Members        │                             │
│   Bookings       │                             │
│   Checklist      │                             │
│                  │                             │
│ ───────────────  │                             │
│ My Trips         │                             │
│ Profile          │                             │
└──────────────────┴─────────────────────────────┘
```

Desktop navigation may expose secondary destinations that mobile groups under Trip.

---

# 35. Desktop Plan Workspace

Desktop can take advantage of width.

Potential structure:

```text
┌───────────────┬─────────────────────────────┐
│ Saved Places  │ Day 3 — Wednesday          │
│               │                             │
│ teamLab       │ 09:00 Breakfast            │
│ Asakusa       │                             │
│ Ginza         │ 10:30 Asakusa              │
│ Shibuya       │                             │
│               │ 14:00 teamLab              │
│               │                             │
│               │ 17:30 Ginza                │
└───────────────┴─────────────────────────────┘
```

This allows planning via richer interactions while maintaining the same underlying information architecture.

Drag-and-drop may be evaluated later.

It is not required for MVP.

---

# 36. Mobile vs Desktop Principle

The two experiences share:

```text
Same Data
Same Domain Model
Same Business Rules
```

but may use different compositions.

Example:

### Mobile

```text
One Day
→ Vertical Timeline
```

### Desktop

```text
Saved Places + Day Timeline
```

Responsive design should optimize the task rather than preserve identical layouts.

---

# 37. Lifecycle-Aware Navigation

The navigation destinations remain mostly stable.

What changes is emphasis.

## Planning

```text
Today
PLAN ← high emphasis
+
Expenses
Trip
```

## Traveling

```text
TODAY ← highest emphasis
Plan
+ Expense
Expenses
Trip
```

## Completed

```text
Today / Summary
Plan
+
EXPENSES ← settlement emphasis
Trip
```

Avoid moving navigation destinations unpredictably.

Change content emphasis rather than rearranging the entire navigation.

---

# 38. Screen Inventory

## Global

```text
Authentication
My Trips
Create Trip
Join Trip
Profile
```

## Today

```text
Trip Readiness
Travel Today
Completed Trip Summary
```

These may be lifecycle states of one route rather than separate pages.

## Plan

```text
Itinerary
Saved Places
Place Detail
Add/Edit Place
Activity Detail
Add/Edit Activity
Suggestions
```

## Expenses

```text
Expense Overview
Expense List
Expense Detail
Add/Edit Expense
Balances
Settlement
Settlement History
```

## Trip

```text
Trip Overview
Members
Invite Member
Bookings
Booking Detail
Add/Edit Booking
Checklist
Trip Settings
```

---

# 39. Route Concept

Exact framework implementation will be defined later.

Conceptually:

```text
/
│
├── /trips
├── /profile
│
└── /trips/{tripId}
    │
    ├── /today
    │
    ├── /plan
    │   ├── /itinerary
    │   └── /places
    │
    ├── /expenses
    │   ├── /transactions
    │   ├── /balances
    │   └── /settlements
    │
    ├── /members
    ├── /bookings
    ├── /checklist
    └── /settings
```

Nested detail routes may follow:

```text
/places/{placeId}
/activities/{activityId}
/expenses/{expenseId}
/bookings/{bookingId}
```

---

# 40. Modal vs Page Principle

Do not use modal dialogs for every workflow.

## Good modal/sheet candidates

Small, focused actions:

```text
Choose Participants
Select Currency
Confirm Delete
Quick Add
Change Activity Status
```

## Better as page/full-screen mobile flow

Complex actions:

```text
Create Trip
Edit Activity
Add Complex Expense
Place Detail
Booking Detail
Settlement Review
```

On mobile, bottom sheets may be used for lightweight contextual actions.

---

# 41. Primary Action Principle

Each screen should have one obvious primary action whenever possible.

Examples:

### Places

```text
+ Add Place
```

### Itinerary

```text
+ Add Activity
```

### Expenses

```text
+ Add Expense
```

### Members

```text
Invite Traveler
```

### Checklist

```text
+ Add Item
```

Avoid giving equal visual weight to many unrelated actions.

---

# 42. Back Navigation

Mobile navigation must preserve predictable back behavior.

Example:

```text
Places
 ↓
Place Detail
 ↓
Edit Place
```

Back:

```text
Edit Place
→ Place Detail
→ Places
```

Bottom navigation switches product sections and should not behave like browser back.

---

# 43. Deep Linking

Architecture should support links directly to important entities.

Examples:

```text
Trip Invitation
Specific Activity
Booking
Expense
```

This becomes particularly important when notifications and native mobile applications are introduced later.

---

# 44. Empty States

Every primary section must work before data exists.

Examples:

## Places

```text
No places saved yet.

Save restaurants, attractions,
and activities you're considering.

[ Add Place ]
```

## Itinerary

```text
Nothing planned for Day 2.

[ Add Activity ]
```

## Expenses

```text
No expenses yet.

Trip spending will appear here.

[ Add Expense ]
```

## Bookings

```text
No bookings added.

Keep important reservation
details together.

[ Add Booking ]
```

Empty states should teach through action.

---

# 45. Loading States

Travel usage may occur on slow networks.

Avoid blank screens.

Use:

- lightweight skeletons where appropriate
- cached data when safe
- clear loading feedback

Today Mode should prioritize showing cached useful information rather than blocking the whole page on secondary network requests.

---

# 46. Error States

Errors should preserve user context.

Example:

```text
Couldn't refresh the itinerary.

Showing the version saved at 08:42.

[ Try Again ]
```

Avoid generic:

```text
Something went wrong.
```

when a more useful recovery action is known.

---

# 47. Offline State

Global offline indicator should be subtle but visible.

Example:

```text
Offline · Last updated 08:42
```

Today Mode should still expose cached:

```text
Activities
Times
Addresses
Booking references
```

where available.

---

# 48. Information Priority During Travel

When actively traveling, prioritize:

```text
1. What is next?
2. When?
3. Where?
4. How do I get there?
5. Do I need a booking/ticket?
6. Who is going?
7. What comes afterward?
8. Can I quickly record spending?
```

Information such as:

```text
Trip description
Historical planning discussions
Advanced analytics
Member administration
```

should not compete with these tasks.

---

# 49. Information Priority During Planning

Before travel:

```text
1. Where should we go?
2. What does the group want?
3. Which day fits?
4. What needs booking?
5. How much might it cost?
6. What remains unfinished?
```

This is why Plan receives greater prominence before travel.

---

# 50. Information Priority After Travel

After travel:

```text
1. Are all expenses entered?
2. Who owes whom?
3. What remains unpaid?
4. Is settlement complete?
5. What happened during the trip?
```

Expense closure becomes the main operational task.

---

# 51. Search Strategy

MVP does not require global search.

Search should initially exist within relevant contexts.

Examples:

```text
Places → Search places
Expenses → Search/filter transactions
```

Global search may be introduced later if the volume of trip information justifies it.

---

# 52. Notification Architecture

Notifications are not a primary navigation destination for MVP.

Important events can initially surface contextually.

Examples:

```text
Pending trip invitation
Checklist assignment
Settlement outstanding
```

A dedicated notification center should only be added when notification volume justifies it.

---

# 53. Badge Strategy

Badges should communicate actionable information rather than decoration.

Good examples:

```text
Trip
2

→ 2 outstanding tasks
```

```text
Expenses
1

→ settlement requires attention
```

Avoid badges for low-value informational updates.

---

# 54. Progressive Disclosure

TripMate contains potentially complex travel and financial information.

The interface should reveal complexity only when needed.

Example expense entry:

Initial:

```text
Amount
Description
Paid By
Split Between
```

Advanced:

```text
Exchange Rate
Exact Split
Percentage Split
Notes
Date Override
```

This principle should be used throughout the product.

---

# 55. IA Rules to Preserve

The following structural rules should remain stable unless user testing demonstrates a better model.

1. **Today is not simply another itinerary view.**
2. **Places and Itinerary belong under one planning concept.**
3. **Expenses remain a primary product destination.**
4. **Settlement lives within Expenses.**
5. **Members, Bookings, Checklist, and Settings belong under Trip on mobile.**
6. **Global account navigation and trip navigation remain conceptually separate.**
7. **Lifecycle changes content emphasis, not the entire navigation structure.**
8. **Mobile and desktop may use different compositions of the same information.**
9. **Complex forms should not default to modal dialogs.**
10. **Essential travel information receives priority during poor connectivity.**

---

# 56. Proposed Mobile Sitemap

```text
TripMate
│
├── My Trips
│   ├── Create Trip
│   └── Join Trip
│
└── Active Trip
    │
    ├── Today
    │
    ├── Plan
    │   ├── Itinerary
    │   │   ├── Activity Detail
    │   │   └── Add / Edit Activity
    │   │
    │   └── Places
    │       ├── Place Detail
    │       └── Add / Edit Place
    │
    ├── Expenses
    │   ├── Overview
    │   ├── Transactions
    │   │   └── Expense Detail
    │   ├── Add / Edit Expense
    │   └── Balances
    │       └── Settlement
    │
    └── Trip
        ├── Overview
        ├── Members
        │   └── Invite
        ├── Bookings
        │   ├── Booking Detail
        │   └── Add / Edit Booking
        ├── Checklist
        └── Settings
```

---

# 57. Proposed Desktop Sitemap

```text
TripMate
│
├── My Trips
├── Profile
│
└── Trip Workspace
    │
    ├── Today
    │
    ├── Plan
    │   ├── Itinerary
    │   └── Places
    │
    ├── Expenses
    │   ├── Overview
    │   ├── Transactions
    │   ├── Balances
    │   └── Settlements
    │
    ├── Members
    ├── Bookings
    ├── Checklist
    └── Settings
```

Desktop exposes more secondary destinations because persistent sidebar space is available.

This does not change the underlying product model.

---

# 58. MVP Navigation Decision

For initial design work, use:

```text
Mobile

Today
Plan
+
Expenses
Trip
```

and:

```text
Desktop

Today
Plan
Expenses

Trip
 ├ Members
 ├ Bookings
 ├ Checklist
 └ Settings
```

This structure should be treated as the baseline rather than an irreversible final decision.

The first real-trip usability test should specifically evaluate whether:

- Today deserves permanent primary navigation
- Plan correctly combines Places and Itinerary
- the contextual `+` is understandable
- Trip becomes too crowded
- Expenses deserves permanent primary navigation

---

# 59. IA Validation Scenario

A user should be able to perform this sequence without uncertainty about where features live:

```text
Open TripMate
 ↓
Select Tokyo Trip
 ↓
Save teamLab
 ↓
Add teamLab to Day 3
 ↓
Invite Su
 ↓
Add booking reference
 ↓
Travel begins
 ↓
Open Today
 ↓
Open teamLab ticket
 ↓
Add taxi expense
 ↓
Review balance
 ↓
Settle after trip
```

Expected locations:

```text
Save teamLab
→ Plan → Places

Schedule teamLab
→ Plan → Itinerary

Invite Su
→ Trip → Members

Booking
→ Trip → Bookings

Today's activity
→ Today

Taxi expense
→ Expenses / +

Balance
→ Expenses → Balances

Settlement
→ Expenses → Balances → Settle Up
```

If users repeatedly search in the wrong section, the information architecture should be reconsidered before adding more features.

---

# 60. Next Artifact

The next document is:

**DATABASE.md**

It should translate the established product model into a PostgreSQL domain model covering:

- users
- trips
- trip memberships
- invitations
- destinations
- saved places
- preferences
- itinerary activities
- participants
- bookings
- checklists
- currencies
- expenses
- expense participants
- expense splits
- settlements
- lifecycle/status fields
- timestamps
- financial precision
- timezone strategy
- soft deletion / history strategy
- constraints and indexes

The document sequence remains:

```text
PROJECT_OVERVIEW.md
        ↓
USER_FLOWS.md
        ↓
FEATURES.md
        ↓
INFORMATION_ARCHITECTURE.md   ← Current
        ↓
DATABASE.md
        ↓
ARCHITECTURE.md
        ↓
DESIGN_SYSTEM.md
        ↓
ROADMAP.md
```