# Evolve product specification

## Product statement

Evolve helps a small group of users turn weekly intentions across work, sport, reading, and study into visible, encouraging progress. It should feel energetic and personal, not like corporate project management.

## Primary users

- The owner, planning and reviewing a balanced week
- A few invited friends, each with a private account
- Later, friends who deliberately share selected goals or progress

## Core principles

1. Private by default.
2. Progress over perfection.
3. A small number of meaningful weekly outcomes.
4. No public comparison leaderboard.
5. Exports and integrations should never trap the user's data.

## Main user journey

1. Sign in and arrive at the current week.
2. Add goals under Work, Sport, Reading, Study, or a custom area.
3. Choose a measurement such as complete/incomplete, count, duration, distance, pages, or sessions.
4. Log progress during the week.
5. Choose a weekly, monthly, or custom-range period.
6. Drag the goal into the hourly schedule one or more times, or create a standalone detailed event.
7. Move, resize, edit, duplicate, or delete calendar items and export them to a calendar.
8. Print or download a weekly plan.
9. Review completion and carry selected goals forward.

## MVP acceptance criteria

- The dashboard is useful on desktop and mobile.
- Users can create, complete, and increment goals.
- Progress is visible per goal, category, and week.
- The demo works without credentials and survives a refresh on the same browser.
- Print / Save as PDF produces a clean weekly layout.
- Calendar export produces an `.ics` file.
- Production tables have constraints and Row-Level Security before real accounts are enabled.
- No private social data is queryable until explicit sharing policies are tested.
- A new account starts with no goals and receives a short, skippable walkthrough.
- Users can add a custom category with their own name, colour, and icon.
- Users can create weekly, monthly, and custom-range goals without duplicating progress.
- Page-based reading goals clearly show pages completed and remaining.
- Dropping one goal several times creates independent sessions that survive reload.
- Standalone events can store notes, a web link, and a location.
- Theme selection changes only the sidebar and main accent and survives reload.

## Measurement types

| Type | Example | Progress behavior |
|---|---|---|
| Binary | Submit application | Complete or reopen |
| Count | Three gym sessions | Increment toward target |
| Duration | Study for five hours | Add timed or manual entries |
| Distance | Run 20 km | Add distance entries |
| Pages | Read 120 pages | Add page counts |
| Custom | Two observing blocks | User-defined unit |

## Out of scope for the first release

- Public profiles
- Competitive leaderboards
- Payment or subscription features
- Automatic health-device ingestion
- Direct Google Calendar synchronization
- Email reminders
- Complex team project management

These may be revisited only after the private weekly tracker works well.
