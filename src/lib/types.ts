export type CategoryId = string;

export type GoalPeriodType = "weekly" | "monthly" | "custom";

export type GoalMeasurement =
  | "binary"
  | "count"
  | "duration"
  | "distance"
  | "pages"
  | "minutes"
  | "sessions"
  | "custom";

export type ThemeKey = "lime" | "ocean" | "coral" | "violet";

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
  increment: number;
  measurement: GoalMeasurement;
  unit: string;
  notes: string;
  periodType: GoalPeriodType;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  repeatUntilDue: boolean;
  completed: boolean;
};

export type CalendarEvent = {
  id: string;
  goalId: string | null;
  kind: "goal_session" | "event";
  title: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  notes: string;
  linkUrl: string;
  location: string;
  color: string;
  completed: boolean;
  completedAt: string | null;
  progressContribution: number;
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

export type Workspace = {
  categories: Category[];
  goals: Goal[];
  events: CalendarEvent[];
  themeKey: ThemeKey;
};
