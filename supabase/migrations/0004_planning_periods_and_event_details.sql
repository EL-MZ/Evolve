-- First-class planning periods, detailed calendar events, and per-user themes.
-- Existing goals are preserved as weekly goals and existing sessions as goal sessions.

alter table public.profiles
  add column theme_key text not null default 'lime'
  check (theme_key in ('lime', 'ocean', 'coral', 'violet'));

alter table public.goals
  add column period_type text not null default 'weekly'
    check (period_type in ('weekly', 'monthly', 'custom')),
  add column period_start date,
  add column period_end date,
  add column due_date date;

update public.goals
set period_start = week_start,
    period_end = week_start + 6,
    due_date = week_start + 6
where period_start is null or period_end is null or due_date is null;

alter table public.goals
  alter column period_start set not null,
  alter column period_end set not null,
  alter column due_date set not null,
  add constraint goals_period_dates_check check (period_end >= period_start),
  add constraint goals_due_date_check check (due_date between period_start and period_end);

create index goals_owner_period_idx
  on public.goals(owner_id, period_start, period_end);

alter table public.scheduled_sessions
  alter column goal_id drop not null,
  add column event_kind text not null default 'goal_session'
    check (event_kind in ('goal_session', 'event')),
  add column notes text check (notes is null or char_length(notes) <= 4000),
  add column link_url text check (link_url is null or char_length(link_url) <= 2048),
  add column location text check (location is null or char_length(location) <= 240),
  add column color text not null default '#A8F06A'
    check (color ~ '^#[0-9A-Fa-f]{6}$');

drop policy if exists "sessions_insert_owner" on public.scheduled_sessions;
drop policy if exists "sessions_update_owner" on public.scheduled_sessions;

create policy "sessions_insert_owner" on public.scheduled_sessions
for insert with check (
  auth.uid() = owner_id
  and (
    goal_id is null
    or exists (
      select 1 from public.goals
      where goals.id = scheduled_sessions.goal_id
        and goals.owner_id = auth.uid()
    )
  )
);

create policy "sessions_update_owner" on public.scheduled_sessions
for update using (auth.uid() = owner_id)
with check (
  auth.uid() = owner_id
  and (
    goal_id is null
    or exists (
      select 1 from public.goals
      where goals.id = scheduled_sessions.goal_id
        and goals.owner_id = auth.uid()
    )
  )
);
