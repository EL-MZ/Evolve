"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { addDays, dateKey, endOfMonth } from "@/lib/date";
import type {
  CalendarEvent,
  Category,
  CategoryId,
  Goal,
  GoalMeasurement,
  GoalPeriodType,
} from "@/lib/types";

const trackingOptions: Array<{ value: GoalMeasurement; label: string; unit: string; target: number; increment: number }> = [
  { value: "sessions", label: "Sessions", unit: "sessions", target: 3, increment: 1 },
  { value: "pages", label: "Pages", unit: "pages", target: 100, increment: 10 },
  { value: "duration", label: "Hours", unit: "hours", target: 5, increment: 0.5 },
  { value: "count", label: "Tasks or count", unit: "tasks", target: 5, increment: 1 },
  { value: "distance", label: "Distance", unit: "km", target: 10, increment: 1 },
  { value: "custom", label: "Custom", unit: "units", target: 1, increment: 1 },
];

function monthRange(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return {
    start: dateKey(new Date(date.getFullYear(), date.getMonth(), 1)),
    end: dateKey(endOfMonth(date)),
  };
}

export function AddGoalModal({
  categories,
  weekStart,
  initialCategory,
  onClose,
  onAdd,
  onCreateCategory,
}: {
  categories: Category[];
  weekStart: string;
  initialCategory?: string;
  onClose: () => void;
  onAdd: (goal: Goal, event?: CalendarEvent) => void | Promise<void>;
  onCreateCategory: () => void;
}) {
  const weeklyEnd = dateKey(addDays(new Date(`${weekStart}T12:00:00`), 6));
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryId>(initialCategory ?? categories[0]?.id ?? "");
  const [measurement, setMeasurement] = useState<GoalMeasurement>("sessions");
  const [target, setTarget] = useState(3);
  const [increment, setIncrement] = useState(1);
  const [unit, setUnit] = useState("sessions");
  const [notes, setNotes] = useState("");
  const [periodType, setPeriodType] = useState<GoalPeriodType>("weekly");
  const [periodStart, setPeriodStart] = useState(weekStart);
  const [periodEnd, setPeriodEnd] = useState(weeklyEnd);
  const [dueDate, setDueDate] = useState(weeklyEnd);
  const [scheduled, setScheduled] = useState(false);
  const [eventDate, setEventDate] = useState(weekStart);
  const [eventTime, setEventTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [saving, setSaving] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === category),
    [categories, category],
  );

  function changePeriod(next: GoalPeriodType) {
    setPeriodType(next);
    if (next === "weekly") {
      setPeriodStart(weekStart);
      setPeriodEnd(weeklyEnd);
      setDueDate(weeklyEnd);
      setEventDate(weekStart);
    } else if (next === "monthly") {
      const range = monthRange(weekStart);
      setPeriodStart(range.start);
      setPeriodEnd(range.end);
      setDueDate(range.end);
      setEventDate(range.start);
    }
  }

  function changeMeasurement(next: GoalMeasurement) {
    const preset = trackingOptions.find((item) => item.value === next) ?? trackingOptions[0];
    setMeasurement(next);
    setUnit(preset.unit);
    setTarget(preset.target);
    setIncrement(preset.increment);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !category || target <= 0 || increment <= 0 || periodEnd < periodStart) return;
    setSaving(true);
    const goalId = crypto.randomUUID();
    let calendarEvent: CalendarEvent | undefined;
    if (scheduled) {
      const starts = new Date(`${eventDate}T${eventTime}:00`);
      const ends = new Date(starts.getTime() + duration * 60_000);
      calendarEvent = {
        id: crypto.randomUUID(),
        goalId,
        kind: "goal_session",
        title: title.trim(),
        startsAt: starts.toISOString(),
        endsAt: ends.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notes: "",
        linkUrl: "",
        location: "",
        color: selectedCategory?.color ?? "#A8F06A",
      };
    }
    try {
      await onAdd({
        id: goalId,
        title: title.trim(),
        category,
        current: 0,
        target,
        increment,
        measurement,
        unit: unit.trim() || "unit",
        notes: notes.trim(),
        periodType,
        periodStart,
        periodEnd,
        dueDate,
        completed: false,
      }, calendarEvent);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal goal-modal" role="dialog" aria-modal="true" aria-labelledby="add-goal-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close dialog"><X size={19} /></button>
        <p className="eyebrow">Make it real</p>
        <h2 id="add-goal-title">Add a goal</h2>
        <p className="modal-intro">Define the outcome, how you will measure it, and the period it belongs to.</p>
        <form onSubmit={submit}>
          <label>
            Goal
            <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Read The Left Hand of Darkness" />
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
              Track by
              <select value={measurement} onChange={(event) => changeMeasurement(event.target.value as GoalMeasurement)}>
                {trackingOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label>
              Unit
              <input value={unit} onChange={(event) => setUnit(event.target.value)} />
            </label>
          </div>
          <div className="form-row">
            <label>
              Target
              <input type="number" min="0.01" step="any" value={target} onChange={(event) => setTarget(Number(event.target.value))} />
            </label>
            <label>
              Log by
              <input type="number" min="0.01" step="any" value={increment} onChange={(event) => setIncrement(Number(event.target.value))} />
            </label>
          </div>

          <label>
            Goal period
            <select value={periodType} onChange={(event) => changePeriod(event.target.value as GoalPeriodType)}>
              <option value="weekly">This week</option>
              <option value="monthly">This month</option>
              <option value="custom">Custom date range</option>
            </select>
          </label>
          {periodType === "custom" && <div className="form-row">
            <label>
              Starts
              <input type="date" value={periodStart} onChange={(event) => {
                setPeriodStart(event.target.value);
                if (event.target.value > periodEnd) setPeriodEnd(event.target.value);
              }} />
            </label>
            <label>
              Ends
              <input type="date" min={periodStart} value={periodEnd} onChange={(event) => {
                setPeriodEnd(event.target.value);
                if (dueDate > event.target.value) setDueDate(event.target.value);
              }} />
            </label>
          </div>}
          <label>
            Due date
            <input type="date" min={periodStart} max={periodEnd} value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </label>
          <label>
            Notes <span className="field-optional">optional</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={measurement === "pages" ? "Book, paper, or chapter…" : "Why this matters or what success looks like…"} />
          </label>

          <label className="schedule-toggle">
            <input type="checkbox" checked={scheduled} onChange={(event) => setScheduled(event.target.checked)} />
            <span><strong>Schedule the first session</strong><small>You can drag this goal into the full calendar more than once later.</small></span>
          </label>
          {scheduled && <div className="schedule-fields">
            <label>
              Session date
              <input type="date" min={periodStart} max={periodEnd} value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
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
          <button className="primary-button modal-submit" disabled={saving || !categories.length} type="submit">{saving ? "Adding…" : "Add goal"}</button>
        </form>
      </div>
    </div>
  );
}

