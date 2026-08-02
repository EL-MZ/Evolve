import type { Category } from "./types";

export const defaultCategories: Category[] = [
  { id: "work", label: "Deep work", shortLabel: "Work", color: "#a8f06a", icon: "briefcase", isDefault: true },
  { id: "sport", label: "Move", shortLabel: "Sport", color: "#ff776f", icon: "dumbbell", isDefault: true },
  { id: "reading", label: "Read", shortLabel: "Reading", color: "#70d7ff", icon: "book", isDefault: true },
  { id: "study", label: "Learn", shortLabel: "Study", color: "#c39bff", icon: "graduation", isDefault: true },
];
