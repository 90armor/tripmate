# TripMate — Design System

## 1. Purpose

This document defines the visual, interaction, and responsive design foundation for TripMate.

TripMate is a travel product used in two very different environments:

1. **Planning at home**
2. **Acting quickly while traveling**

The design system must support both without becoming two separate products.

The system should feel:

> Calm, clear, lightweight, useful, and travel-native.

It should not feel like:

- an enterprise admin dashboard
- a spreadsheet replacement
- a banking application
- a generic SaaS template
- a social media application
- a visually overloaded travel marketplace

---

# 2. Core Design Principle

The primary principle is:

> **Clarity under movement.**

TripMate may be used while the traveler is:

- walking
- standing in a station
- carrying luggage
- outdoors
- using one hand
- switching between apps
- dealing with weak connectivity
- checking something quickly

Therefore important travel information must be:

- immediately recognizable
- comfortably tappable
- visually prioritized
- concise
- resilient to distraction

---

# 3. Product Personality

TripMate should communicate:

```text
Friendly
Calm
Modern
Reliable
Collaborative
Practical
Travel-oriented
```

Avoid extremes such as:

```text
Corporate
Luxury-heavy
Childish
Gamified
Financial-app sterile
Overly futuristic
```

---

# 4. Visual Direction

Recommended visual direction:

> **Warm modern utility**

Characteristics:

- generous but controlled whitespace
- clean typography
- subtle depth
- soft surfaces
- strong information hierarchy
- restrained use of color
- large touch-friendly controls
- travel photography only where meaningful
- minimal decorative effects

TripMate should feel modern without depending on visual trends that reduce usability.

---

# 5. Brand vs Product Tokens

Brand identity is not yet finalized.

Therefore separate:

```text
Brand Tokens
```

from:

```text
Semantic Product Tokens
```

Example:

```text
--brand-primary
```

may change during branding.

But:

```text
--color-danger
--color-success
--surface-primary
--text-secondary
```

should remain conceptually stable.

Components should consume semantic roles whenever possible.

---

# 6. Color Philosophy

Color should communicate:

1. hierarchy
2. state
3. action
4. feedback

Color should not become decoration everywhere.

The UI should remain understandable in grayscale.

---

# 7. Semantic Color Roles

Required roles:

```text
Background
Surface
Elevated Surface

Primary Text
Secondary Text
Muted Text

Border
Strong Border

Primary Action
Primary Action Hover
Primary Action Pressed

Success
Warning
Danger
Information

Focus
Disabled
```

Actual brand values should be chosen during visual implementation.

---

# 8. Travel Accent Direction

TripMate should eventually use one recognizable brand accent.

Possible direction:

- fresh blue
- blue-green
- teal
- restrained emerald

These naturally fit:

- navigation
- exploration
- travel
- maps
- reliability

However:

> Do not lock the brand to a specific hex value yet.

Brand exploration should happen after the structural UX is validated.

---

# 9. Status Colors

Status colors must have consistent semantic meaning.

### Success

Use for:

```text
Booked
Completed
Paid
Settled
Checklist complete
```

### Warning

Use for:

```text
Needs booking
Upcoming attention
Incomplete
```

### Danger

Use for:

```text
Cancelled
Failed
Destructive actions
Overdue critical task
```

### Information

Use for:

```text
Travel information
Neutral operational status
```

Never communicate state through color alone.

Use:

```text
icon + label + color
```

where appropriate.

---

# 10. Expense Colors

Avoid excessive red/green financial styling.

Examples:

```text
You owe ¥4,000
```

and:

```text
You are owed ¥4,000
```

should primarily rely on wording and hierarchy.

Color may reinforce meaning but should not be the only distinction.

This improves accessibility and avoids making the expense experience feel like a trading application.

---

# 11. Surface System

TripMate should use a simple surface hierarchy.

## Level 0 — App Background

Main application canvas.

## Level 1 — Content Surface

Used for:

- cards
- grouped content
- form sections

## Level 2 — Elevated Surface

Used sparingly for:

- bottom sheets
- popovers
- dialogs
- floating controls

Avoid deeply nested card-inside-card compositions.

---

# 12. Glassmorphism

Do not use glassmorphism as a general content style.

Potential limited usage:

- floating mobile navigation treatment
- lightweight overlay
- visual travel hero treatment

Only if:

- text contrast remains excellent
- performance remains good
- content remains readable outdoors

Primary content surfaces should remain solid.

---

# 13. Border Philosophy

Use subtle borders for structural separation.

Avoid:

- heavy borders around every section
- excessive outlined cards
- excessive dividers

Hierarchy should primarily come from:

```text
spacing
typography
surface
```

Borders support those signals.

---

# 14. Radius System

Recommended radius scale:

```text
Small      8px
Medium    12px
Large     16px
XL        20px
Pill      999px
```

Usage:

### 8px

- compact controls
- small badges

### 12px

- inputs
- buttons
- small cards

### 16px

- main cards
- itinerary blocks

### 20px

- larger mobile surfaces
- sheets where appropriate

Avoid assigning a different radius to every component.

---

# 15. Shadow System

Use shadows sparingly.

Most content should rely on:

```text
surface + border + spacing
```

rather than strong shadows.

Shadows are more appropriate for:

- floating navigation
- bottom sheets
- dialogs
- floating action controls

Avoid dramatic SaaS-style card shadows.

---

# 16. Typography

Typography should optimize:

- mobile readability
- numbers
- times
- currencies
- place names
- multilingual travel content

Recommended initial font direction:

> **Inter or Geist Sans**

Both work well for product UI.

Default recommendation:

```text
Inter
```

because of its mature UI readability and strong numeric rendering.

Brand typography can be reconsidered later.

---

# 17. Type Scale

Recommended mobile-first scale:

```text
Display     32 / 38
H1          28 / 34
H2          22 / 28
H3          18 / 24

Body Large  16 / 24
Body        15 / 22
Small       13 / 18
Caption     12 / 16
```

Avoid excessively tiny metadata.

During travel, important information should remain readable at a glance.

---

# 18. Typography Hierarchy Example

Today Mode:

```text
DAY 3 OF 6
small secondary

teamLab Planets
large strong heading

14:00
prominent

Leave in 38 min
strong operational text

Train · 32 min
secondary
```

The place/activity name and immediate timing should dominate.

---

# 19. Numeric Typography

Financial and time values should remain easy to compare.

Where supported:

```text
font-variant-numeric: tabular-nums
```

can be used for:

- expense lists
- balances
- times
- financial summaries

Example:

```text
¥ 4,500
¥18,000
¥92,600
```

---

# 20. Spacing System

Use a 4px-based scale.

Recommended tokens:

```text
4
8
12
16
20
24
32
40
48
64
```

Most mobile layouts should primarily use:

```text
12
16
20
24
32
```

Avoid arbitrary spacing such as:

```text
13px
19px
27px
```

unless there is a strong visual reason.

---

# 21. Mobile Page Padding

Recommended baseline:

```text
16px
```

for narrow mobile screens.

Larger devices may use:

```text
20px
```

or:

```text
24px
```

when appropriate.

Content should not touch screen edges unnecessarily.

---

# 22. Touch Targets

Primary interactive targets should aim for:

```text
44×44px minimum
```

Prefer approximately:

```text
48px
```

for frequent travel actions.

Examples:

- Directions
- Ticket
- Add Expense
- bottom navigation
- activity actions

Do not make critical actions depend on tiny icons.

---

# 23. One-Handed Mobile Design

High-frequency actions should favor the lower portion of the screen.

Examples:

```text
Bottom Navigation
Primary FAB / +
Bottom Sheet Actions
Sticky Save where appropriate
```

Avoid placing all important controls in the top-right corner.

---

# 24. Bottom Navigation

Primary mobile navigation:

```text
Today
Plan
+
Expenses
Trip
```

Requirements:

- comfortably tappable
- icon + label
- clear active state
- safe-area aware
- stable between sections

Do not use icon-only navigation.

---

# 25. Bottom Navigation Height

The navigation should account for:

- touch target
- label
- device safe area

Conceptual content height:

```text
56–64px
```

plus bottom safe-area inset where required.

Do not hard-code layouts assuming devices have no home indicator.

---

# 26. Center Quick Action

The `+` action receives additional emphasis.

It should not become an oversized decorative floating button.

Its purpose is speed.

Possible states:

### Planning

```text
+
Add
```

### Traveling

```text
+
Expense
```

Exact behavior should be validated through usability testing.

---

# 27. Buttons

Button hierarchy:

## Primary

One dominant action.

Examples:

```text
Create Trip
Save Expense
Add to Itinerary
```

## Secondary

Important but not dominant.

Examples:

```text
Directions
Open Booking
```

## Tertiary

Low-emphasis actions.

Examples:

```text
Edit
View Details
```

## Danger

Destructive action.

Examples:

```text
Remove Member
Void Expense
Archive Trip
```

---

# 28. Button Rules

Buttons should:

- have clear labels
- use visible hover/focus/pressed states
- remain usable with touch
- avoid unnecessary icons
- avoid disabled states without explanation where possible

Prefer:

```text
Add Expense
```

over:

```text
+
```

when context is not obvious.

---

# 29. Icon Buttons

Icon-only buttons are acceptable for familiar secondary actions.

Examples:

- close
- back
- more menu

Requirements:

- accessible name
- tooltip on pointer-oriented interfaces where useful
- minimum touch target
- visible focus state

Avoid icon-only primary actions.

---

# 30. Inputs

Inputs should use:

```text
visible label
input
support/error text
```

Do not rely solely on placeholders as labels.

Recommended control height:

```text
44–48px
```

Mobile numeric input should invoke appropriate keyboards where possible.

---

# 31. Financial Inputs

Expense amount is a high-frequency field.

It deserves stronger visual treatment.

Example:

```text
Amount

JPY
¥ 18,000
```

The amount field may be larger than ordinary text inputs.

Currency should remain clearly visible.

---

# 32. Form Density

Planning forms may contain detail.

Travel-time forms should use progressive disclosure.

Example quick expense:

```text
Amount
Description
Paid By
Split Between

[ Save Expense ]

More options
```

Advanced:

```text
Category
Exchange Rate
Split Method
Date
Notes
```

Do not present every financial field at once.

---

# 33. Selectors

For short option sets on mobile, prefer:

- segmented control
- radio group
- bottom sheet selection

over small desktop dropdowns.

Examples:

```text
Equal
Exact
Percentage
```

can work well as a segmented selection when space permits.

---

# 34. Chips

Use chips for lightweight selection/filtering.

Good examples:

```text
Must Go
Food
Cafe
Shopping
```

and:

```text
Going
Skip
```

Do not turn every status into a pill.

Too many pills reduce hierarchy.

---

# 35. Cards

Cards should represent meaningful grouped objects.

Examples:

- place
- booking
- trip
- expense summary

Do not wrap every small text group in a card.

---

# 36. Trip Card

Recommended hierarchy:

```text
Tokyo Autumn

Tokyo, Japan
Nov 15 – Nov 21

Planning · 4 travelers
```

Optional cover image may support identity.

The trip status should remain easy to scan.

---

# 37. Place Card

Recommended:

```text
teamLab Planets

Activity · Must Go

3 interested
Est. ¥4,200

[ Add to Itinerary ]
```

Optional thumbnail should not dominate useful information.

---

# 38. Expense Row

Expense transactions generally work better as structured rows than large cards.

Example:

```text
Dinner                     ¥18,000
Food · Nov 17

Paid by Phyo
```

Avoid giving every expense a large standalone card.

Users need scanability.

---

# 39. Expense Summary Card

High-level finance information may use cards.

Example:

```text
Your Balance

¥4,400
to receive
```

Use wording alongside numbers.

---

# 40. Timeline

The itinerary timeline is a signature TripMate component.

Mobile concept:

```text
09:00  ●  Breakfast
       │
       │
10:30  ●  Asakusa
       │
       │  Train · 24 min
       │
14:00  ●  teamLab
```

The timeline should communicate:

- chronological order
- activity time
- activity identity
- travel transitions

without excessive visual decoration.

---

# 41. Timeline Activity

Primary information:

```text
Time
Title
```

Secondary:

```text
Location
Booking status
Participants
Estimated cost
```

Not every field should be permanently visible.

Activity detail can reveal more.

---

# 42. Transit Segments

Travel time between activities should visually differ from actual activities.

Example:

```text
      ↓
Train · 24 min
      ↓
```

Transit should not compete visually with destinations.

---

# 43. Unscheduled Activities

Display separately from timed activities.

Example:

```text
ANYTIME

○ Buy souvenirs
○ Convenience store
```

Do not assign fake times just to fit the timeline.

---

# 44. Today Mode

Today Mode should be the most operationally optimized screen.

Information hierarchy:

```text
Trip Day
    ↓
Current / Next Activity
    ↓
Immediate Action
    ↓
Upcoming Timeline
    ↓
Secondary Trip Information
```

---

# 45. Today Hero

Example:

```text
DAY 3 OF 6

NEXT

teamLab Planets
14:00

Leave in 38 min
Train · 32 min

[ Directions ] [ Ticket ]
```

This should not feel like a marketing hero.

It is an operational card.

---

# 46. Today Quick Expense

Expense entry should always be easy to reach during travel.

Potential:

```text
+ Expense
```

as:

- central navigation action
- Today quick action

Avoid duplicate visual dominance if both exist.

One should clearly be primary.

---

# 47. Booking Status

Example treatments:

```text
Booked
Need to book
Cancelled
```

Use short labels.

Bookings approaching soon may receive stronger prominence in Today Mode.

---

# 48. Checklist

Checklist items should remain lightweight.

Example:

```text
✓ Hotel booking

○ Buy eSIM
  Assigned to Su
```

Avoid placing every checklist item inside a card.

---

# 49. Members

Member representation:

```text
[Avatar] Phyo
         Owner
```

Avatar fallback:

```text
PN
```

Do not make avatar imagery mandatory.

---

# 50. Avatar Rules

Use avatars to aid group recognition.

Recommended sizes:

```text
24px compact
32px normal
40px member list
```

Avoid excessive avatar stacks.

For many travelers:

```text
+3
```

may summarize additional members.

---

# 51. Empty States

Empty states should be concise and actionable.

Structure:

```text
Short heading

One useful explanation.

[ Primary Action ]
```

Example:

```text
No places saved yet

Save restaurants, attractions,
and activities you're considering.

[ Add Place ]
```

Avoid large decorative illustrations on every empty screen.

---

# 52. Loading States

Use skeletons where layout is predictable.

Avoid loading spinners that block entire pages unnecessarily.

Today Mode should prioritize:

```text
cached useful content
```

before showing a blank loading state.

---

# 53. Offline State

Offline state should be visible without creating panic.

Example:

```text
Offline · Last updated 08:42
```

Use a compact banner or status treatment.

Do not cover the entire screen if cached content remains usable.

---

# 54. Error States

Error messages should explain recovery.

Good:

```text
Couldn't refresh today's itinerary.

Showing the version saved at 08:42.

[ Try Again ]
```

Poor:

```text
Error 500
```

---

# 55. Toasts

Use temporary notifications for successful low-risk actions.

Examples:

```text
Place saved
Checklist updated
```

Do not rely on disappearing toasts for important financial information or errors requiring action.

---

# 56. Confirmation Dialogs

Reserve confirmations for meaningful consequences.

Examples:

```text
Void expense?
Remove traveler?
Archive trip?
Cancel booked activity?
```

Do not ask for confirmation after every normal edit.

---

# 57. Bottom Sheets

Bottom sheets are useful on mobile for:

- contextual actions
- participant selection
- currency selection
- lightweight filters
- quick add menus

Avoid using bottom sheets for long complex forms.

---

# 58. Dialogs

Desktop dialogs work well for focused tasks.

On mobile, complex dialogs should generally become:

```text
full-screen flow
```

or:

```text
dedicated page
```

---

# 59. Tabs

Tabs are appropriate for sibling views.

Examples:

```text
Plan
[ Itinerary ] [ Places ]
```

```text
Expenses
[ Overview ] [ Expenses ] [ Balances ]
```

Avoid deeply nested tab systems.

---

# 60. Filter Design

Filters should not dominate primary content.

Mobile:

```text
Search
[ Filters ]
```

Filter sheet:

```text
Category
Priority
Status
```

Desktop may expose common filters inline.

---

# 61. Search

Search input should be prominent only where users realistically need it.

Examples:

```text
Saved Places
Expenses
```

Do not place global search on every screen during MVP.

---

# 62. Navigation Active State

Active navigation must remain obvious through more than color.

Use combinations such as:

```text
icon treatment
text weight
background/indicator
color
```

Avoid subtle color-only changes.

---

# 63. Focus States

All interactive controls require visible keyboard focus.

Use a consistent focus ring.

Focus styling should not depend solely on browser defaults if those defaults conflict with the design system.

Never remove outlines without replacement.

---

# 64. Hover States

Hover is enhancement, not required interaction.

Anything essential must work on touch.

Desktop hover may reveal:

- subtle row emphasis
- secondary controls
- tooltip

Do not hide essential actions permanently behind hover.

---

# 65. Pressed States

Touch interactions need immediate feedback.

Buttons and tappable rows should have:

```text
pressed state
```

Examples:

- subtle surface change
- small visual compression where appropriate

Avoid exaggerated animation.

---

# 66. Motion

Motion should communicate:

- hierarchy
- continuity
- feedback

Recommended durations:

```text
Fast      ~120–160ms
Standard  ~180–240ms
Slow      ~280–360ms
```

Use slower transitions sparingly.

---

# 67. Motion Examples

Appropriate:

```text
bottom sheet enters
tab indicator moves
activity expands
button press feedback
```

Avoid:

```text
constant floating animations
large parallax effects
decorative page transitions
```

Travel-time interactions should feel immediate.

---

# 68. Reduced Motion

Respect:

```text
prefers-reduced-motion
```

Nonessential animations should be reduced or removed.

---

# 69. Outdoor Readability

TripMate may frequently be used outdoors.

Therefore avoid:

- low-contrast gray text
- thin typography
- translucent primary content
- tiny metadata
- subtle-only states

Important operational information should maintain strong contrast.

---

# 70. Dark Mode

Dark mode is valuable but not required for the earliest MVP.

Architecture should support semantic color tokens so dark mode can be introduced cleanly.

Recommended priority:

```text
Light mode
→ first polished experience

Dark mode
→ P1 / post-foundation
```

Do not maintain two poorly finished themes during early product development.

---

# 71. Light Mode Direction

Light mode should use:

- neutral background
- clean solid surfaces
- strong dark text
- restrained accent color

Avoid pure white for every layer if subtle surface distinction improves hierarchy.

---

# 72. Desktop Layout

Desktop is primarily a planning workspace.

Recommended shell:

```text
Sidebar
+
Main Workspace
```

Typical maximum content widths should depend on task.

Examples:

### Reading/detail

Constrain width.

### Itinerary planning

Use more horizontal space.

### Expense table

Use available width intelligently.

Avoid one global max-width for every screen.

---

# 73. Desktop Sidebar

Sidebar contains:

```text
Trip Switcher

Today
Plan
Expenses

Trip
Members
Bookings
Checklist
Settings

────────

My Trips
Profile
```

The sidebar should remain functional rather than decorative.

---

# 74. Mobile Layout

Mobile content generally uses:

```text
Header
Main Content
Bottom Navigation
```

Avoid permanent side drawers for primary navigation.

The user should reach core sections with one tap.

---

# 75. Responsive Component Adaptation

Components may change composition across breakpoints.

Example expense list:

### Mobile

```text
Dinner
Food · Nov 17

¥18,000
Paid by Phyo
```

### Desktop

May become aligned columns:

```text
Date | Description | Category | Paid By | Amount
```

Same information.

Different composition.

---

# 76. Breakpoint Philosophy

Use Tailwind breakpoints pragmatically.

Do not design around device names.

Think in terms of:

```text
When does the content stop fitting comfortably?
```

Common structural transition:

```text
mobile bottom navigation
→ desktop sidebar
```

should happen based on usable layout space.

---

# 77. Safe Areas

Mobile fixed UI must respect:

```text
env(safe-area-inset-bottom)
env(safe-area-inset-top)
```

where appropriate.

Especially:

- bottom navigation
- full-screen sheets
- sticky actions

---

# 78. Sticky Actions

Sticky actions are useful when the primary action would otherwise become difficult to reach.

Examples:

```text
Save Expense
Add Activity
```

Do not make every page contain a sticky footer.

Use only where workflow length justifies it.

---

# 79. Map Usage

Maps should support decisions rather than dominate every screen.

Potential use:

- place detail
- saved-place exploration
- route context

Avoid forcing users into a map-first UI when a list or timeline better serves the task.

---

# 80. Images

Travel imagery can add identity and memory.

Good uses:

```text
Trip cover
Place thumbnail
Future trip memories
```

Avoid:

- huge imagery blocking itinerary information
- mandatory thumbnails for every item
- decorative stock travel photos

User content or real place imagery is preferable when available.

---

# 81. Iconography

Use one consistent icon family.

Icons should be:

- simple
- recognizable
- consistent stroke/weight

Avoid mixing several icon styles.

Potential implementation may use a library such as Lucide.

Exact dependency should be chosen during project setup.

---

# 82. Content Tone

UI copy should be:

```text
short
clear
human
action-oriented
```

Prefer:

```text
Add expense
```

over:

```text
Create new expense record
```

Prefer:

```text
Nothing planned yet
```

over:

```text
No itinerary records were found
```

---

# 83. Travel Language

Avoid technical terminology in user-facing interfaces.

Internal:

```text
Itinerary Activity
Expense Split
Trip Member
```

UI:

```text
Activity
Split
Traveler
```

Database terminology should not leak into product copy.

---

# 84. Date Formatting

Use readable travel-oriented dates.

Example:

```text
Wed, Nov 18
```

rather than:

```text
2026-11-18
```

unless an explicit technical context requires ISO format.

Respect localization later.

---

# 85. Time Formatting

Use locale/user preference where available.

Examples:

```text
14:00
```

or:

```text
2:00 PM
```

Trip timezone should remain clear when ambiguity exists.

---

# 86. Currency Formatting

Always include enough currency context.

Good:

```text
¥18,000
```

When ambiguous:

```text
$120 USD
```

Converted information:

```text
$120 USD
≈ ¥18,000
```

Avoid showing excessive decimal precision.

---

# 87. Accessibility

Target:

> WCAG 2.2 AA where practical.

Core requirements:

- semantic HTML
- keyboard access
- visible focus
- sufficient contrast
- accessible names
- proper form labels
- error associations
- reduced-motion support
- non-color state communication
- adequate touch targets

---

# 88. Screen Reader Structure

Use proper:

```text
headings
lists
buttons
links
form labels
status messages
```

Avoid making everything:

```text
<div>
```

with click handlers.

Timeline structure should remain understandable without its visual line.

---

# 89. Financial Accessibility

Expense splits should not depend on layout alone.

Example:

```text
Su
Share: ¥4,500
```

should remain semantically understandable to assistive technology.

---

# 90. Design Tokens

Conceptual token structure:

```text
colors
typography
spacing
radius
shadow
motion
breakpoints
z-index
```

Tailwind should map utilities to these decisions where practical.

Avoid arbitrary values throughout feature components.

---

# 91. Semantic Token Example

Conceptually:

```text
--background
--surface
--surface-elevated

--text-primary
--text-secondary
--text-muted

--border
--border-strong

--action-primary
--action-primary-hover

--success
--warning
--danger
--info

--focus
```

Components consume semantic meaning rather than raw palette names whenever practical.

---

# 92. Component Priority

Do not build a giant design-system library before product screens exist.

Start with components needed by early vertical slices.

## Foundation

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

## Trip Planning

```text
TripCard
PlaceCard
Timeline
ActivityRow
MemberAvatar
```

## Finance

```text
MoneyInput
ExpenseRow
MemberSelector
SplitEditor
BalanceSummary
```

---

# 93. Product Components vs UI Primitives

Example:

```text
Button
```

belongs to the shared design system.

```text
ExpenseSplitEditor
```

belongs to the Expenses domain.

Do not turn every product-specific component into a global design-system primitive.

---

# 94. Visual QA Checklist

Every major screen should be checked for:

```text
clear primary action
clear heading hierarchy
comfortable mobile spacing
touch target size
keyboard focus
empty state
loading state
error state
long text
large currency values
many travelers
small phone width
desktop width
```

---

# 95. Travel Stress QA

For Today Mode and travel-critical screens, additionally ask:

```text
Can I understand this in 2–3 seconds?

Can I use it with one hand?

Can I read it outdoors?

Can I find the next activity immediately?

Can I reach directions quickly?

Can I add an expense quickly?

Does it remain useful without perfect network access?
```

If not, simplify.

---

# 96. Finance Stress QA

For Expenses:

```text
Can I see who paid?

Can I see who shares the expense?

Can I understand my balance?

Can I tell whether I owe or receive?

Can I verify the split?

Can I identify the currency?

Can I correct a mistake safely?
```

Trust is more important than visual novelty.

---

# 97. Avoided Design Patterns

Avoid:

### Dashboard Card Explosion

Not every metric needs a card.

### Pill Everywhere

Reserve pills for useful compact states/selections.

### Glass Everywhere

Hurts readability.

### Excessive Gradients

Can make the product feel promotional.

### Tiny Gray Metadata

Poor outdoor readability.

### Icon-Only Navigation

Weak discoverability.

### Dense Desktop Tables on Mobile

Use mobile-specific composition.

### Excessive Confirmation

Creates travel-time friction.

### Hidden Actions on Hover

Does not work for touch.

### Animation-Heavy Travel UI

Slows operational use.

---

# 98. Signature TripMate Experiences

The design system should make these three experiences especially strong.

## 1. Today Mode

```text
Immediate
Contextual
Operational
```

## 2. Itinerary Timeline

```text
Clear
Flexible
Easy to scan
```

## 3. Quick Expense

```text
Fast
Trustworthy
Low friction
```

If these three experiences feel excellent, TripMate will have a strong product foundation.

---

# 99. Initial Design Direction

For the first implementation:

```text
Theme
→ Light

Visual style
→ Warm modern utility

Typography
→ Inter

Surfaces
→ Solid

Radius
→ Moderate

Shadows
→ Minimal

Color
→ Semantic + one restrained brand accent

Navigation
→ Mobile bottom navigation
→ Desktop sidebar

Motion
→ Subtle and functional

Touch
→ 44px minimum, ~48px preferred

Content
→ Mobile-first hierarchy
```

---

# 100. Decisions Not Locked Yet

Leave these open until visual exploration:

```text
Final product name
Logo
Exact brand palette
Exact primary accent
Illustration style
Trip cover treatment
Dark-mode palette
Marketing-site visual language
```

These decisions should not block product implementation.

---

# 101. Design System Success Criteria

The system succeeds if:

### During Planning

Users can comfortably organize complex trip information.

### During Travel

Users can identify what matters in seconds.

### Finance

Users trust the information and understand what they owe.

### Responsive

Mobile and desktop feel purpose-built rather than resized.

### Accessibility

Core functionality remains usable without relying on visual decoration.

### Maintainability

New screens can be built without inventing new visual rules every time.

---

# 102. Next Artifact

The next document is:

**ROADMAP.md**

It should turn the product and technical foundation into an execution plan.

It will define:

```text
Development phases
Milestones
Vertical slices
Dependencies
Definition of Done
Testing gates
Real-trip validation milestone
PWA milestone
Deferred features
Post-MVP decision points
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
ARCHITECTURE.md
        ↓
DESIGN_SYSTEM.md              ← Current
        ↓
ROADMAP.md
```