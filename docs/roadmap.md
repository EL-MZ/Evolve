# Roadmap

## Phase 1 — Clickable tracker foundation

- [x] Energetic responsive dashboard
- [x] Four default goal pillars
- [x] Add, complete, and increment goals
- [x] Browser persistence for demonstration
- [x] Print / Save as PDF
- [x] `.ics` calendar export
- [x] Production data model and owner-only RLS
- [x] Empty new-user workspace and first-login walkthrough
- [x] Custom categories with colour and icon selection
- [x] Per-goal log increments and goal deletion
- [x] Optional goal events and weekly calendar
- [x] Weekly, monthly, and custom-range goal periods
- [x] Page-based reading tracking
- [x] Hourly week/day schedule with repeated draggable goal sessions
- [x] Detailed standalone events with full create/update/delete support
- [x] Persisted sidebar/accent themes
- [ ] Add automated interaction tests

## Phase 2 — Private accounts

- [x] Supabase client integration and environment-based account mode
- [x] Email/password authentication and session refresh
- [x] Protected dashboard entry
- [x] Persist goals and progress across devices
- [ ] Magic-link authentication
- [x] Persist scheduled sessions across devices
- [ ] User timezone and week-start preferences
- Empty, loading, offline, and service-paused states

## Phase 3 — Planning and richer exports

- [x] Calendar-style scheduled sessions
- Goal recurrence and carry-forward review
- DOCX export
- Branded direct PDF export
- Goal templates

## Phase 4 — Friends and sharing

- Usernames and friend requests
- Block and remove controls
- Per-goal visibility
- Selected-friend sharing
- Feed built only from allowed activity events
- Encouragement reactions without ranking

## Phase 5 — Integrations and reminders

- Separate Google Calendar connection
- Narrow `calendar.events` scope
- Event create/update/delete synchronization
- Email reminders and weekly review
- Quiet hours and timezone-aware scheduled jobs

Each phase should remain deployable and useful on its own. Social policies and calendar token handling require dedicated security tests before release.
