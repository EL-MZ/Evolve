export type CategoryId = string;

export type CategoryIcon =
  | "briefcase"
  | "dumbbell"
  | "book"
  | "graduation"
  | "heart"
  | "palette"
  | "music"
  | "plane"
  | "wallet"
  | "leaf"
  | "home"
  | "code";

export type Goal = {
  id: string;
  title: string;
  category: CategoryId;
  current: number;
  target: number;
  unit: string;
  dueDay: string;
  completed: boolean;
  weekStart: string;
};

export type Category = {
  id: CategoryId;
  label: string;
  shortLabel: string;
  color: string;
  icon: CategoryIcon;
  isDefault?: boolean;
};

export type WorkspaceUser = {
  id: string;
  email: string;
  displayName: string;
  mode: "supabase" | "preview";
};
