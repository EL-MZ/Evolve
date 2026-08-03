import type { CalendarEvent, Goal, GoalMeasurement, GoalPeriodType, ThemeKey, Workspace } from "./types";

type LegacyGoal = Partial<Goal> & {
  weekStart?: string;
  dueDay?: string;
};

type StoredWorkspace = Partial<Workspace> & {
  goals?: LegacyGoal[];
};

function addDays(value: string, amount: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return date.toISOString().slice(0, 10);
}

function normalizeGoal(goal: LegacyGoal): Goal | null {
  if (!goal.id || !goal.title || !goal.category) return null;
  const periodStart = goal.periodStart ?? goal.weekStart ?? new Date().toISOString().slice(0, 10);
  const periodType = (goal.periodType ?? "weekly") as GoalPeriodType;
  const periodEnd = goal.periodEnd ?? addDays(periodStart, periodType === "weekly" ? 6 : 0);
  return {
    id: goal.id,
    title: goal.title,
    category: goal.category,
    current: Number(goal.current ?? 0),
    target: Math.max(Number(goal.target ?? 1), 1),
    increment: Math.max(Number(goal.increment ?? 1), 0.01),
    measurement: (goal.measurement ?? (goal.unit === "pages" ? "pages" : "sessions")) as GoalMeasurement,
    unit: goal.unit || "sessions",
    notes: goal.notes ?? "",
    periodType,
    periodStart,
    periodEnd,
    dueDate: goal.dueDate ?? periodEnd,
    repeatUntilDue: Boolean(goal.repeatUntilDue),
    completed: Boolean(goal.completed),
  };
}

function normalizeEvent(event: Partial<CalendarEvent>): CalendarEvent | null {
  if (!event.id || !event.title || !event.startsAt || !event.endsAt) return null;
  return {
    id: event.id,
    goalId: event.goalId ?? null,
    kind: event.kind ?? (event.goalId ? "goal_session" : "event"),
    title: event.title,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    timezone: event.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    notes: event.notes ?? "",
    linkUrl: event.linkUrl ?? "",
    location: event.location ?? "",
    color: event.color ?? "#A8F06A",
    completed: Boolean(event.completed),
    completedAt: event.completedAt ?? null,
    progressContribution: Math.max(Number(event.progressContribution ?? 0), 0),
  };
}

export function workspaceStorageKey(userId: string) {
  return `evolve-workspace-v2:${userId}`;
}

export function loadLocalWorkspace(userId: string, fallback: Workspace): Workspace {
  const raw = window.localStorage.getItem(workspaceStorageKey(userId));
  if (!raw) return fallback;
  try {
    const stored = JSON.parse(raw) as StoredWorkspace;
    return {
      categories: stored.categories?.length ? stored.categories : fallback.categories,
      goals: (stored.goals ?? []).map(normalizeGoal).filter((goal): goal is Goal => Boolean(goal)),
      events: (stored.events ?? []).map(normalizeEvent).filter((event): event is CalendarEvent => Boolean(event)),
      themeKey: (stored.themeKey ?? "lime") as ThemeKey,
    };
  } catch {
    window.localStorage.removeItem(workspaceStorageKey(userId));
    return fallback;
  }
}

export function saveLocalWorkspace(userId: string, workspace: Workspace) {
  window.localStorage.setItem(workspaceStorageKey(userId), JSON.stringify(workspace));
}
