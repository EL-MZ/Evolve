-- Private account workspaces, user-owned categories, and current progress summaries.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  short_label text not null check (char_length(short_label) between 1 and 40),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  icon_key text not null check (icon_key in ('briefcase', 'dumbbell', 'book', 'graduation', 'heart', 'palette', 'music', 'plane', 'wallet', 'leaf', 'home', 'code')),
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index categories_owner_name_idx on public.categories(owner_id, lower(name));
create index categories_owner_sort_idx on public.categories(owner_id, sort_order);

alter table public.categories enable row level security;
create policy "categories_select_owner" on public.categories for select using (auth.uid() = owner_id);
create policy "categories_insert_owner" on public.categories for insert with check (auth.uid() = owner_id);
create policy "categories_update_owner" on public.categories for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "categories_delete_owner" on public.categories for delete using (auth.uid() = owner_id and not is_default);

alter table public.goals
  add column category_id uuid references public.categories(id) on delete restrict,
  add column current_value numeric(12, 2) not null default 0 check (current_value >= 0),
  add column due_day text not null default 'Sunday' check (char_length(due_day) between 1 and 20);

create index goals_category_idx on public.goals(category_id);

create or replace function public.set_goal_progress(p_goal_id uuid, p_current numeric, p_completed boolean)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  goal_owner uuid;
begin
  select owner_id into goal_owner from public.goals where id = p_goal_id;
  if goal_owner is null or goal_owner <> auth.uid() then
    raise exception 'Goal not found';
  end if;
  if p_current < 0 then
    raise exception 'Progress cannot be negative';
  end if;

  update public.goals
  set current_value = p_current,
      status = case when p_completed then 'completed'::public.goal_status else 'active'::public.goal_status end,
      updated_at = now()
  where id = p_goal_id and owner_id = auth.uid();

  insert into public.progress_entries (goal_id, actor_id, value)
  values (p_goal_id, auth.uid(), p_current);
end;
$$;

insert into public.categories (owner_id, name, short_label, color, icon_key, is_default, sort_order)
select profile.id, starter.name, starter.short_label, starter.color, starter.icon_key, true, starter.sort_order
from public.profiles as profile
cross join (values
  ('Deep work', 'Work', '#A8F06A', 'briefcase', 0),
  ('Move', 'Sport', '#FF776F', 'dumbbell', 1),
  ('Read', 'Reading', '#70D7FF', 'book', 2),
  ('Learn', 'Study', '#C39BFF', 'graduation', 3)
) as starter(name, short_label, color, icon_key, sort_order)
on conflict do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));

  insert into public.categories (owner_id, name, short_label, color, icon_key, is_default, sort_order)
  values
    (new.id, 'Deep work', 'Work', '#A8F06A', 'briefcase', true, 0),
    (new.id, 'Move', 'Sport', '#FF776F', 'dumbbell', true, 1),
    (new.id, 'Read', 'Reading', '#70D7FF', 'book', true, 2),
    (new.id, 'Learn', 'Study', '#C39BFF', 'graduation', true, 3);
  return new;
end;
$$;
