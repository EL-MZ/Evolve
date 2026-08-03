import { getSupabaseClient } from "./supabase";
import type {
  CalendarEvent,
  Category,
  CategoryIcon,
  Goal,
  GoalMeasurement,
  GoalPeriodType,
  ThemeKey,
  Workspace,
} from "./types";

type CategoryRow = {
  id: string;
  name: string;
  short_label: string;
  color: string;
  icon_key: CategoryIcon;
  is_default: boolean;
};

type GoalRow = {
  id: string;
  title: string;
  category_id: string;
  current_value: number | string;
  target_value: number | string;
  log_increment: number | string;
  measurement: GoalMeasurement;
  unit: string;
  notes: string | null;
  period_type: GoalPeriodType;
  period_start: string;
  period_end: string;
  due_date: string;
  repeat_until_due: boolean;
  status: string;
};

type ScheduledSessionRow = {
  id: string;
  goal_id: string | null;
  event_kind: "goal_session" | "event";
  title: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  notes: string | null;
  link_url: string | null;
  location: string | null;
  color: string;
  completed: boolean;
  completed_at: string | null;
  progress_contribution: number | string;
};

type EventCompletionRow = {
  event_id: string;
  event_completed: boolean;
  event_completed_at: string | null;
  event_progress_contribution: number | string;
  linked_goal_id: string | null;
  goal_current: number | string | null;
  goal_completed: boolean | null;
};

export type EventCompletionResult = {
  eventId: string;
  eventCompleted: boolean;
  eventCompletedAt: string | null;
  eventProgressContribution: number;
  goalId: string | null;
  goalCurrent: number | null;
  goalCompleted: boolean | null;
};

function client() {
  const value = getSupabaseClient();
  if (!value) throw new Error("Supabase is not configured.");
  return value;
}

export async function loadWorkspace(ownerId: string): Promise<Workspace> {
  const api = client();
  const [
    { data: profileRow, error: profileError },
    { data: categoryRows, error: categoryError },
    { data: goalRows, error: goalError },
    { data: sessionRows, error: sessionError },
  ] = await Promise.all([
    api.from("profiles").select("theme_key").eq("id", ownerId).single(),
    api.from("categories").select("id,name,short_label,color,icon_key,is_default").eq("owner_id", ownerId).order("sort_order"),
    api
      .from("goals")
      .select("id,title,category_id,current_value,target_value,log_increment,measurement,unit,notes,period_type,period_start,period_end,due_date,repeat_until_due,status")
      .eq("owner_id", ownerId)
      .order("period_start"),
    api
      .from("scheduled_sessions")
      .select("id,goal_id,event_kind,title,starts_at,ends_at,timezone,notes,link_url,location,color,completed,completed_at,progress_contribution")
      .eq("owner_id", ownerId)
      .order("starts_at"),
  ]);
  if (profileError) throw profileError;
  if (categoryError) throw categoryError;
  if (goalError) throw goalError;
  if (sessionError) throw sessionError;

  const categories: Category[] = ((categoryRows ?? []) as CategoryRow[]).map((row) => ({
    id: row.id,
    label: row.name,
    shortLabel: row.short_label,
    color: row.color,
    icon: row.icon_key,
    isDefault: row.is_default,
  }));
  const goals: Goal[] = ((goalRows ?? []) as GoalRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category_id,
    current: Number(row.current_value),
    target: Number(row.target_value),
    increment: Number(row.log_increment),
    measurement: row.measurement,
    unit: row.unit,
    notes: row.notes ?? "",
    periodType: row.period_type,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    dueDate: row.due_date,
    repeatUntilDue: row.repeat_until_due,
    completed: row.status === "completed",
  }));
  const events: CalendarEvent[] = ((sessionRows ?? []) as ScheduledSessionRow[]).map((row) => ({
    id: row.id,
    goalId: row.goal_id,
    kind: row.event_kind,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    timezone: row.timezone,
    notes: row.notes ?? "",
    linkUrl: row.link_url ?? "",
    location: row.location ?? "",
    color: row.color,
    completed: row.completed,
    completedAt: row.completed_at,
    progressContribution: Number(row.progress_contribution),
  }));
  return {
    categories,
    goals,
    events,
    themeKey: (profileRow?.theme_key as ThemeKey | undefined) ?? "lime",
  };
}

export async function createCategory(ownerId: string, category: Category) {
  const { data, error } = await client().from("categories").insert({
    owner_id: ownerId,
    name: category.label,
    short_label: category.shortLabel,
    color: category.color,
    icon_key: category.icon,
    is_default: false,
  }).select("id").single();
  if (error) throw error;
  return { ...category, id: data.id as string };
}

export async function createGoal(ownerId: string, goal: Goal, category: Category) {
  const { data, error } = await client().from("goals").insert({
    owner_id: ownerId,
    title: goal.title,
    notes: goal.notes || null,
    category_id: goal.category,
    category_name: category.shortLabel,
    category_color: category.color,
    current_value: goal.current,
    target_value: goal.target,
    log_increment: goal.increment,
    measurement: goal.measurement,
    unit: goal.unit,
    week_start: goal.periodStart,
    period_type: goal.periodType,
    period_start: goal.periodStart,
    period_end: goal.periodEnd,
    due_date: goal.dueDate,
    repeat_until_due: goal.repeatUntilDue,
    due_day: new Date(`${goal.dueDate}T12:00:00`).toLocaleDateString("en-NZ", { weekday: "long" }),
    status: goal.completed ? "completed" : "active",
  }).select("id").single();
  if (error) throw error;
  return { ...goal, id: data.id as string };
}

export async function createCalendarEvent(ownerId: string, event: CalendarEvent) {
  const { data, error } = await client().from("scheduled_sessions").insert({
    owner_id: ownerId,
    goal_id: event.goalId,
    event_kind: event.kind,
    title: event.title,
    starts_at: event.startsAt,
    ends_at: event.endsAt,
    timezone: event.timezone,
    notes: event.notes || null,
    link_url: event.linkUrl || null,
    location: event.location || null,
    color: event.color,
    completed: event.completed,
    completed_at: event.completedAt,
    progress_contribution: event.progressContribution,
  }).select("id").single();
  if (error) throw error;
  return { ...event, id: data.id as string };
}

export async function updateCalendarEvent(ownerId: string, event: CalendarEvent) {
  const { error } = await client().from("scheduled_sessions").update({
    goal_id: event.goalId,
    event_kind: event.kind,
    title: event.title,
    starts_at: event.startsAt,
    ends_at: event.endsAt,
    timezone: event.timezone,
    notes: event.notes || null,
    link_url: event.linkUrl || null,
    location: event.location || null,
    color: event.color,
    updated_at: new Date().toISOString(),
  }).eq("id", event.id).eq("owner_id", ownerId);
  if (error) throw error;
  return event;
}

export async function deleteCalendarEvent(ownerId: string, eventId: string) {
  const { error } = await client().from("scheduled_sessions").delete().eq("id", eventId).eq("owner_id", ownerId);
  if (error) throw error;
}

export async function setCalendarEventCompletion(
  _ownerId: string,
  eventId: string,
  completed: boolean,
): Promise<EventCompletionResult> {
  const { data, error } = await client().rpc("set_calendar_event_completion", {
    p_event_id: eventId,
    p_completed: completed,
  }).single();
  if (error) throw error;
  const row = data as EventCompletionRow;
  return {
    eventId: row.event_id,
    eventCompleted: row.event_completed,
    eventCompletedAt: row.event_completed_at,
    eventProgressContribution: Number(row.event_progress_contribution),
    goalId: row.linked_goal_id,
    goalCurrent: row.goal_current === null ? null : Number(row.goal_current),
    goalCompleted: row.goal_completed,
  };
}

export async function deleteGoal(ownerId: string, goalId: string) {
  const { error } = await client().from("goals").delete().eq("id", goalId).eq("owner_id", ownerId);
  if (error) throw error;
}

export async function updateGoalProgress(_ownerId: string, goal: Goal) {
  const { error } = await client().rpc("set_goal_progress", {
    p_goal_id: goal.id,
    p_current: goal.current,
    p_completed: goal.completed,
  });
  if (error) throw error;
}

export async function updateTheme(ownerId: string, themeKey: ThemeKey) {
  const { error } = await client().from("profiles").update({
    theme_key: themeKey,
    updated_at: new Date().toISOString(),
  }).eq("id", ownerId);
  if (error) throw error;
}
