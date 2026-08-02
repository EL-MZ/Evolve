"use client";

import { FormEvent, useState } from "react";
import { Plus, X } from "lucide-react";
import type { CategoryId, Goal } from "@/lib/types";
import type { Category } from "@/lib/types";

export function AddGoalModal({ categories, weekStart, initialCategory, onClose, onAdd, onCreateCategory }: { categories: Category[]; weekStart: string; initialCategory?: string; onClose: () => void; onAdd: (goal: Goal) => void | Promise<void>; onCreateCategory: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryId>(initialCategory ?? categories[0]?.id ?? "");
  const [target, setTarget] = useState(1);
  const [unit, setUnit] = useState("sessions");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !category) return;
    setSaving(true);
    await onAdd({ id: crypto.randomUUID(), title: title.trim(), category, current: 0, target, unit, dueDay: "Sunday", completed: false, weekStart });
    setSaving(false);
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
          <button className="primary-button modal-submit" disabled={saving || !categories.length} type="submit">{saving ? "Adding…" : "Add to my week"}</button>
        </form>
      </div>
    </div>
  );
}
