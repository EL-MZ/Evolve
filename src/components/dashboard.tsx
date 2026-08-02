"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  CircleUserRound,
  Download,
  Dumbbell,
  Flame,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Plus,
  Printer,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { AddGoalModal } from "./add-goal-modal";
import { ProgressRing } from "./progress-ring";
import { categories, initialGoals } from "@/lib/demo-data";
import { addWeeks, formatWeek, startOfWeek } from "@/lib/date";
import { downloadWeekCalendar } from "@/lib/exports";
import type { Goal } from "@/lib/types";

const iconByCategory = {
  work: BriefcaseBusiness,
  sport: Dumbbell,
  reading: BookOpen,
  study: GraduationCap,
};

const STORAGE_KEY = "evolve-demo-goals";

export function Dashboard() {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [weekOffset, setWeekOffset] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try { setGoals(JSON.parse(stored) as Goal[]); } catch { /* Keep the safe demo data. */ }
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }, [goals, hydrated]);

  const weekStart = addWeeks(startOfWeek(new Date()), weekOffset);
  const completed = goals.filter((goal) => goal.completed).length;
  const overall = goals.length ? Math.round(goals.reduce((sum, goal) => sum + Math.min(goal.current / goal.target, 1), 0) / goals.length * 100) : 0;
  const focusGoals = goals.filter((goal) => !goal.completed).slice(0, 3);

  const activity = useMemo(() => [35, 62, 48, 76, overall, 54, 20], [overall]);

  function updateGoal(id: string, updater: (goal: Goal) => Goal) {
    setGoals((current) => current.map((goal) => goal.id === id ? updater(goal) : goal));
  }

  function toggleGoal(goal: Goal) {
    updateGoal(goal.id, (current) => ({ ...current, completed: !current.completed, current: !current.completed ? current.target : 0 }));
  }

  function incrementGoal(goal: Goal) {
    const step = goal.target >= 10 ? Math.max(1, Math.round(goal.target / 10)) : 1;
    updateGoal(goal.id, (current) => {
      const next = Math.min(current.target, current.current + step);
      return { ...current, current: next, completed: next >= current.target };
    });
  }

  function addGoal(goal: Goal) {
    setGoals((current) => [...current, goal]);
    setModalOpen(false);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand"><span className="brand-mark"><Sparkles size={19} /></span><span>evolve</span></div>
        <button className="sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X /></button>
        <nav aria-label="Main navigation">
          <a className="nav-link active" href="#overview"><LayoutDashboard size={19} /> My week</a>
          <a className="nav-link" href="#goals"><Target size={19} /> Goals</a>
          <a className="nav-link" href="#schedule"><CalendarDays size={19} /> Schedule</a>
        </nav>
        <div className="sidebar-spacer" />
        <div className="streak-card">
          <span className="streak-icon"><Flame size={20} /></span>
          <div><strong>6 week streak</strong><span>Keep showing up.</span></div>
        </div>
        <button className="profile-button"><CircleUserRound size={26} /><span><strong>Mehdi</strong><small>Demo workspace</small></span><ChevronDown size={16} /></button>
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
              {exportOpen && (
                <div className="export-menu">
                  <button onClick={() => { window.print(); setExportOpen(false); }}><Printer size={17} /><span><strong>Print or save PDF</strong><small>Clean weekly plan</small></span></button>
                  <button onClick={() => { downloadWeekCalendar(goals, weekStart); setExportOpen(false); }}><CalendarDays size={17} /><span><strong>Calendar file</strong><small>Works with Google Calendar</small></span></button>
                </div>
              )}
            </div>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={19} /><span /></button>
            <button className="primary-button" onClick={() => setModalOpen(true)}><Plus size={18} /> Add goal</button>
          </div>
        </header>

        <section className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Your weekly momentum</p>
            <h1>Make this week<br /><em>count.</em></h1>
            <p>Focus on the few things that move your work, body and mind forward.</p>
          </div>
          <div className="hero-progress">
            <ProgressRing value={overall} />
            <div className="hero-stat"><span>Goals completed</span><strong>{completed}<small> / {goals.length}</small></strong></div>
            <div className="hero-stat"><span>Strongest area</span><strong className="lime-text">Reading</strong></div>
          </div>
        </section>

        <section className="content-grid">
          <div className="goal-area" id="goals">
            <div className="section-heading">
              <div><p className="eyebrow">Four pillars</p><h2>Your goals</h2></div>
              <span>{goals.length} active this week</span>
            </div>
            <div className="goal-grid">
              {categories.map((category) => {
                const CategoryIcon = iconByCategory[category.id];
                const categoryGoals = goals.filter((goal) => goal.category === category.id);
                const percent = categoryGoals.length ? Math.round(categoryGoals.reduce((sum, goal) => sum + Math.min(goal.current / goal.target, 1), 0) / categoryGoals.length * 100) : 0;
                return (
                  <article className="goal-card" key={category.id} style={{ "--category": category.color } as React.CSSProperties}>
                    <div className="goal-card-header">
                      <span className="category-icon"><CategoryIcon size={19} /></span>
                      <div><span>{category.shortLabel}</span><strong>{category.label}</strong></div>
                      <span className="category-percent">{percent}%</span>
                    </div>
                    <div className="category-bar"><span style={{ width: `${percent}%` }} /></div>
                    <div className="goal-list">
                      {categoryGoals.map((goal) => {
                        const progress = Math.round(Math.min(goal.current / goal.target, 1) * 100);
                        return (
                          <div className={`goal-row ${goal.completed ? "goal-done" : ""}`} key={goal.id}>
                            <button className="check-button" onClick={() => toggleGoal(goal)} aria-label={`${goal.completed ? "Reopen" : "Complete"} ${goal.title}`}>{goal.completed && <Check size={15} />}</button>
                            <div className="goal-main">
                              <strong>{goal.title}</strong>
                              <div className="mini-progress"><span style={{ width: `${progress}%` }} /></div>
                              <small>{goal.current} of {goal.target} {goal.unit} · by {goal.dueDay}</small>
                            </div>
                            {!goal.completed && <button className="log-button" onClick={() => incrementGoal(goal)}>+ log</button>}
                          </div>
                        );
                      })}
                      {!categoryGoals.length && <p className="empty-category">No goal here yet.</p>}
                    </div>
                    <button className="add-inline" onClick={() => setModalOpen(true)}><Plus size={16} /> Add {category.shortLabel.toLowerCase()} goal</button>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="right-rail" id="schedule">
            <section className="rail-card focus-card">
              <div className="rail-heading"><div><p className="eyebrow">Right now</p><h3>Today’s focus</h3></div><span className="today-badge">3 items</span></div>
              <div className="focus-list">
                {focusGoals.map((goal, index) => {
                  const category = categories.find((item) => item.id === goal.category)!;
                  return <button className="focus-item" key={goal.id} onClick={() => incrementGoal(goal)}><span className="focus-number">0{index + 1}</span><span><strong>{goal.title}</strong><small><i style={{ background: category.color }} />{category.shortLabel} · log progress</small></span><ArrowRight size={16} /></button>;
                })}
              </div>
            </section>

            <section className="rail-card rhythm-card">
              <div className="rail-heading"><div><p className="eyebrow">Consistency</p><h3>Weekly rhythm</h3></div><Flame className="coral-text" size={21} /></div>
              <div className="activity-bars" aria-label="Activity by day">
                {activity.map((value, index) => <div key={index}><span style={{ height: `${Math.max(value, 12)}%` }} className={index === 4 ? "today-bar" : ""} /><small>{["M", "T", "W", "T", "F", "S", "S"][index]}</small></div>)}
              </div>
              <p><strong>Nice pace.</strong> You logged progress on 4 days this week.</p>
            </section>

            <section className="quote-card">
              <Sparkles size={20} />
              <blockquote>“Small steps, repeated, become a different life.”</blockquote>
              <span>Weekly reminder</span>
            </section>
          </aside>
        </section>
      </main>
      {modalOpen && <AddGoalModal onClose={() => setModalOpen(false)} onAdd={addGoal} />}
    </div>
  );
}
