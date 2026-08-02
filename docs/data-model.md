# Data model and privacy boundaries

The executable migrations are in `supabase/migrations` and must be applied in numeric order.

| Entity | Purpose | Ownership |
|---|---|---|
| `profiles` | Public-safe account identity and timezone | One row per authenticated user |
| `categories` | User-defined area, colour, and icon | Exactly one user owns each category |
| `goals` | Weekly target and measurement | Exactly one user owns each goal |
| `progress_entries` | Immutable increments or notes | Owner through its parent goal |
| `scheduled_sessions` | Planned time linked to a goal | Owner through its parent goal |
| `friendships` | Pending, accepted, declined, or blocked relationship | The two participating users |
| `activity_events` | Feed-ready event created from an allowed action | Actor owns it; audience is explicit |

## Key modeling rules

- `week_start` is a date representing Monday in the user's planning timezone.
- `target_value` is positive. `current_value` is the fast current summary, while `progress_entries` retain the history of cumulative values.
- The `set_goal_progress` function updates the goal summary and its history entry in one transaction.
- Four starter categories are inserted for each profile, but a new account has no goals.
- Custom category names, colours, and icon keys are stored as user-owned rows rather than being hard-coded in the interface.
- A goal's visibility is `private`, `friends`, or `selected`; the default is `private`.
- Scheduling and progress remain separate so rescheduling does not rewrite history.
- Activity feed records contain a small event payload, not a copy of a private goal.

## RLS rollout

The first migration grants owner-only access. Friend reads are intentionally not enabled merely because visibility columns exist. The social phase must add policies together with tests for accepted, declined, and blocked relationships, selected-user shares, and hidden progress entries.
