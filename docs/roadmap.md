# Roadmap

## Phase 1 — Clickable tracker foundation

- [x] Energetic responsive dashboard
- [x] Four default goal pillars
- [x] Add, complete, and increment goals
- [x] Browser persistence for demonstration
- [x] Print / Save as PDF
- [x] `.ics` calendar export
- [x] Production data model and owner-only RLS
- [ ] Add automated interaction tests

## Phase 2 — Private accounts

- Supabase project and environment configuration
- Email/password and magic-link authentication
- Protected routes and session refresh
- Persist goals, progress, and scheduled sessions across devices
- User timezone and week-start preferences
- Empty, loading, offline, and service-paused states

## Phase 3 — Planning and richer exports

- Calendar-style scheduled sessions
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
