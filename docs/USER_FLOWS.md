# TripMate — User Flows

## 1. Purpose

This document defines how users move through TripMate's core travel workflows.

It focuses on:

- user intent
- actions
- system behavior
- collaboration
- ownership and permissions
- important alternate paths

This document intentionally avoids detailed UI implementation.

---

# 2. User Roles

TripMate initially uses three contextual roles.

## 2.1 Trip Owner

The user who creates the trip.

The owner can:

- edit core trip settings
- invite travelers
- manage members
- manage the shared itinerary
- archive the trip
- manage trip-level permissions

A trip must always have at least one owner.

---

## 2.2 Trip Member

A traveler participating in the trip.

Members can normally:

- view trip information
- save or suggest places
- express preferences
- participate in activities
- create itinerary suggestions
- add expenses
- manage their own expense information
- use shared checklists

Exact destructive permissions may be restricted.

---

## 2.3 Guest / Invited User

A person who has been invited but has not yet joined the trip.

Possible states:

```text
Invited
   ↓
Accepted → Member

or

Declined
```

---

# 3. Trip Lifecycle

A trip moves through four primary states.

```text
PLANNING
   ↓
UPCOMING
   ↓
TRAVELING
   ↓
COMPLETED
```

## Planning

The trip is being organized.

Typical activities:

- inviting travelers
- saving places
- discussing ideas
- building itinerary
- estimating budget

## Upcoming

Major planning is complete and the trip is approaching.

Focus shifts toward:

- confirmations
- bookings
- packing
- final itinerary

## Traveling

The trip is currently active.

The product prioritizes:

- Today Mode
- navigation
- bookings
- itinerary changes
- expense entry

## Completed

Travel has ended.

The product prioritizes:

- expense review
- settlement
- trip summary
- historical reference

Status is derived from the trip dates in the trip timezone. A manual status override remains available so the trip stays recoverable when travel plans change.

---

# 4. First-Time User Flow

```text
Open TripMate
    ↓
Sign Up / Sign In
    ↓
No Trips Yet
    ↓
Create Your First Trip
```

The empty state should immediately explain the product through action rather than onboarding slides.

Primary CTA:

**Create a Trip**

Secondary future possibility:

**Join a Trip**

---

# 5. Create Trip Flow

## User Goal

Create the shared workspace for a new journey.

## Flow

```text
Create Trip
    ↓
Trip Name
    ↓
Destination
    ↓
Start / End Date
    ↓
Base Currency
    ↓
Create
    ↓
Trip Workspace
```

Example:

```text
Trip name:
Tokyo Autumn Trip

Destination:
Tokyo, Japan

Dates:
Nov 15 – Nov 21

Base currency:
JPY
```

Optional configuration can happen after creation.

The creation flow should remain short.

## System Creates

- Trip
- Trip Owner membership
- Itinerary days (derived from the trip date range; not stored)
- Default checklist structure (created once the checklist slice ships in M4; ROADMAP D19)

The user should immediately reach a useful workspace after creation.

---

# 6. Group Invitation Flow

## Owner Flow

```text
Trip
 ↓
Invite
 ↓
Create Invitation
 ↓
Share Link
 ↓
Friend Opens Link
```

Possible future channels:

- link
- email
- messaging apps

The MVP should prioritize a shareable invitation link.

## Recipient Flow

```text
Open Invite
    ↓
View Trip Summary
    ↓
Sign In / Create Account
    ↓
Accept
    ↓
Join Trip
```

If already authenticated:

```text
Open Invite
    ↓
Accept
    ↓
Trip
```

Invitation links should not expose sensitive trip information before authorization.

## Placeholder Traveler Flow

A traveler without an account can still be part of the trip's finances.

```text
Trip
 ↓
Members
 ↓
Add Traveler by Name
 ↓
Placeholder appears in Travelers
```

The placeholder can be selected as payer or participant in expenses and settlements.

A placeholder cannot be an owner and cannot sign in.

## Claim Placeholder Flow

```text
Owner
 ↓
Invite to Claim (placeholder)
 ↓
Share Link
 ↓
Recipient Signs In
 ↓
Accept
 ↓
Placeholder linked to recipient's account
```

The recipient takes over the placeholder's existing membership.

All expenses and settlements already recorded for the placeholder remain unchanged.

If the recipient is already a member of the trip, the claim is rejected.

---

# 7. Trip Home Flow

When planning:

```text
Open Trip
    ↓
Trip Overview
    ├── Upcoming itinerary
    ├── Planning progress
    ├── Saved places
    ├── Travelers
    ├── Budget snapshot
    └── Outstanding tasks
```

When traveling:

```text
Open Trip
    ↓
Today Mode
```

When completed:

```text
Open Trip
    ↓
Trip Summary / Settlement
```

The landing experience therefore adapts to the trip lifecycle.

---

# 8. Save Place Flow

## User Goal

Remember somewhere potentially useful without immediately scheduling it.

```text
Plan
 ↓
Saved Places
 ↓
Add Place
 ↓
Search / Enter Place
 ↓
Select Category
 ↓
Set Priority
 ↓
Save
```

Example:

```text
teamLab Planets

Category:
Activity

Priority:
Must Go

Estimated Cost:
¥4,200

Notes:
Book before trip
```

The saved item now belongs to the trip planning pool.

It is **not automatically part of the itinerary**.

---

# 9. Place Lifecycle

A place and an itinerary activity are intentionally separate concepts.

```text
DISCOVERED
     ↓
SAVED
     ↓
CONSIDERED
     ↓
SCHEDULED
     ↓
VISITED / SKIPPED
```

Not every saved place needs to reach Scheduled.

This prevents the itinerary from becoming a dumping ground for travel ideas.

---

# 10. Group Preference Flow

Members should be able to express interest without modifying the schedule.

For a saved place:

```text
teamLab Planets

Phyo      Interested
Su        Interested
Aung      Not Interested
Min       Interested
```

Initial preference options:

- Interested
- Not Interested

A member who has not chosen is shown as No Response (no preference recorded).

When an activity becomes scheduled, participation becomes:

- Going
- Not Going
- Undecided

Preference and participation are different concepts.

---

# 11. Suggestion Flow

A member may propose an activity.

```text
Member
  ↓
Suggest Activity
  ↓
Select / Add Place
  ↓
Add Optional Date or Time
  ↓
Submit Suggestion
```

Result:

```text
Suggested

teamLab Planets
Suggested by Su

3 Interested
1 Not Interested
```

The suggestion can later be:

```text
Suggestion
    ↓
Accept
    ↓
Add to Itinerary
```

or:

```text
Suggestion
    ↓
Dismiss
```

Dismissal should not necessarily delete the saved place.

---

# 12. Build Itinerary Flow

## Organizer Flow

```text
Trip
 ↓
Plan
 ↓
Itinerary
 ↓
Choose Day
 ↓
Add Activity
```

Activity sources:

```text
Saved Place
Suggested Activity
Custom Activity
```

Then:

```text
Choose Start Time
 ↓
Duration
 ↓
Estimated Cost
 ↓
Participants
 ↓
Booking Status
 ↓
Save
```

Result:

```text
DAY 3

09:00 Breakfast
10:30 Asakusa
14:00 teamLab
17:30 Ginza
20:00 Dinner
```

---

# 13. Flexible Itinerary Changes

Travel plans frequently change.

Users should easily be able to:

- move an activity
- change time
- move to another day
- skip
- restore
- replace
- delete

Example:

```text
Rain tomorrow

teamLab
Day 4 → Day 3
```

A skipped activity should preferably preserve historical context rather than immediately disappearing.

---

# 14. Activity Participation Flow

Scheduled activity:

```text
teamLab
14:00

Going
✓ Phyo
✓ Su
? Min

Not Going
Aung
```

A member changes:

```text
Undecided
    ↓
Going
```

Participant count updates.

This information may later influence shared expenses.

However:

**Activity participation must never automatically create financial obligations.**

Expense participation remains explicitly reviewable.

---

# 15. Booking Flow

An itinerary activity may have a booking.

```text
Activity
 ↓
Add Booking
 ↓
Booking Type
 ↓
Reference
 ↓
Date / Time
 ↓
Optional Attachment / Link
 ↓
Save
```

Booking statuses:

```text
Need to Book
Booked
Cancelled
```

Today Mode should clearly surface relevant bookings.

---

# 16. Checklist Flow

```text
Trip
 ↓
Checklist
 ↓
Group
 ↓
Add Item
```

Example:

```text
Before Travel

☑ Hotel booking
☑ Travel insurance
☐ Buy eSIM
☐ Exchange currency
```

Items may be:

- personal
- shared

Shared items may optionally have an assignee.

Example:

```text
Buy eSIM
Assigned to: Su
```

---

# 17. Start of Travel Flow

When the current date reaches the trip period, TripMate should emphasize traveling mode.

```text
Open TripMate
    ↓
Active Trip Detected
    ↓
Today Mode
```

The user should not need to navigate through planning screens to find today's schedule.

---

# 18. Today Mode Flow

## User Goal

Understand what matters right now.

```text
Open App
   ↓
Today
   ↓
Current / Next Activity
```

Example:

```text
NEXT

teamLab Planets
14:00

Leave in 38 min

Train · 32 min

[Directions]
[Ticket]
```

Below:

```text
UP NEXT

17:30 Ginza
20:00 Dinner
```

Quick actions:

```text
+ Expense
Directions
Booking
Trip Plan
```

---

# 19. Missed / Changed Activity Flow

Example:

The group is running late.

```text
Activity
 ↓
Cannot Make It
 ↓
Choose
 ├── Move Later
 ├── Move to Another Day
 └── Skip
```

TripMate should make schedule changes low-friction.

Future AI may assist with replanning, but manual changes must always remain available.

---

# 20. Add Expense Flow

Expense entry must be optimized for mobile use.

```text
+ Expense
   ↓
Amount
   ↓
Currency
   ↓
Description
   ↓
Paid By
   ↓
Split Between
   ↓
Split Method
   ↓
Save
```

Common defaults should minimize interaction.

Example:

```text
Dinner

¥18,000

Paid by:
Phyo

Split between:
✓ Phyo
✓ Su
✓ Aung
✓ Min

Split:
Equal
```

Result:

```text
¥4,500 each
```

---

# 21. Quick Expense Flow

During travel, common cases should require fewer steps.

```text
+ Expense
 ↓
¥ 4,800
 ↓
Taxi
 ↓
Paid by Me
 ↓
Everyone
 ↓
Save
```

Advanced fields remain available through:

**More options**

---

# 22. Expense Split Methods

## Equal

```text
¥12,000
4 travelers

¥3,000 each
```

## Exact Amount

```text
Phyo   ¥4,000
Su     ¥3,000
Aung   ¥3,000
Min    ¥2,000
```

Validation:

```text
Total splits = Expense total
```

## Percentage

```text
Phyo   40%
Su     20%
Aung   20%
Min    20%
```

Validation:

```text
Total = 100%
```

---

# 23. Multi-Currency Expense Flow

Trip base currency:

```text
JPY
```

Expense:

```text
$100 USD
```

Stored information:

```text
Original amount: 100
Original currency: USD

Rate used:
1 USD = 150 JPY

Base amount:
15,000 JPY
```

The historical conversion should remain stable after the expense is recorded unless deliberately edited.

---

# 24. Expense Editing Rules

Financial history requires stronger controls than normal trip content.

Users should be able to correct mistakes.

However, the system should preserve enough information to understand significant changes.

Important cases:

- payer changed
- amount changed
- participants changed
- expense deleted

Full accounting-grade audit logging is not required for the initial MVP, but the architecture should not make future history tracking impossible.

---

# 25. Balance Calculation Flow

For each expense:

```text
Amount
 ↓
Payer
 ↓
Participant Shares
 ↓
Individual Balance Changes
```

Across the trip:

```text
All Expenses
 ↓
Aggregate Credits / Debts
 ↓
Net Balance Per Member
```

Example:

```text
Phyo   +¥8,000
Su     -¥5,000
Aung   -¥3,000
```

Meaning:

```text
Phyo should receive ¥8,000.
```

---

# 26. Settlement Flow

After travel:

```text
Trip
 ↓
Expenses
 ↓
Balances
 ↓
Settle Up
```

TripMate generates suggested transfers.

Example:

```text
Su → Phyo
¥5,000

Aung → Phyo
¥3,000
```

Member records payment:

```text
Mark Paid
```

Receiver may eventually confirm payment.

MVP may initially use a simpler completed/uncompleted settlement model.

---

# 27. Completed Trip Flow

When travel ends:

```text
Traveling
   ↓
Completed
```

Trip home shifts toward:

```text
Trip Summary

6 days
18 places visited
42 expenses

Total group spend
¥384,200

Your total share
¥92,600

Settlement
✓ Complete
```

Historical trips remain accessible.

---

# 28. Solo Trip Flow

TripMate must remain useful with one traveler.

```text
Create Trip
 ↓
Save Places
 ↓
Build Itinerary
 ↓
Checklist / Bookings
 ↓
Today Mode
 ↓
Track Expenses
 ↓
Complete Trip
```

Group-specific controls should disappear naturally.

For example:

No:

```text
Who paid?
Split between?
Voting
Member participation
Settlement
```

when they provide no value.

This follows the principle of progressive complexity.

---

# 29. Group Trip Flow

For multiple travelers:

```text
Create Trip
 ↓
Invite
 ↓
Collect Ideas
 ↓
Express Preferences
 ↓
Build Shared Plan
 ↓
Assign Tasks
 ↓
Travel
 ↓
Record Shared Expenses
 ↓
Settle
```

Group functionality should feel native to the product rather than added on top of a solo planner.

---

# 30. Permission Model — MVP

Initial model:

| Action | Owner | Member |
|---|---|---|
| View trip | Yes | Yes |
| Edit trip settings | Yes | Limited |
| Invite members | Yes | No |
| Remove member | Yes | No |
| Save place | Yes | Yes |
| Suggest activity | Yes | Yes |
| Express preference | Yes | Yes |
| Add itinerary activity | Yes | Yes* |
| Modify shared itinerary | Yes | Yes* |
| Delete shared activity | Yes | Restricted |
| Add expense | Yes | Yes |
| Edit own expense | Yes | Yes |
| Edit another member's expense | Yes | Restricted |
| View balances | Yes | Yes |
| Create settlement | Yes | Yes |
| Archive trip | Yes | No |

`*` Exact itinerary editing policy should be configurable later if real usage shows the need.

MVP should avoid a complicated role/permission builder.

---

# 31. Destructive Action Principles

Important shared information should not disappear accidentally.

Examples:

- deleting a trip
- removing a traveler
- deleting an expense
- deleting a booked activity

These actions should use confirmation where consequences are significant.

Whenever practical:

```text
Archive / Cancel / Skip
```

is preferred over permanent deletion.

---

# 32. Notifications — MVP Philosophy

TripMate should avoid excessive notifications.

Potential meaningful notifications:

- invited to trip
- itinerary significantly changed
- assigned checklist task
- upcoming booked activity
- settlement requested

Low-value activity should not generate push-style noise.

Detailed notification infrastructure can be introduced after the core product is validated.

---

# 33. Offline / Poor Network Flow

When essential cached information is available:

```text
Network unavailable
    ↓
Open Trip
    ↓
Cached Today Plan
    ↓
Cached Booking References
```

The UI should communicate:

```text
Offline
Last updated 08:42
```

Actions requiring the server should not pretend to have succeeded.

Example:

```text
Expense saved locally
Waiting to sync
```

Offline mutation synchronization may be introduced incrementally because it adds significant technical complexity.

Initial priority:

**Read essential travel information offline first.**

---

# 34. Error Recovery Principles

Travel conditions are unpredictable.

Flows should therefore support recovery.

Examples:

### Failed place lookup

Allow manual place entry.

### Invitation expired

Allow owner to generate another invitation.

### Exchange rate unavailable

Allow manual rate entry.

### No internet

Show cached information where possible.

### Booking unavailable

Keep itinerary information accessible.

### Activity cancelled

Allow move / replace / skip.

---

# 35. Core Flow Priorities

## Priority 1 — Must Be Excellent

```text
Create Trip
Save Place
Build Itinerary
Today Mode
Add Expense
Split Expense
Settlement
```

## Priority 2 — Must Be Good

```text
Invite Members
Group Preferences
Checklist
Bookings
Multi-Currency
```

## Priority 3 — Can Improve After Validation

```text
Advanced permissions
Advanced notifications
Offline writes
Automated planning
AI assistance
Deep route optimization
```

---

# 36. UX Performance Targets

Common travel actions should require minimal interaction.

Target principles:

### Check next activity

```text
Open app
→ immediately visible
```

### Add simple expense

```text
Open
→ + Expense
→ amount
→ category/description
→ Save
```

### Open ticket

```text
Today
→ Ticket
```

### Get directions

```text
Today
→ Directions
```

Planning workflows may contain more detail because they normally happen before the trip.

Travel workflows should remain extremely lightweight.

---

# 37. Primary Navigation Model

The exact visual design remains open, but the conceptual mobile structure is:

```text
TODAY
Current travel context

PLAN
Places + Itinerary

+
Primary quick action

EXPENSES
Spending + Balances

TRIP
Members + Bookings + Checklist + Settings
```

The central action may adapt based on context.

During planning:

```text
+ Place
+ Activity
```

During travel:

```text
+ Expense
```

This behavior should be validated during UX design rather than assumed permanently.

---

# 38. End-to-End MVP Validation Scenario

The product must successfully support the following realistic scenario.

### Scenario

Four friends plan a five-day Tokyo trip.

They:

1. Create the Tokyo trip.
2. Invite three friends.
3. Save 20 potential places.
4. Express preferences.
5. Choose 12 activities.
6. Build a five-day itinerary.
7. Record important bookings.
8. Complete travel checklists.
9. Use Today Mode throughout the trip.
10. Change the itinerary when plans change.
11. Record restaurant, train, taxi, ticket, and hotel expenses.
12. Use JPY and at least one additional currency.
13. Split some expenses among everyone.
14. Split some expenses among only selected members.
15. Finish the trip.
16. Review balances.
17. Settle all debts.

If this flow cannot be completed comfortably, the MVP is not ready.

---

# 39. Product Decisions Established by These Flows

The following decisions should be treated as current product rules:

- A saved place is not automatically an itinerary activity.
- Suggestions and confirmed itinerary activities are different concepts.
- Interest and activity participation are different concepts.
- Activity participation does not automatically determine expense participation.
- Original currency values must be preserved.
- Historical exchange rates should remain stable.
- Solo trips should hide unnecessary group complexity.
- Today Mode becomes the primary experience during active travel.
- Essential travel information receives priority for offline access.
- Financial workflows require stronger integrity than ordinary planning content.
- Destructive actions should be minimized.
- Trip lifecycle should influence the default user experience.

---

# 40. Next Artifact

The next document should be:

**FEATURES.md**

It will translate these user flows into concrete product capabilities and define:

- feature requirements
- MVP priority
- acceptance criteria
- dependencies
- edge cases
- deferred functionality

The relationship should remain:

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
ARCHITECTURE.md
```