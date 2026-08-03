-- Reading/audiobook progress, goals that remain visible until a due date,
-- and reversible calendar completion with atomic linked-goal progress.

alter type public.goal_measurement add value if not exists 'minutes';

alter table public.goals
  add column repeat_until_due boolean not null default false,
  add constraint goals_repeat_until_due_dates_check check (
    not repeat_until_due
    or (period_type = 'weekly' and period_end = due_date)
  );

alter table public.scheduled_sessions
  add column completed boolean not null default false,
  add column completed_at timestamptz,
  add column progress_contribution numeric(12, 2) not null default 0
    check (progress_contribution >= 0),
  add constraint scheduled_sessions_completion_check check (
    (completed and completed_at is not null)
    or (not completed and completed_at is null and progress_contribution = 0)
  );

create or replace function public.set_calendar_event_completion(
  p_event_id uuid,
  p_completed boolean
)
returns table (
  event_id uuid,
  event_completed boolean,
  event_completed_at timestamptz,
  event_progress_contribution numeric,
  linked_goal_id uuid,
  goal_current numeric,
  goal_completed boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_event public.scheduled_sessions%rowtype;
  v_goal public.goals%rowtype;
  v_contribution numeric(12, 2) := 0;
  v_event_completed_at timestamptz;
  v_event_progress numeric(12, 2) := 0;
  v_goal_current numeric(12, 2);
  v_goal_completed boolean;
begin
  if p_completed is null then
    raise exception 'Completion state is required';
  end if;

  select session.*
  into v_event
  from public.scheduled_sessions as session
  where session.id = p_event_id
    and session.owner_id = auth.uid()
  for update;

  if not found then
    raise exception 'Calendar event not found';
  end if;

  if v_event.goal_id is not null then
    select goal.*
    into v_goal
    from public.goals as goal
    where goal.id = v_event.goal_id
      and goal.owner_id = auth.uid()
    for update;

    if not found then
      raise exception 'Linked goal not found';
    end if;
  end if;

  if v_event.completed = p_completed then
    v_event_completed_at := v_event.completed_at;
    v_event_progress := v_event.progress_contribution;
    if v_event.goal_id is not null then
      v_goal_current := v_goal.current_value;
      v_goal_completed := v_goal.status = 'completed'::public.goal_status;
    end if;
  elsif p_completed then
    v_event_completed_at := pg_catalog.now();
    if v_event.goal_id is not null then
      v_contribution := least(
        v_goal.log_increment,
        greatest(v_goal.target_value - v_goal.current_value, 0)
      );
      v_goal_current := v_goal.current_value + v_contribution;
      v_goal_completed := v_goal_current >= v_goal.target_value;
      v_event_progress := v_contribution;

      update public.goals
      set current_value = v_goal_current,
          status = case
            when v_goal_completed then 'completed'::public.goal_status
            else 'active'::public.goal_status
          end,
          updated_at = pg_catalog.now()
      where id = v_goal.id;

      if v_contribution > 0 then
        insert into public.progress_entries (goal_id, actor_id, value, note)
        values (v_goal.id, auth.uid(), v_goal_current, 'Calendar event completed');
      end if;
    end if;

    update public.scheduled_sessions
    set completed = true,
        completed_at = v_event_completed_at,
        progress_contribution = v_event_progress,
        updated_at = pg_catalog.now()
    where id = v_event.id;
  else
    if v_event.goal_id is not null then
      v_contribution := least(v_event.progress_contribution, v_goal.current_value);
      v_goal_current := greatest(v_goal.current_value - v_contribution, 0);
      v_goal_completed := v_goal_current >= v_goal.target_value;

      update public.goals
      set current_value = v_goal_current,
          status = case
            when v_goal_completed then 'completed'::public.goal_status
            else 'active'::public.goal_status
          end,
          updated_at = pg_catalog.now()
      where id = v_goal.id;

      if v_contribution > 0 then
        insert into public.progress_entries (goal_id, actor_id, value, note)
        values (v_goal.id, auth.uid(), v_goal_current, 'Calendar event reopened');
      end if;
    end if;

    v_event_completed_at := null;
    v_event_progress := 0;
    update public.scheduled_sessions
    set completed = false,
        completed_at = null,
        progress_contribution = 0,
        updated_at = pg_catalog.now()
    where id = v_event.id;
  end if;

  return query
  select
    v_event.id,
    p_completed,
    v_event_completed_at,
    v_event_progress,
    v_event.goal_id,
    v_goal_current,
    v_goal_completed;
end;
$$;
