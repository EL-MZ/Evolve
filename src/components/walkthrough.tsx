"use client";

import { useState } from "react";
import { ArrowRight, Layers3, Plus, Sparkles, TrendingUp, X } from "lucide-react";

const steps = [
  {
    eyebrow: "Welcome to Evolve",
    title: "This week starts empty—on purpose.",
    copy: "No sample goals, no inherited clutter. You decide what deserves your energy this week.",
    icon: Sparkles,
  },
  {
    eyebrow: "Shape your space",
    title: "Use the starter areas or make your own.",
    copy: "Create as many categories as you need, give each one a colour, and pick an icon that feels natural.",
    icon: Layers3,
  },
  {
    eyebrow: "Build momentum",
    title: "Add one clear goal, then keep moving it forward.",
    copy: "Log small increments during the week. Evolve turns them into a simple picture of your progress.",
    icon: TrendingUp,
  },
];

export function Walkthrough({ onFinish }: { onFinish: (createGoal: boolean) => void }) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;
  const final = step === steps.length - 1;

  return (
    <div className="modal-backdrop walkthrough-backdrop">
      <div className="walkthrough" role="dialog" aria-modal="true" aria-labelledby="walkthrough-title">
        <button className="icon-button modal-close" onClick={() => onFinish(false)} aria-label="Skip walkthrough"><X size={19} /></button>
        <div className="walkthrough-visual"><span><Icon size={34} /></span><i /><i /><i /></div>
        <div className="walkthrough-copy">
          <p className="eyebrow">{current.eyebrow}</p>
          <h2 id="walkthrough-title">{current.title}</h2>
          <p>{current.copy}</p>
          <div className="walkthrough-dots" aria-label={`Step ${step + 1} of ${steps.length}`}>
            {steps.map((_, index) => <span key={index} className={index === step ? "active" : ""} />)}
          </div>
          <div className="walkthrough-actions">
            <button className="auth-switch" onClick={() => onFinish(false)}>Skip tour</button>
            <button className="primary-button" onClick={() => final ? onFinish(true) : setStep((value) => value + 1)}>
              {final ? <><Plus size={17} /> Create my first goal</> : <>Next <ArrowRight size={17} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
