import type { Category, Goal } from "./types";

export const categories: Category[] = [
  { id: "work", label: "Deep work", shortLabel: "Work", color: "#a8f06a" },
  { id: "sport", label: "Move", shortLabel: "Sport", color: "#ff776f" },
  { id: "reading", label: "Read", shortLabel: "Reading", color: "#70d7ff" },
  { id: "study", label: "Learn", shortLabel: "Study", color: "#c39bff" },
];

export const initialGoals: Goal[] = [
  { id: "paper", title: "Finish methods section", category: "work", current: 3, target: 5, unit: "sessions", dueDay: "Friday", completed: false },
  { id: "review", title: "Review MINS stopping criteria", category: "work", current: 1, target: 1, unit: "task", dueDay: "Tuesday", completed: true },
  { id: "run", title: "Run outdoors", category: "sport", current: 12, target: 20, unit: "km", dueDay: "Sunday", completed: false },
  { id: "strength", title: "Strength training", category: "sport", current: 2, target: 3, unit: "sessions", dueDay: "Saturday", completed: false },
  { id: "book", title: "Read current book", category: "reading", current: 84, target: 120, unit: "pages", dueDay: "Sunday", completed: false },
  { id: "stats", title: "Advanced statistics course", category: "study", current: 2, target: 4, unit: "hours", dueDay: "Sunday", completed: false },
];
