"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import {
  CalendarDays,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  Plus,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { EventModal } from "./event-modal";
import { addDays, dateKey, rangesOverlap, startOfWeek } from "@/lib/date";
import { defaultCategories } from "@/lib/demo-data";
import { themeStyle, themes } from "@/lib/themes";
import type { CalendarEvent, Category, Goal, ThemeKey, Workspace, WorkspaceUser } from "@/lib/types";
import { loadLocalWorkspace, saveLocalWorkspace } from "@/lib/workspace-local";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  loadWorkspace,
  updateCalendarEvent,
  updateTheme,
} from "@/lib/workspace-store";

function categoryForGoal(goalId: string | null, goals: Goal[], categories: Category[]) {
  const goal = goals.find((item) => item.id === goalId);
  return categories.find((item) => item.id === goal?.category);
}

function newEventForRange(start: Date, end: Date, goal?: Goal, color = "#A8F06A"): CalendarEvent {
  return {
    id: `new-${crypto.randomUUID()}`,
    goalId: goal?.id ?? null,
    kind: goal ? "goal_session" : "event",
    title: goal?.title ?? "",
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notes: "",
    linkUrl: "",
    location: "",
    color,
  };
}

export function ScheduleWorkspace({
  user,
  onSignOut,
}: {
  user: WorkspaceUser;
  onSignOut: () => Promise<void>;
}) {
  const externalGoalsRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [themeKey, setThemeKey] = useState<ThemeKey>("lime");
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [visibleStart, setVisibleStart] = useState(dateKey(startOfWeek(new Date())));
  const [visibleEnd, setVisibleEnd] = useState(dateKey(addDays(startOfWeek(new Date()), 6)));
  const [hydrated, setHydrated] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    let active = true;
    async function hydrate() {
      try {
        const workspace = user.mode === "supabase"
          ? await loadWorkspace(user.id)
          : loadLocalWorkspace(user.id, { categories: defaultCategories, goals: [], events: [], themeKey: "lime" });
        if (!active) return;
        setCategories(workspace.categories.length ? workspace.categories : defaultCategories);
        setGoals(workspace.goals);
        setEvents(workspace.events);
        setThemeKey(workspace.themeKey);
      } catch {
        if (!active) return;
        setStorageError("Your planning tables are not ready yet. Apply Supabase migration 0004, then reload.");
      } finally {
        if (active) setHydrated(true);
      }
    }
    void hydrate();
    return () => { active = false; };
  }, [user.id, user.mode]);

  useEffect(() => {
    if (hydrated && user.mode === "preview") {
      saveLocalWorkspace(user.id, { categories, goals, events, themeKey } satisfies Workspace);
    }
  }, [categories, events, goals, hydrated, themeKey, user.id, user.mode]);

  const availableGoals = useMemo(
    () => goals.filter((goal) => !goal.completed && rangesOverlap(goal.periodStart, goal.periodEnd, visibleStart, visibleEnd)),
    [goals, visibleEnd, visibleStart],
  );

  useEffect(() => {
    if (!externalGoalsRef.current) return;
    const draggable = new Draggable(externalGoalsRef.current, {
      itemSelector: ".draggable-goal",
      eventData(element) {
        const goalId = element.getAttribute("data-goal-id") ?? "";
        const goal = goals.find((item) => item.id === goalId);
        const category = categoryForGoal(goalId, goals, categories);
        return {
          title: goal?.title ?? "Goal session",
          duration: "01:00",
          backgroundColor: category?.color ?? "#A8F06A",
          borderColor: category?.color ?? "#A8F06A",
          extendedProps: { goalId },
        };
      },
    });
    return () => draggable.destroy();
  }, [categories, goals]);

  useEffect(() => {
    if (window.matchMedia("(max-width: 700px)").matches) {
      calendarRef.current?.getApi().changeView("timeGridDay");
    }
  }, []);

  async function createEvent(event: CalendarEvent) {
    try {
      const cleanEvent = { ...event, id: event.id.startsWith("new-") ? crypto.randomUUID() : event.id };
      const saved = user.mode === "supabase" ? await createCalendarEvent(user.id, cleanEvent) : cleanEvent;
      setEvents((current) => [...current, saved]);
      setEditingEvent(null);
      setStorageError("");
      return saved;
    } catch {
      setStorageError("That calendar item could not be saved. Please try again.");
      return null;
    }
  }

  async function saveEvent(event: CalendarEvent) {
    if (event.id.startsWith("new-")) {
      await createEvent(event);
      return;
    }
    const previous = events.find((item) => item.id === event.id);
    setEvents((current) => current.map((item) => item.id === event.id ? event : item));
    try {
      if (user.mode === "supabase") await updateCalendarEvent(user.id, event);
      setEditingEvent(null);
      setStorageError("");
    } catch {
      if (previous) setEvents((current) => current.map((item) => item.id === previous.id ? previous : item));
      setStorageError("That change could not be saved. Please try again.");
    }
  }

  async function removeEvent(event: CalendarEvent) {
    if (!window.confirm(`Delete “${event.title}”? This cannot be undone.`)) return;
    try {
      if (user.mode === "supabase") await deleteCalendarEvent(user.id, event.id);
      setEvents((current) => current.filter((item) => item.id !== event.id));
      setEditingEvent(null);
      setStorageError("");
    } catch {
      setStorageError("That calendar item could not be deleted. Please try again.");
    }
  }

  async function duplicateEvent(event: CalendarEvent) {
    const start = new Date(event.startsAt);
    const end = new Date(event.endsAt);
    start.setDate(start.getDate() + 1);
    end.setDate(end.getDate() + 1);
    const saved = await createEvent({
      ...event,
      id: crypto.randomUUID(),
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
    });
    if (saved) setEditingEvent(saved);
  }

  async function moveEvent(eventId: string, startsAt: string, endsAt: string, revert: () => void) {
    const previous = events.find((item) => item.id === eventId);
    if (!previous) return;
    const next = { ...previous, startsAt, endsAt };
    setEvents((current) => current.map((item) => item.id === eventId ? next : item));
    try {
      if (user.mode === "supabase") await updateCalendarEvent(user.id, next);
      setStorageError("");
    } catch {
      revert();
      setEvents((current) => current.map((item) => item.id === eventId ? previous : item));
      setStorageError("That calendar move could not be saved. Please try again.");
    }
  }

  function openGoalSession(goal: Goal) {
    const now = new Date();
    const today = dateKey(now);
    const date = today >= goal.periodStart && today <= goal.periodEnd
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), Math.max(now.getHours() + 1, 8), 0)
      : new Date(`${goal.periodStart}T09:00:00`);
    const category = categoryForGoal(goal.id, goals, categories);
    setEditingEvent(newEventForRange(date, new Date(date.getTime() + 60 * 60_000), goal, category?.color));
  }

  async function selectTheme(next: ThemeKey) {
    const previous = themeKey;
    setThemeKey(next);
    if (user.mode === "supabase") {
      try {
        await updateTheme(user.id, next);
      } catch {
        setThemeKey(previous);
        setStorageError("That theme could not be saved. Please try again.");
      }
    }
  }

  if (!hydrated) {
    return <div className="workspace-loading"><span className="brand-mark"><Sparkles size={19} /></span><p>Preparing your calendar…</p></div>;
  }

  return (
    <div className="app-shell schedule-shell" style={themeStyle(themeKey)}>
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand"><span className="brand-mark"><Sparkles size={19} /></span><span>evolve</span></div>
        <button className="sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X /></button>
        <nav aria-label="Main navigation">
          <Link className="nav-link" href="/"><LayoutDashboard size={19} /> My week</Link>
          <Link className="nav-link" href="/#goals"><Target size={19} /> Goals</Link>
          <Link className="nav-link active" href="/schedule"><CalendarDays size={19} /> Schedule</Link>
        </nav>
        <div className="sidebar-spacer" />
        <div className="theme-picker">
          <span><Palette size={14} /> Theme</span>
          <div>
            {themes.map((theme) => <button
              aria-label={theme.label}
              aria-pressed={theme.key === themeKey}
              className={theme.key === themeKey ? "selected" : ""}
              key={theme.key}
              onClick={() => void selectTheme(theme.key)}
              style={{ background: theme.accent }}
              title={theme.label}
            />)}
          </div>
        </div>
        <button className="profile-button schedule-profile" onClick={() => void onSignOut()}>
          <CircleUserRound size={26} />
          <span><strong>{user.displayName}</strong><small>{user.mode === "supabase" ? "Private workspace" : "Device preview"}</small></span>
          <LogOut size={16} />
        </button>
      </aside>

      <main className="schedule-main">
        <header className="schedule-header">
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu /></button>
          <div>
            <p className="eyebrow">Shape your time</p>
            <h1>Weekly schedule</h1>
            <p>Drag a goal into the calendar as many times as you need, or select empty time to add an event.</p>
          </div>
          <button className="primary-button" onClick={() => {
            const start = new Date();
            start.setMinutes(0, 0, 0);
            start.setHours(start.getHours() + 1);
            setEditingEvent(newEventForRange(start, new Date(start.getTime() + 60 * 60_000)));
          }}><Plus size={18} /> Add event</button>
        </header>

        {storageError && <div className="storage-banner" role="alert">{storageError}</div>}

        <div className="planner-layout">
          <aside className="goal-drawer">
            <div>
              <p className="eyebrow">Unscheduled goals</p>
              <h2>Drag into your week</h2>
              <p>Goals stay here after dropping, so one goal can have several sessions.</p>
            </div>
            <div className="draggable-goals" ref={externalGoalsRef}>
              {availableGoals.map((goal) => {
                const category = categoryForGoal(goal.id, goals, categories);
                return <article className="draggable-goal" data-goal-id={goal.id} key={goal.id} style={{ "--category": category?.color ?? "#A8F06A" } as React.CSSProperties}>
                  <span />
                  <div>
                    <strong>{goal.title}</strong>
                    <small>{goal.current} / {goal.target} {goal.unit} · {goal.periodType}</small>
                  </div>
                  <button onClick={(clickEvent) => { clickEvent.stopPropagation(); openGoalSession(goal); }}>Schedule</button>
                </article>;
              })}
              {!availableGoals.length && <div className="goal-drawer-empty"><Target size={22} /><p>No active goals overlap this week.</p><Link href="/#goals">Add a goal</Link></div>}
            </div>
          </aside>

          <section className="calendar-workspace" aria-label="Weekly hourly schedule">
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{ left: "prev,next today", center: "title", right: "timeGridWeek,timeGridDay" }}
              buttonText={{ today: "Today", week: "Week", day: "Day" }}
              allDaySlot={false}
              slotMinTime="06:00:00"
              slotMaxTime="23:00:00"
              scrollTime="08:00:00"
              slotDuration="00:30:00"
              nowIndicator
              editable
              selectable
              selectMirror
              droppable
              height="auto"
              events={events.map((event) => ({
                id: event.id,
                title: event.title,
                start: event.startsAt,
                end: event.endsAt,
                backgroundColor: event.color,
                borderColor: event.color,
                extendedProps: { goalId: event.goalId, location: event.location },
              }))}
              datesSet={(range) => {
                setVisibleStart(dateKey(range.start));
                setVisibleEnd(dateKey(addDays(range.end, -1)));
              }}
              select={(selection) => setEditingEvent(newEventForRange(selection.start, selection.end))}
              eventClick={(click) => {
                const event = events.find((item) => item.id === click.event.id);
                if (event) setEditingEvent(event);
              }}
              eventReceive={(received) => {
                const goalId = String(received.event.extendedProps.goalId ?? "");
                const goal = goals.find((item) => item.id === goalId);
                const start = received.event.start;
                if (!goal || !start) {
                  received.event.remove();
                  return;
                }
                const end = received.event.end ?? new Date(start.getTime() + 60 * 60_000);
                const category = categoryForGoal(goalId, goals, categories);
                received.event.remove();
                void createEvent(newEventForRange(start, end, goal, category?.color));
              }}
              eventDrop={(drop) => {
                if (!drop.event.start) return;
                const end = drop.event.end ?? new Date(drop.event.start.getTime() + 60 * 60_000);
                void moveEvent(drop.event.id, drop.event.start.toISOString(), end.toISOString(), drop.revert);
              }}
              eventResize={(resize) => {
                if (!resize.event.start || !resize.event.end) return;
                void moveEvent(resize.event.id, resize.event.start.toISOString(), resize.event.end.toISOString(), resize.revert);
              }}
              eventContent={(content) => <div className="calendar-event-content"><strong>{content.event.title}</strong>{content.event.extendedProps.location && <small>{String(content.event.extendedProps.location)}</small>}</div>}
            />
          </section>
        </div>
      </main>

      {editingEvent && <EventModal
        event={editingEvent}
        goals={goals}
        categories={categories}
        onClose={() => setEditingEvent(null)}
        onSave={saveEvent}
        onDelete={editingEvent.id.startsWith("new-") ? undefined : removeEvent}
        onDuplicate={editingEvent.id.startsWith("new-") ? undefined : duplicateEvent}
      />}
    </div>
  );
}
