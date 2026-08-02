import { addDays, dateKey, rangesOverlap } from "./date";
import { createCalendarEvent, createGoal } from "./workspace-store";
import type { CalendarEvent, Category, Goal, WorkspaceUser } from "./types";

export type WeekDuplicationRequest = {
  sourceWeekStart: string;
  targetWeekStart: string;
  goalIds: string[];
  eventIds: string[];
};

export type WeekDuplicationResult = {
  goals: Goal[];
  events: CalendarEvent[];
  failedCount: number;
};

function utcDayNumber(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

export function weekDayOffset(sourceWeekStart: string, targetWeekStart: string) {
  return utcDayNumber(targetWeekStart) - utcDayNumber(sourceWeekStart);
}

export function shiftDateKey(value: string, dayOffset: number) {
  const [year, month, day] = value.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + dayOffset));
  return shifted.toISOString().slice(0, 10);
}

export function shiftEventTime(value: string, dayOffset: number) {
  const shifted = new Date(value);
  shifted.setDate(shifted.getDate() + dayOffset);
  return shifted.toISOString();
}

export function goalsInWeek(goals: Goal[], weekStart: string) {
  const start = new Date(`${weekStart}T12:00:00`);
  const weekEnd = dateKey(addDays(start, 6));
  return goals.filter((goal) => rangesOverlap(goal.periodStart, goal.periodEnd, weekStart, weekEnd));
}

export function eventsInWeek(events: CalendarEvent[], weekStart: string) {
  const start = new Date(`${weekStart}T12:00:00`);
  const weekEnd = dateKey(addDays(start, 6));
  return events.filter((event) => {
    const eventDate = dateKey(new Date(event.startsAt));
    return eventDate >= weekStart && eventDate <= weekEnd;
  });
}

function copiedGoal(goal: Goal, dayOffset: number): Goal {
  return {
    ...goal,
    id: crypto.randomUUID(),
    current: 0,
    completed: false,
    periodStart: shiftDateKey(goal.periodStart, dayOffset),
    periodEnd: shiftDateKey(goal.periodEnd, dayOffset),
    dueDate: shiftDateKey(goal.dueDate, dayOffset),
  };
}

function copiedEvent(event: CalendarEvent, dayOffset: number, goalId: string | null): CalendarEvent {
  return {
    ...event,
    id: crypto.randomUUID(),
    goalId,
    startsAt: shiftEventTime(event.startsAt, dayOffset),
    endsAt: shiftEventTime(event.endsAt, dayOffset),
  };
}

export async function duplicateWorkspaceWeek({
  user,
  categories,
  goals,
  events,
  request,
}: {
  user: WorkspaceUser;
  categories: Category[];
  goals: Goal[];
  events: CalendarEvent[];
  request: WeekDuplicationRequest;
}): Promise<WeekDuplicationResult> {
  const dayOffset = weekDayOffset(request.sourceWeekStart, request.targetWeekStart);
  const copiedGoals: Goal[] = [];
  const copiedEvents: CalendarEvent[] = [];
  const goalIdMap = new Map<string, string>();
  let failedCount = 0;

  for (const goalId of request.goalIds) {
    const original = goals.find((goal) => goal.id === goalId);
    const category = categories.find((item) => item.id === original?.category);
    if (!original || !category) {
      failedCount += 1;
      continue;
    }

    try {
      const copy = copiedGoal(original, dayOffset);
      const saved = user.mode === "supabase" ? await createGoal(user.id, copy, category) : copy;
      copiedGoals.push(saved);
      goalIdMap.set(original.id, saved.id);
    } catch {
      failedCount += 1;
    }
  }

  for (const eventId of request.eventIds) {
    const original = events.find((event) => event.id === eventId);
    if (!original) {
      failedCount += 1;
      continue;
    }

    try {
      const linkedGoalId = original.goalId ? goalIdMap.get(original.goalId) ?? original.goalId : null;
      const copy = copiedEvent(original, dayOffset, linkedGoalId);
      const saved = user.mode === "supabase" ? await createCalendarEvent(user.id, copy) : copy;
      copiedEvents.push(saved);
    } catch {
      failedCount += 1;
    }
  }

  return { goals: copiedGoals, events: copiedEvents, failedCount };
}
