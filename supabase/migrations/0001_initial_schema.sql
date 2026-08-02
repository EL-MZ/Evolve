-- Evolve's production data foundation.
-- Social read policies are deliberately owner-only until sharing tests are added.

create extension if not exists pgcrypto;

create type public.goal_measurement as enum ('binary', 'count', 'duration', 'distance', 'pages', 'sessions', 'custom');
create type public.goal_status as enum ('planned', 'active', 'completed', 'skipped', 'carried_forward');
create type public.goal_visibility as enum ('private', 'friends', 'selected');
create type public.friendship_status as enum ('pending', 'accepted', 'declined', 'blocked');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique check (username is null or username ~ '^[a-z0-9_]{3,30}$'),
  display_name text check (char_length(display_name) between 1 and 80),
  timezone text not null default 'Pacific/Auckland',
  week_starts_on smallint not null default 1 check (week_starts_on between 0 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  notes text check (notes is null or char_length(notes) <= 4000),
  category_name text not null check (char_length(category_name) between 1 and 40),
  category_color text not null default '#A8F06A' check (category_color ~ '^#[0-9A-Fa-f]{6}$'),
  week_start date not null,
  measurement public.goal_measurement not null default 'binary',
  target_value numeric(12, 2) not null default 1 check (target_value > 0),
  unit text not null default 'task' check (char_length(unit) between 1 and 30),
  status public.goal_status not null default 'active',
  visibility public.goal_visibility not null default 'private',
  priority smallint not null default 2 check (priority between 1 and 3),
  sort_order integer not null default 0,
  carried_from_goal_id uuid references public.goals(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.progress_entries (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  value numeric(12, 2) not null check (value >= 0),
  note text check (note is null or char_length(note) <= 1000),
  occurred_at timestamptz not null default now(),
  visible_to_goal_audience boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.scheduled_sessions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null,
  external_calendar_provider text,
  external_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete cascade,
  event_type text not null check (event_type in ('goal_created', 'progress_logged', 'goal_completed')),
  audience public.goal_visibility not null default 'private',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index goals_owner_week_idx on public.goals(owner_id, week_start);
create index progress_goal_occurred_idx on public.progress_entries(goal_id, occurred_at desc);
create index sessions_owner_start_idx on public.scheduled_sessions(owner_id, starts_at);
create index friendships_addressee_status_idx on public.friendships(addressee_id, status);
create index activity_actor_created_idx on public.activity_events(actor_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.progress_entries enable row level security;
alter table public.scheduled_sessions enable row level security;
alter table public.friendships enable row level security;
alter table public.activity_events enable row level security;

create policy "profiles_select_self" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_self" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "goals_select_owner" on public.goals for select using (auth.uid() = owner_id);
create policy "goals_insert_owner" on public.goals for insert with check (auth.uid() = owner_id);
create policy "goals_update_owner" on public.goals for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "goals_delete_owner" on public.goals for delete using (auth.uid() = owner_id);

create policy "progress_select_goal_owner" on public.progress_entries for select using (
  exists (select 1 from public.goals where goals.id = progress_entries.goal_id and goals.owner_id = auth.uid())
);
create policy "progress_insert_goal_owner" on public.progress_entries for insert with check (
  auth.uid() = actor_id and exists (select 1 from public.goals where goals.id = progress_entries.goal_id and goals.owner_id = auth.uid())
);
create policy "progress_update_goal_owner" on public.progress_entries for update using (
  exists (select 1 from public.goals where goals.id = progress_entries.goal_id and goals.owner_id = auth.uid())
) with check (auth.uid() = actor_id);
create policy "progress_delete_goal_owner" on public.progress_entries for delete using (
  exists (select 1 from public.goals where goals.id = progress_entries.goal_id and goals.owner_id = auth.uid())
);

create policy "sessions_select_owner" on public.scheduled_sessions for select using (auth.uid() = owner_id);
create policy "sessions_insert_owner" on public.scheduled_sessions for insert with check (
  auth.uid() = owner_id and exists (select 1 from public.goals where goals.id = scheduled_sessions.goal_id and goals.owner_id = auth.uid())
);
create policy "sessions_update_owner" on public.scheduled_sessions for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "sessions_delete_owner" on public.scheduled_sessions for delete using (auth.uid() = owner_id);

create policy "friendships_select_participant" on public.friendships for select using (auth.uid() in (requester_id, addressee_id));
create policy "friendships_insert_requester" on public.friendships for insert with check (auth.uid() = requester_id and status = 'pending');
create policy "friendships_update_participant" on public.friendships for update using (auth.uid() in (requester_id, addressee_id));
create policy "friendships_delete_participant" on public.friendships for delete using (auth.uid() in (requester_id, addressee_id));

create policy "activity_select_owner" on public.activity_events for select using (auth.uid() = actor_id);
create policy "activity_insert_owner" on public.activity_events for insert with check (auth.uid() = actor_id);
create policy "activity_update_owner" on public.activity_events for update using (auth.uid() = actor_id) with check (auth.uid() = actor_id);
create policy "activity_delete_owner" on public.activity_events for delete using (auth.uid() = actor_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

