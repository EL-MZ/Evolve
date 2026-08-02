"use client";

import { FormEvent, useState } from "react";
import { Plus, X } from "lucide-react";
import type { CalendarEvent, CategoryId, Goal } from "@/lib/types";
import type { Category } from "@/lib/types";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function addDays(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + amount);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function AddGoalModal({ categories, weekStart, initialCategory, onClose, onAdd, onCreateCategory }: { categories: Category[]; weekStart: string; initialCategory?: string; onClose: () => void; onAdd: (goal: Goal, event?: CalendarEvent) => void | Promise<void>; onCreateCategory: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryId>(initialCategory ?? categories[0]?.id ?? "");
  const [target, setTarget] = useState(1);
  const [increment, setIncrement] = useState(1);
  const [unit, setUnit] = useState("sessions");
  const [dueDay, setDueDay] = useState("Sunday");
  const [scheduled, setScheduled] = useState(false);
  const [eventDate, setEventDate] = useState(weekStart);
  const [eventTime, setEventTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !category || target <= 0 || increment <= 0) return;
    setSaving(true);
    const goalId = crypto.randomUUID();
    let calendarEvent: CalendarEvent | undefined;
    if (scheduled) {
      const starts = new Date(`${eventDate}T${eventTime}:00`);
      const ends = new Date(starts.getTime() + duration * 60_000);
      calendarEvent = {
        id: crypto.randomUUID(),
        goalId,
        title: title.trim(),
        startsAt: starts.toISOString(),
        endsAt: ends.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }
    try {
      await onAdd({ id: goalId, title: title.trim(), category, current: 0, target, increment, unit: unit.trim() || "task", dueDay, completed: false, weekStart }, calendarEvent);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-goal-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close dialog"><X size={19} /></button>
        <p className="eyebrow">Make it real</p>
        <h2 id="add-goal-title">Add a weekly goal</h2>
        <p className="modal-intro">Choose one clear outcome you can move forward this week.</p>
        <form onSubmit={submit}>
          <label>
            Goal
            <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Draft the introduction" />
          </label>
          <label>
            Area
            <select value={category} onChange={(event) => setCategory(event.target.value as CategoryId)}>
              {categories.map((item) => <option key={item.id} value={item.id}>{item.shortLabel}</option>)}
            </select>
            <button className="create-category-link" type="button" onClick={onCreateCategory}><Plus size={14} /> Create a new category</button>
          </label>
          <div className="form-row">
            <label>
              Target
              <input type="number" min="1" value={target} onChange={(event) => setTarget(Number(event.target.value))} />
            </label>
            <label>
              Unit
              <input value={unit} onChange={(event) => setUnit(event.target.value)} />
            </label>
          </div>
          <div className="form-row">
            <label>
              Log by
              <input type="number" min="0.01" step="any" value={increment} onChange={(event) => setIncrement(Number(event.target.value))} />
            </label>
            <label>
              Due day
              <select value={dueDay} onChange={(event) => setDueDay(event.target.value)}>
                {days.map((day) => <option key={day}>{day}</option>)}
              </select>
            </label>
          </div>
          <label className="schedule-toggle">
            <input type="checkbox" checked={scheduled} onChange={(event) => setScheduled(event.target.checked)} />
            <span><strong>Add to weekly calendar</strong><small>Turn this goal into a scheduled event.</small></span>
          </label>
          {scheduled && <div className="schedule-fields">
            <label>
              Event date
              <input type="date" min={weekStart} max={addDays(weekStart, 6)} value={eventDate} onChange={(event) => {
                setEventDate(event.target.value);
                const dayIndex = Math.round((new Date(`${event.target.value}T12:00:00`).getTime() - new Date(`${weekStart}T12:00:00`).getTime()) / 86_400_000);
                setDueDay(days[Math.min(6, Math.max(0, dayIndex))]);
              }} />
            </label>
            <div className="form-row">
              <label>
                Starts
                <input type="time" value={eventTime} onChange={(event) => setEventTime(event.target.value)} />
              </label>
              <label>
                Duration
                <select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </label>
            </div>
          </div>}
          <button className="primary-button modal-submit" disabled={saving || !categories.length} type="submit">{saving ? "Adding…" : "Add to my week"}</button>
        </form>
      </div>
    </div>
  );
}
