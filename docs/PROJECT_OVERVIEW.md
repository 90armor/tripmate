# TripMate — Project Overview

## 1. Product Summary

TripMate is a **mobile-first collaborative travel planning and trip management application** designed to support a trip from the first idea through the final expense settlement.

Instead of travelers switching between Maps, Notes, spreadsheets, messaging apps, booking confirmations, calendars, and expense-splitting tools, TripMate provides one shared workspace for the entire journey.

The product will launch as a **web-first application optimized for mobile use**, with the architecture designed to support a future native mobile application without rebuilding the core backend or domain logic.

### Product Direction

**Web-first. Mobile-first. Native-ready.**

### Working Tagline

> Plan together. Travel smoothly. Settle easily.

---

# 2. Problem Statement

Planning a trip usually requires several disconnected tools.

Travelers commonly use:

- Maps for discovering and saving places
- Notes or spreadsheets for itinerary planning
- Messaging apps for discussing plans
- Booking platforms for reservations
- Calendar apps for schedules
- Currency converters while traveling
- Expense-splitting tools after payments
- Cloud storage for tickets and documents

This creates fragmented information and several recurring problems.

### Before the trip

Travel ideas become scattered across chats, screenshots, social media posts, Maps links, and notes.

Group members may not know:

- which places are confirmed
- which activities are only suggestions
- who wants to participate
- whether tickets have been booked
- how much the trip is expected to cost

### During the trip

Travelers primarily need immediate information such as:

- What are we doing next?
- When should we leave?
- How do we get there?
- Where is the ticket?
- Who is joining?
- How much did we just spend?

Traditional itinerary planners can become too complicated for this situation.

### After the trip

Shared expenses become another problem.

Travelers need to determine:

- who paid
- who participated
- how expenses should be split
- how currency conversion should be handled
- who owes whom
- how to settle balances with a simple set of payments

TripMate aims to connect these stages into one continuous workflow.

---

# 3. Product Vision

TripMate should become the travel workspace a person opens when they begin thinking about a trip and continues using until the trip is completely settled.

The product should support:

**Dream → Plan → Collaborate → Book → Travel → Track → Settle → Remember**

The goal is not simply to create itineraries.

The goal is to make the **entire lifecycle of a personal or group trip easier to manage**.

---

# 4. Primary Target Users

## 4.1 Solo Traveler

A traveler planning and managing their own trip.

Primary needs:

- save interesting places
- organize itinerary
- estimate budget
- manage bookings
- maintain checklists
- track spending
- access today's plan quickly

---

## 4.2 Group Traveler

Friends, couples, families, or small groups traveling together.

Primary needs:

- shared planning
- suggestions and voting
- shared itinerary
- activity participation
- shared expenses
- expense settlement

This is the primary target scenario for TripMate.

---

## 4.3 Trip Organizer

The person primarily responsible for coordinating a group trip.

Primary needs:

- create and configure the trip
- invite travelers
- organize suggestions
- build the itinerary
- monitor bookings
- coordinate participants
- understand the overall budget

A traveler may simultaneously be both an organizer and a participant.

---

# 5. Core User Journey

```text
Trip idea
    ↓
Create Trip
    ↓
Invite Travelers
    ↓
Discover / Save Places
    ↓
Discuss / Vote
    ↓
Build Itinerary
    ↓
Estimate Budget
    ↓
Manage Bookings & Checklist
    ↓
──────────── TRIP STARTS ────────────
    ↓
Today Mode
    ↓
Navigate / Participate / Spend
    ↓
Record Expenses
    ↓
Adjust Plans When Needed
    ↓
──────────── TRIP ENDS ──────────────
    ↓
Review Expenses
    ↓
Calculate Balances
    ↓
Settle Payments
    ↓
Trip Complete
```

---

# 6. Core Product Modules

## 6.1 Trips

A Trip is the primary workspace.

A trip contains:

- title
- destination(s)
- start date
- end date
- timezone
- base currency
- travelers
- trip cover
- trip status

Initial statuses:

- Planning
- Upcoming
- Traveling
- Completed

---

# 6.2 Explore & Saved Places

Travelers can collect potential destinations before deciding exactly when to visit them.

Saved items may include:

- attractions
- restaurants
- cafés
- activities
- shopping
- nightlife
- accommodation ideas
- transportation points
- souvenir locations
- custom places

Items may be classified as:

- Must Go
- Interested
- Optional

Group members should eventually be able to express preferences without immediately modifying the itinerary.

A saved place can later be converted into an itinerary activity.

---

# 6.3 Collaborative Planning

Group planning should not require every suggestion to immediately become part of the official itinerary.

A potential flow is:

```text
Suggested
    ↓
Group Feedback
    ↓
Approved
    ↓
Scheduled
```

Travelers may indicate:

- Interested
- Not Interested

The product should support collaboration without making the itinerary chaotic.

---

# 6.4 Itinerary

The itinerary organizes the trip day by day.

Each itinerary item may contain:

- start time
- optional end time
- place
- activity
- notes
- expected cost
- transportation information
- booking status
- participants

Mobile presentation should favor a chronological timeline rather than a spreadsheet-style schedule.

Example:

```text
DAY 3 — TOKYO

09:00
Breakfast
Fuglen Tokyo
¥1,500

   ↓
24 min train

10:30
Asakusa
2 hours

   ↓

14:00
teamLab Planets
Ticket booked
4 travelers
```

The itinerary should remain flexible.

TripMate should avoid encouraging users to over-schedule every minute of a trip.

---

# 6.5 Today Mode

Today Mode is the primary interface while actively traveling.

Its purpose is to answer:

> What do I need right now?

It should prioritize:

- next activity
- departure time
- directions
- booking/ticket access
- upcoming activities
- participants
- quick expense entry

Example:

```text
TOKYO
DAY 3 OF 6

NEXT

teamLab Planets
14:00

Leave in 38 minutes

32 min by train

[ Directions ] [ Ticket ]

UP NEXT

17:30  Ginza
20:00  Dinner

[ + Expense ]
```

Today Mode should require significantly less interaction than the planning interface.

---

# 6.6 Expenses

TripMate should support both personal and shared travel expenses.

An expense may contain:

- date/time
- description
- category
- original amount
- original currency
- exchange rate
- base currency amount
- payer
- participants
- split method
- notes

Initial split methods:

- Equal
- Exact Amount
- Percentage

Potential categories:

- Accommodation
- Food
- Transportation
- Activities
- Shopping
- Flights
- Fees
- Other

---

# 6.7 Multi-Currency

International travel frequently involves multiple currencies.

TripMate should preserve:

1. original amount
2. original currency
3. conversion rate used
4. converted amount in the trip's base currency

Historical expenses must not change unexpectedly when exchange rates change later.

---

# 6.8 Settlement

At the end of the trip, TripMate calculates each traveler's net balance.

Instead of requiring repayment for every individual expense, the system should attempt to produce a simpler settlement.

Example:

```text
You are owed ¥4,400

Su → You
¥2,800

Aung → You
¥1,600
```

Users should be able to mark settlements as completed.

---

# 6.9 Checklist

Trips may contain shared and personal checklist items.

Examples:

### Before travel

- Passport
- Visa
- Travel insurance
- SIM/eSIM
- Currency
- Hotel confirmation
- Airport transfer

### Packing

- Clothing
- Charger
- Power adapter
- Medication
- Camera

### Trip-specific

Users may create their own checklist groups and items.

---

# 6.10 Documents & Bookings

TripMate should provide structured references to important travel information such as:

- flight details
- hotel bookings
- activity reservations
- tickets
- insurance
- transportation reservations

Sensitive document storage should not be expanded unnecessarily during the initial MVP.

Security and privacy requirements must be reviewed before supporting highly sensitive documents such as full passport copies.

---

# 7. Mobile-First Product Strategy

TripMate will initially be delivered as a web application.

However, the primary UX target is mobile.

The product should therefore not be designed as:

> Desktop UI → shrink everything for mobile.

Instead:

> Mobile travel experience → expand into a richer desktop planning workspace.

### Mobile

Optimized for:

- Today Mode
- itinerary viewing
- navigation
- quick expense entry
- checking bookings
- lightweight collaboration

Potential navigation:

```text
Today
Plan
+
Expenses
Trip
```

### Desktop

Optimized for:

- itinerary building
- destination research
- budget planning
- managing many saved places
- reviewing expenses
- trip administration

---

# 8. PWA Direction

The web application should be designed with Progressive Web App capabilities in mind.

Potential capabilities include:

- install to home screen
- mobile app-like navigation
- cached itinerary
- cached essential booking information
- graceful poor-network behavior

Offline support should prioritize essential travel information rather than attempting to make the entire application offline-capable.

---

# 9. Native Application Strategy

A native mobile application is **not part of the initial MVP**.

The system should nevertheless avoid architecture decisions that make a native client difficult later.

Target evolution:

```text
                 ┌── Web / PWA
                 │
Shared Backend ──┤
                 │
                 └── Native Mobile
```

The native application should reuse the same:

- authentication model
- APIs
- database
- business rules
- expense calculations
- itinerary model

---

# 10. Technical Baseline

Initial technology direction:

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Mobile-first responsive design

### Backend

Begin as a modular monolith.

The application should maintain clear domain boundaries even if the web application and server initially live in the same codebase.

Potential domains:

```text
Auth
Users
Trips
Trip Members
Places
Itinerary
Expenses
Settlements
Checklists
Bookings
```

### Database

**PostgreSQL**

Core business information should use relational modeling.

Flexible external/provider metadata may use PostgreSQL `JSONB` where appropriate.

Potential future extensions:

- PostGIS — geographic queries
- pgvector — AI/search use cases

These extensions should be introduced only when a concrete product requirement justifies them.

---

# 11. Product Principles

## 11.1 Mobile During Travel

The most important information should be reachable quickly with one hand and minimal interaction.

---

## 11.2 Planning Without Chaos

Collaboration should not mean every traveler can accidentally destroy the shared itinerary.

Suggestions and confirmed plans should remain conceptually separate.

---

## 11.3 Progressive Complexity

Simple trips should remain simple.

Advanced capabilities should appear only when needed.

---

## 11.4 One Source of Truth

Trip information should not require users to repeatedly search through chat messages, screenshots, spreadsheets, and notes.

---

## 11.5 Flexible, Not Over-Scheduled

Travel plans change.

The system should make moving, skipping, replacing, or adding activities easy.

---

## 11.6 Group-Aware by Design

Group travel should be a first-class product concept rather than a single-user planner with sharing added afterward.

---

## 11.7 Financial Accuracy

Expense and settlement calculations must favor correctness and auditability over visual simplicity.

Money-related calculations should be deterministic and testable.

---

## 11.8 Offline-Aware

Travelers frequently experience poor connectivity, roaming restrictions, or unreliable Wi-Fi.

Essential trip information should remain usable whenever practical.

---

# 12. MVP Scope

## Included

- Authentication
- Create/edit/archive trip
- Trip members
- Invitation flow
- Destination information
- Trip currencies
- Saved places
- Place categories
- Place priority
- Basic group preferences
- Day-by-day itinerary
- Activity participation
- Estimated activity costs
- Booking references
- Trip checklist
- Expense entry
- Shared expenses
- Multiple currencies
- Expense splitting
- Balance calculation
- Settlement
- Today Mode
- Mobile-first responsive UI

---

# 13. Explicitly Out of Scope for Initial MVP

The first version should **not** attempt to become a complete travel marketplace.

Initially excluded:

- flight search engine
- hotel search engine
- direct flight booking
- direct hotel booking
- activity marketplace
- social media feed
- public traveler profiles
- travel influencer features
- complex recommendation engine
- AI chatbot
- automatic itinerary generation
- advanced route optimization
- photo social network
- full native mobile application

These features may be evaluated after real usage validates the core workflow.

---

# 14. Future AI Opportunities

AI should solve concrete travel problems rather than exist only as a chatbot.

Potential future capabilities:

### Smart itinerary generation

Generate a suggested day from:

- saved places
- opening hours
- travel distance
- traveler preferences
- available time
- budget

### Itinerary optimization

Reduce unnecessary travel between activities.

### Contextual replanning

Examples:

- activity cancelled
- traveler running late
- weather changed
- attraction closed

### Receipt extraction

Extract:

- merchant
- amount
- currency
- date
- expense category

from a receipt.

### Natural-language planning

Example:

> Move TeamLab to Thursday afternoon and find somewhere for dinner nearby.

The system translates the request into structured itinerary changes.

AI features should be introduced only after the underlying structured trip model is reliable.

---

# 15. Success Criteria for MVP

The first version is successful when a real group can complete an international trip while using TripMate as its primary trip-management tool.

A successful test trip should be able to:

1. Create the trip.
2. Invite travelers.
3. Collect places.
4. Decide what to visit.
5. Build the itinerary.
6. Track important bookings.
7. Use the mobile interface during the trip.
8. Record shared expenses.
9. Calculate everyone's balances.
10. Complete settlement after the trip.

The strongest validation question is:

> Could we complete the trip without maintaining a separate itinerary spreadsheet or expense spreadsheet?

If the answer is yes, the core product is providing meaningful value.

---

# 16. Development Philosophy

TripMate should be developed vertically rather than by creating disconnected technical layers.

Instead of:

```text
Build every database table
→ Build every API
→ Build every UI
```

prefer:

```text
Create Trip
→ make it usable end-to-end

Invite Member
→ make it usable end-to-end

Save Place
→ make it usable end-to-end

Build Itinerary
→ make it usable end-to-end

Record Expense
→ make it usable end-to-end
```

Each milestone should leave the product in a working state.

---

# 17. Initial Product Roadmap

### Phase 1 — Foundation

- Product definition
- User journeys
- MVP feature specification
- Domain model
- Database design
- Technical architecture
- UX information architecture

### Phase 2 — Project Foundation

- Application setup
- PostgreSQL setup
- Authentication
- base design system
- responsive application shell
- testing infrastructure

### Phase 3 — Trip Planning

- Trips
- members
- saved places
- collaboration
- itinerary

### Phase 4 — Travel Operations

- Today Mode
- checklist
- bookings
- mobile travel UX
- offline-aware behavior

### Phase 5 — Money

- expenses
- multi-currency
- splits
- balances
- settlements

### Phase 6 — Real Trip Validation

Use TripMate for an actual trip.

Record:

- friction
- unnecessary steps
- missing information
- confusing UI
- features that were never used

Product decisions after this point should be influenced strongly by real usage.

### Phase 7 — Expansion

Evaluate:

- maps/location intelligence
- weather
- smarter itinerary planning
- AI assistance
- deeper offline support
- native mobile application

---

# 18. Current Decisions

The following decisions are considered established unless a later product requirement provides a strong reason to revisit them:

- Web-first launch
- Mobile-first UX
- Native application later
- PWA-ready architecture
- Next.js
- TypeScript
- Tailwind CSS
- PostgreSQL
- Modular-monolith starting architecture
- Group travel as a first-class use case
- Expense sharing as a core feature
- AI is not required for MVP
- Real-trip usage is the primary validation method

---

# 19. Next Design Artifacts

The next project documents should be developed in this order:

```text
PROJECT_OVERVIEW.md        ← current source of truth

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
        ↓
DESIGN_SYSTEM.md
        ↓
ROADMAP.md
```

Each document should reference this product vision and avoid introducing features that contradict the agreed MVP scope without explicitly documenting the decision.