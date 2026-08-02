export type CategoryId = "work" | "sport" | "reading" | "study";

export type Goal = {
  id: string;
  title: string;
  category: CategoryId;
  current: number;
  target: number;
  unit: string;
  dueDay: string;
  completed: boolean;
};

export type Category = {
  id: CategoryId;
  label: string;
  shortLabel: string;
  color: string;
};
