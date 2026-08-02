"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleUserRound,
  Clock3,
  Download,
  Flame,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  Plus,
  Printer,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { AddCategoryModal } from "./add-category-modal";
import { AddGoalModal } from "./add-goal-modal";
import { ProgressRing } from "./progress-ring";
import { Walkthrough } from "./walkthrough";
import { iconByName } from "@/lib/category-icons";
import { defaultCategories } from "@/lib/demo-data";
import { addDays, addWeeks, dateKey, formatWeek, rangesOverlap, startOfWeek } from "@/lib/date";
import { downloadWeekCalendar } from "@/lib/exports";
import { themeStyle, themes } from "@/lib/themes";
import { loadLocalWorkspace, saveLocalWorkspace } from "@/lib/workspace-local";
import { createCalendarEvent, createCategory, createGoal, deleteGoal as deleteGoalRecord, loadWorkspace, updateGoalProgress, updateTheme } from "@/lib/workspace-store";
import type { CalendarEvent, Category, Goal, ThemeKey, Workspace, WorkspaceUser } from "@/lib/types";

export function Dashboard({ user, onSignOut }: { user: WorkspaceUser; onSignOut: () => Promise<void> }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [themeKey, setThemeKey] = useState<ThemeKey>("lime");
  const [weekOffset, setWeekOffset] = useState(0);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [initialCategory, setInitialCategory] = useState<string>();
  const [returnToGoal, setReturnToGoal] = useState(false);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState("");

  const weekStart = addWeeks(startOfWeek(new Date()), weekOffset);
  const weekKey = dateKey(weekStart);
  const weekEndKey = dateKey(addDays(weekStart, 6));
  const visibleGoals = goals.filter((goal) => rangesOverlap(goal.periodStart, goal.periodEnd, weekKey, weekEndKey));
  const tourKey = `evolve-tour-seen:${user.id}`;

  useEffect(() => {
    let active = true;

    async function hydrate() {
      if (user.mode === "supabase") {
        try {
          const workspace = await loadWorkspace(user.id);
          if (!active) return;
          setCategories(workspace.categories.length ? workspace.categories : defaultCategories);
          setGoals(workspace.goals);
          setEvents(workspace.events);
          setThemeKey(workspace.themeKey);
        } catch {
          if (!active) return;
          setStorageError("Your account is connected, but the workspace tables are not ready yet. Apply the latest Supabase migrations.");
          setCategories(defaultCategories);
          setGoals([]);
        }
      } else {
        const workspace = loadLocalWorkspace(user.id, { categories: defaultCategories, goals: [], events: [], themeKey: "lime" });
        setCategories(workspace.categories);
        setGoals(workspace.goals);
        setEvents(workspace.events);
        setThemeKey(workspace.themeKey);
      }
      if (!window.localStorage.getItem(tourKey)) setWalkthroughOpen(true);
      if (active) setHydrated(true);
    }

    const timer = window.setTimeout(() => void hydrate(), 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [tourKey, user.id, user.mode]);

  useEffect(() => {
    if (hydrated && user.mode === "preview") {
      saveLocalWorkspace(user.id, { categories, goals, events, themeKey } satisfies Workspace);
    }
  }, [categories, events, goals, hydrated, themeKey, user.id, user.mode]);

  const completed = visibleGoals.filter((goal) => goal.completed).length;
  const overall = visibleGoals.length ? Math.round(visibleGoals.reduce((sum, goal) => sum + Math.min(goal.current / goal.target, 1), 0) / visibleGoals.length * 100) : 0;
  const focusGoals = visibleGoals.filter((goal) => !goal.completed).slice(0, 3);
  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    return date;
  });
  const visibleEvents = events
    .filter((event) => weekDates.some((date) => dateKey(date) === dateKey(new Date(event.startsAt))))
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt));
  const strongestArea = (() => {
    let best: { label: string; score: number } | null = null;
    for (const category of categories) {
      const items = visibleGoals.filter((goal) => goal.category === category.id);
      if (!items.length) continue;
      const score = items.reduce((sum, goal) => sum + Math.min(goal.current / goal.target, 1), 0) / items.length;
      if (!best || score > best.score) best = { label: category.shortLabel, score };
    }
    return best?.label ?? "Fresh start";
  })();
  const activity = visibleGoals.length ? [18, 32, 24, 42, overall, Math.round(overall / 2), 12] : [0, 0, 0, 0, 0, 0, 0];

  function finishWalkthrough(createFirstGoal: boolean) {
    window.localStorage.setItem(tourKey, "true");
    setWalkthroughOpen(false);
    if (createFirstGoal) setGoalModalOpen(true);
  }

  function openGoal(categoryId?: string) {
    setInitialCategory(categoryId);
    setGoalModalOpen(true);
  }

  async function changeGoal(goal: Goal, next: Goal) {
    setGoals((current) => current.map((item) => item.id === goal.id ? next : item));
    if (user.mode === "supabase") {
      try { await updateGoalProgress(user.id, next); }
      catch {
        setGoals((current) => current.map((item) => item.id === goal.id ? goal : item));
        setStorageError("That progress update could not be saved. Please try again.");
      }
    }
  }

  function toggleGoal(goal: Goal) {
    const completed = !goal.completed;
    void changeGoal(goal, { ...goal, completed, current: completed ? goal.target : 0 });
  }

  function incrementGoal(goal: Goal) {
    const nextValue = Math.min(goal.target, goal.current + goal.increment);
    void changeGoal(goal, { ...goal, current: nextValue, completed: nextValue >= goal.target });
  }

  async function addGoal(goal: Goal, calendarEvent?: CalendarEvent) {
    const category = categories.find((item) => item.id === goal.category);
    if (!category) return;
    let savedGoal: Goal | undefined;
    try {
      savedGoal = user.mode === "supabase" ? await createGoal(user.id, goal, category) : goal;
      let savedEvent: CalendarEvent | undefined;
      if (calendarEvent) {
        const linkedEvent = { ...calendarEvent, goalId: savedGoal.id };
        savedEvent = user.mode === "supabase" ? await createCalendarEvent(user.id, linkedEvent) : linkedEvent;
      }
      setGoals((current) => [...current, savedGoal!]);
      if (savedEvent) setEvents((current) => [...current, savedEvent]);
      setGoalModalOpen(false);
      setStorageError("");
    } catch {
      if (savedGoal && user.mode === "supabase") {
        try { await deleteGoalRecord(user.id, savedGoal.id); } catch { /* The next reload will reconcile server state. */ }
      }
      setStorageError("Your goal or calendar event could not be saved. Please try again.");
    }
  }

  async function removeGoal(goal: Goal) {
    if (!window.confirm(`Delete “${goal.title}” and its calendar events? This cannot be undone.`)) return;
    try {
      if (user.mode === "supabase") await deleteGoalRecord(user.id, goal.id);
      setGoals((current) => current.filter((item) => item.id !== goal.id));
      setEvents((current) => current.filter((event) => event.goalId !== goal.id));
      setStorageError("");
    } catch { setStorageError("That goal could not be deleted. Please try again."); }
  }

  async function addCategory(category: Category) {
    try {
      const saved = user.mode === "supabase" ? await createCategory(user.id, category) : category;
      setCategories((current) => [...current, saved]);
      setCategoryModalOpen(false);
      setStorageError("");
      if (returnToGoal) {
        setInitialCategory(saved.id);
        setGoalModalOpen(true);
        setReturnToGoal(false);
      }
    } catch { setStorageError("Your category could not be saved. Please try again."); }
  }

  async function selectTheme(next: ThemeKey) {
    const previous = themeKey;
    setThemeKey(next);
    if (user.mode === "supabase") {
      try {
        await updateTheme(user.id, next);
        setStorageError("");
      } catch {
        setThemeKey(previous);
        setStorageError("That theme could not be saved. Please try again.");
      }
    }
  }

  if (!hydrated) return <div className="workspace-loading"><span className="brand-mark"><Sparkles size={19} /></span><p>Preparing your week…</p></div>;

  return (
    <div className="app-shell" style={themeStyle(themeKey)}>
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand"><span className="brand-mark"><Sparkles size={19} /></span><span>evolve</span></div>
        <button className="sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X /></button>
        <nav aria-label="Main navigation">
          <a className="nav-link active" href="#overview"><LayoutDashboard size={19} /> My week</a>
          <a className="nav-link" href="#goals"><Target size={19} /> Goals</a>
          <a className="nav-link" href="/schedule"><CalendarDays size={19} /> Schedule</a>
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
        <div className="streak-card">
          <span className="streak-icon"><Flame size={20} /></span>
          <div><strong>{visibleGoals.length ? "Momentum started" : "A fresh start"}</strong><span>{visibleGoals.length ? "Keep showing up." : "Your first step counts."}</span></div>
        </div>
        <div className="profile-wrap">
          <button className="profile-button" onClick={() => setProfileOpen((value) => !value)}><CircleUserRound size={26} /><span><strong>{user.displayName}</strong><small>{user.mode === "supabase" ? "Private workspace" : "Device preview"}</small></span><ChevronDown size={16} /></button>
          {profileOpen && <div className="profile-menu">
            <button onClick={() => { setWalkthroughOpen(true); setProfileOpen(false); }}><RotateCcw size={15} /> Replay walkthrough</button>
            <button onClick={() => void onSignOut()}><LogOut size={15} /> Sign out</button>
          </div>}
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu /></button>
          <div className="week-control">
            <button className="icon-button" onClick={() => setWeekOffset((value) => value - 1)} aria-label="Previous week"><ArrowLeft size={18} /></button>
            <button className="week-label" onClick={() => setWeekOffset(0)}>
              <span>{weekOffset === 0 ? "This week" : weekOffset > 0 ? `In ${weekOffset} week${weekOffset === 1 ? "" : "s"}` : `${Math.abs(weekOffset)} week${weekOffset === -1 ? "" : "s"} ago`}</span>
              <strong>{formatWeek(weekStart)}</strong>
            </button>
            <button className="icon-button" onClick={() => setWeekOffset((value) => value + 1)} aria-label="Next week"><ArrowRight size={18} /></button>
          </div>
          <div className="top-actions">
            <div className="export-wrap">
              <button className="secondary-button" onClick={() => setExportOpen((value) => !value)}><Download size={17} /> Export <ChevronDown size={15} /></button>
              {exportOpen && <div className="export-menu">
                <button onClick={() => { window.print(); setExportOpen(false); }}><Printer size={17} /><span><strong>Print or save PDF</strong><small>Clean weekly plan</small></span></button>
                <button disabled={!visibleEvents.length} onClick={() => { downloadWeekCalendar(visibleEvents); setExportOpen(false); }}><CalendarDays size={17} /><span><strong>Calendar file</strong><small>{visibleEvents.length ? "Export scheduled events" : "Schedule a goal first"}</small></span></button>
              </div>}
            </div>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={19} /></button>
            <button className="primary-button" onClick={() => openGoal()}><Plus size={18} /> Add goal</button>
          </div>
        </header>

        {storageError && <div className="storage-banner" role="alert">{storageError}</div>}

        <section className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{visibleGoals.length ? "Your weekly momentum" : `Welcome, ${user.displayName}`}</p>
            <h1>{visibleGoals.length ? <>Make this week<br /><em>count.</em></> : <>What will move<br />you <em>forward?</em></>}</h1>
            <p>{visibleGoals.length ? "Focus on the few things that move your work, body and mind forward." : "Your workspace is ready and completely clear. Add one meaningful goal to begin."}</p>
            {!visibleGoals.length && <button className="primary-button empty-cta" onClick={() => openGoal()}><Plus size={18} /> Add my first goal</button>}
          </div>
          <div className="hero-progress">
            <ProgressRing value={overall} />
            <div className="hero-stat"><span>Goals completed</span><strong>{completed}<small> / {visibleGoals.length}</small></strong></div>
            <div className="hero-stat"><span>Strongest area</span><strong className="lime-text">{strongestArea}</strong></div>
          </div>
        </section>

        <section className="content-grid">
          <div className="goal-area" id="goals">
            <div className="section-heading">
              <div><p className="eyebrow">Your areas</p><h2>Your goals</h2></div>
              <div className="section-actions"><span>{visibleGoals.length} active this week</span><button className="secondary-button" onClick={() => setCategoryModalOpen(true)}><Plus size={16} /> New category</button></div>
            </div>
            <div className="goal-grid">
              {categories.map((category) => {
                const CategoryIcon = iconByName[category.icon] ?? iconByName.heart;
                const categoryGoals = visibleGoals.filter((goal) => goal.category === category.id);
                const percent = categoryGoals.length ? Math.round(categoryGoals.reduce((sum, goal) => sum + Math.min(goal.current / goal.target, 1), 0) / categoryGoals.length * 100) : 0;
                return <article className="goal-card" key={category.id} style={{ "--category": category.color } as React.CSSProperties}>
                  <div className="goal-card-header">
                    <span className="category-icon"><CategoryIcon size={19} /></span>
                    <div><span>{category.shortLabel}</span><strong>{category.label}</strong></div>
                    <span className="category-percent">{percent}%</span>
                  </div>
                  <div className="category-bar"><span style={{ width: `${percent}%` }} /></div>
                  <div className="goal-list">
                    {categoryGoals.map((goal) => {
                      const progress = Math.round(Math.min(goal.current / goal.target, 1) * 100);
                      return <div className={`goal-row ${goal.completed ? "goal-done" : ""}`} key={goal.id}>
                        <button className="check-button" onClick={() => toggleGoal(goal)} aria-label={`${goal.completed ? "Reopen" : "Complete"} ${goal.title}`}>{goal.completed && <Check size={15} />}</button>
                        <div className="goal-main">
                          <strong>{goal.title}</strong>
                          <div className="goal-badges">
                            <span>{goal.periodType === "weekly" ? "Weekly" : goal.periodType === "monthly" ? "Monthly" : "Multi-week"}</span>
                            {goal.measurement === "pages" && <span>Reading</span>}
                          </div>
                          <div className="mini-progress"><span style={{ width: `${progress}%` }} /></div>
                          <small>{goal.current} of {goal.target} {goal.unit} · due {new Date(`${goal.dueDate}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</small>
                        </div>
                        <div className="goal-actions">
                          {!goal.completed && <button className="log-button" onClick={() => incrementGoal(goal)}>+{goal.increment} log</button>}
                          <button className="delete-goal-button" onClick={() => void removeGoal(goal)} aria-label={`Delete ${goal.title}`}><Trash2 size={13} /></button>
                        </div>
                      </div>;
                    })}
                    {!categoryGoals.length && <p className="empty-category">No goal here yet.</p>}
                  </div>
                  <button className="add-inline" onClick={() => openGoal(category.id)}><Plus size={16} /> Add {category.shortLabel.toLowerCase()} goal</button>
                </article>;
              })}
              <button className="new-category-card" onClick={() => setCategoryModalOpen(true)}><span><Plus size={22} /></span><strong>Add your own category</strong><small>Choose a name, colour and icon</small></button>
            </div>
          </div>

          <aside className="right-rail" id="schedule">
            <section className="rail-card calendar-card">
              <div className="rail-heading"><div><p className="eyebrow">Plan the week</p><h3>Calendar</h3></div><a className="calendar-open-link" href="/schedule" aria-label="Open full schedule"><CalendarDays size={21} /></a></div>
              <div className="calendar-week" aria-label="Weekly calendar">
                {weekDates.map((date) => {
                  const key = dateKey(date);
                  const count = visibleEvents.filter((event) => dateKey(new Date(event.startsAt)) === key).length;
                  return <div className={key === dateKey(new Date()) ? "calendar-day today" : "calendar-day"} key={key}>
                    <small>{date.toLocaleDateString(undefined, { weekday: "narrow" })}</small>
                    <strong>{date.getDate()}</strong>
                    {count > 0 && <span>{count}</span>}
                  </div>;
                })}
              </div>
              <div className="calendar-agenda">
                {visibleEvents.map((event) => {
                  const start = new Date(event.startsAt);
                  const end = new Date(event.endsAt);
                  const goal = goals.find((item) => item.id === event.goalId);
                  const category = categories.find((item) => item.id === goal?.category);
                  return <div className="calendar-event" key={event.id} style={{ "--event-color": category?.color ?? "#a8f06a" } as React.CSSProperties}>
                    <span className="event-date"><strong>{start.toLocaleDateString(undefined, { weekday: "short" })}</strong><small>{start.getDate()}</small></span>
                    <span className="event-copy"><strong>{event.title}</strong><small><Clock3 size={12} /> {start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}–{end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small></span>
                  </div>;
                })}
                {!visibleEvents.length && <div className="empty-calendar"><CalendarDays size={22} /><p>Drag goals into the full schedule or add an event.</p><a href="/schedule">Open schedule</a></div>}
              </div>
            </section>

            <section className="rail-card focus-card">
              <div className="rail-heading"><div><p className="eyebrow">Right now</p><h3>Today’s focus</h3></div><span className="today-badge">{focusGoals.length} items</span></div>
              <div className="focus-list">
                {focusGoals.map((goal, index) => {
                  const category = categories.find((item) => item.id === goal.category);
                  return <button className="focus-item" key={goal.id} onClick={() => incrementGoal(goal)}><span className="focus-number">0{index + 1}</span><span><strong>{goal.title}</strong><small><i style={{ background: category?.color }} />{category?.shortLabel} · log progress</small></span><ArrowRight size={16} /></button>;
                })}
                {!focusGoals.length && <div className="empty-focus"><Target size={22} /><p>Your first goal will appear here.</p></div>}
              </div>
            </section>

            <section className="rail-card rhythm-card">
              <div className="rail-heading"><div><p className="eyebrow">Consistency</p><h3>Weekly rhythm</h3></div><Flame className="coral-text" size={21} /></div>
              <div className="activity-bars" aria-label="Activity by day">
                {activity.map((value, index) => <div key={index}><span style={{ height: `${Math.max(value, 5)}%` }} className={index === 4 ? "today-bar" : ""} /><small>{["M", "T", "W", "T", "F", "S", "S"][index]}</small></div>)}
              </div>
              <p>{visibleGoals.length ? <><strong>Nice pace.</strong> Every small update builds your weekly rhythm.</> : <><strong>Ready when you are.</strong> Your rhythm will grow as you log progress.</>}</p>
            </section>

            <section className="quote-card"><Sparkles size={20} /><blockquote>“Small steps, repeated, become a different life.”</blockquote><span>Weekly reminder</span></section>
          </aside>
        </section>
      </main>

      {goalModalOpen && <AddGoalModal categories={categories} weekStart={weekKey} initialCategory={initialCategory} onClose={() => setGoalModalOpen(false)} onAdd={addGoal} onCreateCategory={() => { setGoalModalOpen(false); setReturnToGoal(true); setCategoryModalOpen(true); }} />}
      {categoryModalOpen && <AddCategoryModal onClose={() => { setCategoryModalOpen(false); setReturnToGoal(false); }} onAdd={addCategory} />}
      {walkthroughOpen && <Walkthrough onFinish={finishWalkthrough} />}
    </div>
  );
}
