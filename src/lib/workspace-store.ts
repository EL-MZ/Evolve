import { getSupabaseClient } from "./supabase";
import type { CalendarEvent, Category, CategoryIcon, Goal } from "./types";

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
  unit: string;
  due_day: string;
  status: string;
  week_start: string;
};

type ScheduledSessionRow = {
  id: string;
  goal_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
};

function client() {
  const value = getSupabaseClient();
  if (!value) throw new Error("Supabase is not configured.");
  return value;
}

export async function loadWorkspace(ownerId: string) {
  const api = client();
  const [
    { data: categoryRows, error: categoryError },
    { data: goalRows, error: goalError },
    { data: sessionRows, error: sessionError },
  ] = await Promise.all([
    api.from("categories").select("id,name,short_label,color,icon_key,is_default").eq("owner_id", ownerId).order("sort_order"),
    api.from("goals").select("id,title,category_id,current_value,target_value,log_increment,unit,due_day,status,week_start").eq("owner_id", ownerId).order("sort_order"),
    api.from("scheduled_sessions").select("id,goal_id,title,starts_at,ends_at,timezone").eq("owner_id", ownerId).order("starts_at"),
  ]);
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
    unit: row.unit,
    dueDay: row.due_day,
    completed: row.status === "completed",
    weekStart: row.week_start,
  }));
  const events: CalendarEvent[] = ((sessionRows ?? []) as ScheduledSessionRow[]).map((row) => ({
    id: row.id,
    goalId: row.goal_id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    timezone: row.timezone,
  }));
  return { categories, goals, events };
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
    category_id: goal.category,
    category_name: category.shortLabel,
    category_color: category.color,
    current_value: goal.current,
    target_value: goal.target,
    log_increment: goal.increment,
    unit: goal.unit,
    due_day: goal.dueDay,
    week_start: goal.weekStart,
    status: goal.completed ? "completed" : "active",
  }).select("id").single();
  if (error) throw error;
  return { ...goal, id: data.id as string };
}

export async function createCalendarEvent(ownerId: string, event: CalendarEvent) {
  const { data, error } = await client().from("scheduled_sessions").insert({
    owner_id: ownerId,
    goal_id: event.goalId,
    title: event.title,
    starts_at: event.startsAt,
    ends_at: event.endsAt,
    timezone: event.timezone,
  }).select("id").single();
  if (error) throw error;
  return { ...event, id: data.id as string };
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
