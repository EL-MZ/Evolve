"use client";

import { FormEvent, useState } from "react";
import { Copy, Trash2, X } from "lucide-react";
import type { CalendarEvent, Category, Goal } from "@/lib/types";

function localInputValue(iso: string) {
  const value = new Date(iso);
  const offset = value.getTimezoneOffset();
  return new Date(value.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function colorForGoal(goalId: string, goals: Goal[], categories: Category[]) {
  const goal = goals.find((item) => item.id === goalId);
  return categories.find((item) => item.id === goal?.category)?.color ?? "#A8F06A";
}

export function EventModal({
  event,
  goals,
  categories,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
}: {
  event: CalendarEvent;
  goals: Goal[];
  categories: Category[];
  onClose: () => void;
  onSave: (event: CalendarEvent) => void | Promise<void>;
  onDelete?: (event: CalendarEvent) => void | Promise<void>;
  onDuplicate?: (event: CalendarEvent) => void | Promise<void>;
}) {
  const [title, setTitle] = useState(event.title);
  const [goalId, setGoalId] = useState(event.goalId ?? "");
  const [startsAt, setStartsAt] = useState(localInputValue(event.startsAt));
  const [endsAt, setEndsAt] = useState(localInputValue(event.endsAt));
  const [notes, setNotes] = useState(event.notes);
  const [linkUrl, setLinkUrl] = useState(event.linkUrl);
  const [location, setLocation] = useState(event.location);
  const [color, setColor] = useState(event.color);
  const [saving, setSaving] = useState(false);

  async function submit(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!title.trim() || !startsAt || !endsAt || new Date(endsAt) <= new Date(startsAt)) return;
    setSaving(true);
    try {
      await onSave({
        ...event,
        goalId: goalId || null,
        kind: goalId ? "goal_session" : "event",
        title: title.trim(),
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notes: notes.trim(),
        linkUrl: linkUrl.trim(),
        location: location.trim(),
        color,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal event-modal" role="dialog" aria-modal="true" aria-labelledby="event-title" onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close event editor"><X size={19} /></button>
        <p className="eyebrow">{event.goalId ? "Goal session" : "Calendar event"}</p>
        <h2 id="event-title">{event.id.startsWith("new-") ? "Add to your schedule" : "Edit calendar item"}</h2>
        <form onSubmit={submit}>
          <label>
            Title
            <input autoFocus value={title} onChange={(inputEvent) => setTitle(inputEvent.target.value)} placeholder="What is happening?" />
          </label>
          <label>
            Linked goal <span className="field-optional">optional</span>
            <select value={goalId} onChange={(inputEvent) => {
              const nextId = inputEvent.target.value;
              setGoalId(nextId);
              if (nextId) setColor(colorForGoal(nextId, goals, categories));
              const linkedGoal = goals.find((goal) => goal.id === nextId);
              if (linkedGoal && (!title || title === event.title)) setTitle(linkedGoal.title);
            }}>
              <option value="">Standalone event</option>
              {goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
            </select>
          </label>
          <div className="form-row equal">
            <label>
              Starts
              <input type="datetime-local" value={startsAt} onChange={(inputEvent) => setStartsAt(inputEvent.target.value)} />
            </label>
            <label>
              Ends
              <input type="datetime-local" min={startsAt} value={endsAt} onChange={(inputEvent) => setEndsAt(inputEvent.target.value)} />
            </label>
          </div>
          <label>
            Notes <span className="field-optional">optional</span>
            <textarea value={notes} onChange={(inputEvent) => setNotes(inputEvent.target.value)} placeholder="Context, preparation, or anything you want to remember…" />
          </label>
          <div className="form-row equal">
            <label>
              Link <span className="field-optional">optional</span>
              <input type="url" value={linkUrl} onChange={(inputEvent) => setLinkUrl(inputEvent.target.value)} placeholder="https://…" />
            </label>
            <label>
              Location <span className="field-optional">optional</span>
              <input value={location} onChange={(inputEvent) => setLocation(inputEvent.target.value)} placeholder="Room or address" />
            </label>
          </div>
          {!goalId && <label>
            Event colour
            <input className="event-color-input" type="color" value={color} onChange={(inputEvent) => setColor(inputEvent.target.value)} />
          </label>}
          <div className="event-modal-actions">
            <button className="primary-button" disabled={saving} type="submit">{saving ? "Saving…" : "Save event"}</button>
            {onDuplicate && <button className="secondary-button" type="button" onClick={() => void onDuplicate({ ...event, title, goalId: goalId || null, notes, linkUrl, location, color })}><Copy size={16} /> Duplicate</button>}
            {onDelete && <button className="danger-button" type="button" onClick={() => void onDelete(event)}><Trash2 size={16} /> Delete</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
