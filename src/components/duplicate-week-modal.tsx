"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, CheckSquare2, Copy, Target, X } from "lucide-react";
import { addDays, dateKey, formatWeek } from "@/lib/date";
import { eventsInWeek, goalsInWeek, type WeekDuplicationRequest } from "@/lib/week-duplication";
import type { CalendarEvent, Goal } from "@/lib/types";

function previousWeek(weekStart: string) {
  return dateKey(addDays(new Date(`${weekStart}T12:00:00`), -7));
}

export function DuplicateWeekModal({
  goals,
  events,
  targetWeekStart,
  busy,
  onClose,
  onDuplicate,
}: {
  goals: Goal[];
  events: CalendarEvent[];
  targetWeekStart: string;
  busy: boolean;
  onClose: () => void;
  onDuplicate: (request: WeekDuplicationRequest) => Promise<void>;
}) {
  const initialSource = previousWeek(targetWeekStart);
  const initialGoals = goalsInWeek(goals, initialSource);
  const initialEvents = eventsInWeek(events, initialSource);
  const [sourceWeekStart, setSourceWeekStart] = useState(initialSource);
  const [selectedGoalIds, setSelectedGoalIds] = useState(() => new Set(initialGoals.map((goal) => goal.id)));
  const [selectedEventIds, setSelectedEventIds] = useState(() => new Set(initialEvents.map((event) => event.id)));

  const sourceGoals = useMemo(() => goalsInWeek(goals, sourceWeekStart), [goals, sourceWeekStart]);
  const sourceEvents = useMemo(() => eventsInWeek(events, sourceWeekStart), [events, sourceWeekStart]);
  const selectedCount = selectedGoalIds.size + selectedEventIds.size;

  function chooseSource(nextSource: string) {
    const nextGoals = goalsInWeek(goals, nextSource);
    const nextEvents = eventsInWeek(events, nextSource);
    setSourceWeekStart(nextSource);
    setSelectedGoalIds(new Set(nextGoals.map((goal) => goal.id)));
    setSelectedEventIds(new Set(nextEvents.map((event) => event.id)));
  }

  function moveSource(amount: number) {
    chooseSource(dateKey(addDays(new Date(`${sourceWeekStart}T12:00:00`), amount * 7)));
  }

  function toggle(setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) {
    setter((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const sourceDate = new Date(`${sourceWeekStart}T12:00:00`);
  const canMoveForward = dateKey(addDays(sourceDate, 7)) < targetWeekStart;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section className="modal duplicate-modal" role="dialog" aria-modal="true" aria-labelledby="duplicate-week-title">
        <button className="icon-button modal-close" onClick={onClose} disabled={busy} aria-label="Close duplicate week"><X size={18} /></button>
        <p className="eyebrow">Carry your plan forward</p>
        <h2 id="duplicate-week-title">Duplicate a previous week</h2>
        <p className="modal-intro">Choose any combination of goals and calendar items. Goal progress restarts at zero; schedule times and details move to the destination week.</p>

        <div className="duplicate-week-route">
          <div>
            <span>Copy from</span>
            <div className="duplicate-week-picker">
              <button className="icon-button" onClick={() => moveSource(-1)} aria-label="Earlier source week"><ArrowLeft size={17} /></button>
              <strong>{formatWeek(sourceDate)}</strong>
              <button className="icon-button" onClick={() => moveSource(1)} disabled={!canMoveForward} aria-label="Later source week"><ArrowRight size={17} /></button>
            </div>
          </div>
          <ArrowRight className="duplicate-route-arrow" size={19} />
          <div>
            <span>Copy into</span>
            <strong>{formatWeek(new Date(`${targetWeekStart}T12:00:00`))}</strong>
          </div>
        </div>

        <div className="duplicate-groups">
          <section className="duplicate-group">
            <header>
              <span><Target size={17} /><strong>Goals</strong><small>{sourceGoals.length}</small></span>
              <button onClick={() => setSelectedGoalIds(selectedGoalIds.size === sourceGoals.length ? new Set() : new Set(sourceGoals.map((goal) => goal.id)))} disabled={!sourceGoals.length}>
                {selectedGoalIds.size === sourceGoals.length ? "Clear" : "Select all"}
              </button>
            </header>
            <div className="duplicate-selection-list">
              {sourceGoals.map((goal) => <label className="duplicate-selection" key={goal.id}>
                <input type="checkbox" checked={selectedGoalIds.has(goal.id)} onChange={() => toggle(setSelectedGoalIds, goal.id)} />
                <span><strong>{goal.title}</strong><small>{goal.target} {goal.unit} · {goal.periodType}</small></span>
              </label>)}
              {!sourceGoals.length && <div className="duplicate-empty"><Target size={20} /><span>No goals in this week.</span></div>}
            </div>
          </section>

          <section className="duplicate-group">
            <header>
              <span><CalendarDays size={17} /><strong>Schedule</strong><small>{sourceEvents.length}</small></span>
              <button onClick={() => setSelectedEventIds(selectedEventIds.size === sourceEvents.length ? new Set() : new Set(sourceEvents.map((event) => event.id)))} disabled={!sourceEvents.length}>
                {selectedEventIds.size === sourceEvents.length ? "Clear" : "Select all"}
              </button>
            </header>
            <div className="duplicate-selection-list">
              {sourceEvents.map((event) => {
                const startsAt = new Date(event.startsAt);
                return <label className="duplicate-selection" key={event.id}>
                  <input type="checkbox" checked={selectedEventIds.has(event.id)} onChange={() => toggle(setSelectedEventIds, event.id)} />
                  <span><strong>{event.title}</strong><small>{startsAt.toLocaleDateString(undefined, { weekday: "short" })} · {startsAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small></span>
                </label>;
              })}
              {!sourceEvents.length && <div className="duplicate-empty"><CalendarDays size={20} /><span>No calendar items in this week.</span></div>}
            </div>
          </section>
        </div>

        <div className="duplicate-actions">
          <span><CheckSquare2 size={16} /> {selectedCount} selected</span>
          <button className="secondary-button" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="primary-button" disabled={!selectedCount || busy} onClick={() => void onDuplicate({
            sourceWeekStart,
            targetWeekStart,
            goalIds: [...selectedGoalIds],
            eventIds: [...selectedEventIds],
          })}><Copy size={17} /> {busy ? "Duplicating…" : "Duplicate selected"}</button>
        </div>
      </section>
    </div>
  );
}
