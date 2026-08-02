# Data model and privacy boundaries

The executable first migration is in `supabase/migrations/0001_initial_schema.sql`.

| Entity | Purpose | Ownership |
|---|---|---|
| `profiles` | Public-safe account identity and timezone | One row per authenticated user |
| `goals` | Weekly target and measurement | Exactly one user owns each goal |
| `progress_entries` | Immutable increments or notes | Owner through its parent goal |
| `scheduled_sessions` | Planned time linked to a goal | Owner through its parent goal |
| `friendships` | Pending, accepted, declined, or blocked relationship | The two participating users |
| `activity_events` | Feed-ready event created from an allowed action | Actor owns it; audience is explicit |

## Key modeling rules

- `week_start` is a date representing Monday in the user's planning timezone.
- `target_value` is positive; `current_value` is derived from progress entries in the full implementation.
- A goal's visibility is `private`, `friends`, or `selected`; the default is `private`.
- Scheduling and progress remain separate so rescheduling does not rewrite history.
- Activity feed records contain a small event payload, not a copy of a private goal.

## RLS rollout

The first migration grants owner-only access. Friend reads are intentionally not enabled merely because visibility columns exist. The social phase must add policies together with tests for accepted, declined, and blocked relationships, selected-user shares, and hidden progress entries.
