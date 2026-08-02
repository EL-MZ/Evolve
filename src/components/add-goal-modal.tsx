"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { categories } from "@/lib/demo-data";
import type { CategoryId, Goal } from "@/lib/types";

export function AddGoalModal({ onClose, onAdd }: { onClose: () => void; onAdd: (goal: Goal) => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryId>("work");
  const [target, setTarget] = useState(1);
  const [unit, setUnit] = useState("sessions");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onAdd({ id: crypto.randomUUID(), title: title.trim(), category, current: 0, target, unit, dueDay: "Sunday", completed: false });
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
          <button className="primary-button modal-submit" type="submit">Add to my week</button>
        </form>
      </div>
    </div>
  );
}
