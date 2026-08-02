"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { categoryIconOptions } from "@/lib/category-icons";
import type { Category, CategoryIcon } from "@/lib/types";

const colors = ["#a8f06a", "#ff776f", "#70d7ff", "#c39bff", "#ffd166", "#55d6be", "#ff9f5a", "#91a7ff"];

export function AddCategoryModal({ onClose, onAdd }: { onClose: () => void; onAdd: (category: Category) => void | Promise<void> }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<CategoryIcon>("heart");
  const [color, setColor] = useState(colors[4]);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    setSaving(true);
    await onAdd({ id: crypto.randomUUID(), label: cleanName, shortLabel: cleanName, color, icon });
    setSaving(false);
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal category-modal" role="dialog" aria-modal="true" aria-labelledby="add-category-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close dialog"><X size={19} /></button>
        <p className="eyebrow">Make it personal</p>
        <h2 id="add-category-title">Create a category</h2>
        <p className="modal-intro">Add any area you want to nurture—music, wellbeing, finance, side projects, or something entirely yours.</p>
        <form onSubmit={submit}>
          <label>Name<input autoFocus maxLength={40} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Music practice" /></label>
          <fieldset>
            <legend>Icon</legend>
            <div className="icon-picker">
              {categoryIconOptions.map((option) => {
                const Icon = option.icon;
                return <button type="button" key={option.id} className={icon === option.id ? "selected" : ""} onClick={() => setIcon(option.id)} aria-label={option.label} aria-pressed={icon === option.id}><Icon size={19} /></button>;
              })}
            </div>
          </fieldset>
          <fieldset>
            <legend>Colour</legend>
            <div className="color-picker">
              {colors.map((value) => <button type="button" key={value} className={color === value ? "selected" : ""} style={{ background: value }} onClick={() => setColor(value)} aria-label={`Use ${value}`} aria-pressed={color === value} />)}
            </div>
          </fieldset>
          <button className="primary-button modal-submit" disabled={saving} type="submit">{saving ? "Creating…" : "Create category"}</button>
        </form>
      </div>
    </div>
  );
}
