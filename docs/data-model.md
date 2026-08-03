# Data model and privacy boundaries

The executable migrations are in `supabase/migrations` and must be applied in numeric order.

| Entity | Purpose | Ownership |
|---|---|---|
| `profiles` | Account identity, timezone, and interface theme | One row per authenticated user |
| `categories` | User-defined area, colour, and icon | Exactly one user owns each category |
| `goals` | Weekly, monthly, or custom-range target and measurement | Exactly one user owns each goal |
| `progress_entries` | Immutable increments or notes | Owner through its parent goal |
| `scheduled_sessions` | Goal sessions and standalone detailed events | Exactly one user owns each calendar item |
| `friendships` | Pending, accepted, declined, or blocked relationship | The two participating users |
| `activity_events` | Feed-ready event created from an allowed action | Actor owns it; audience is explicit |

## Key modeling rules

- `period_type`, `period_start`, and `period_end` define whether a goal is weekly, monthly, or spans a custom range. The legacy `week_start` remains populated for compatibility.
- A monthly or custom goal appears in every weekly view that overlaps its range; it is one goal, not a copy per week.
- `repeat_until_due` keeps an explicitly selected weekly goal visible in every overlapping week through `due_date`. It remains one goal with one shared progress value rather than creating weekly copies.
- `target_value` is positive. `current_value` is the fast current summary, while `progress_entries` retain the history of cumulative values.
- `log_increment` is the positive amount added by one Log action and is chosen per goal.
- `scheduled_sessions.goal_id` is optional. Linked goal sessions cascade when their goal is deleted; standalone events remain independent.
- Calendar notes, web links, locations, colours, and event kind live on the calendar item rather than the goal.
- `scheduled_sessions.completed` records calendar completion independently from goal completion. `progress_contribution` stores the exact amount a linked completion added so reopening the event can reverse only its own contribution.
- The `set_goal_progress` function updates the goal summary and its history entry in one transaction.
- `set_calendar_event_completion` locks the event and linked goal, changes both in one transaction, and is idempotent when asked to apply the existing state.
- Four starter categories are inserted for each profile, but a new account has no goals.
- Custom category names, colours, and icon keys are stored as user-owned rows rather than being hard-coded in the interface.
- A goal's visibility is `private`, `friends`, or `selected`; the default is `private`.
- Scheduling and progress remain separate so rescheduling does not rewrite history.
- `profiles.theme_key` stores one of the four approved sidebar/accent themes and never changes category colours.
- Activity feed records contain a small event payload, not a copy of a private goal.

## RLS rollout

The migrations grant owner-only access. A standalone calendar event is accepted only when its `owner_id` matches the authenticated user; a linked session additionally requires ownership of the referenced goal. Friend reads are intentionally not enabled merely because visibility columns exist. The social phase must add policies together with tests for accepted, declined, and blocked relationships, selected-user shares, and hidden progress entries.
