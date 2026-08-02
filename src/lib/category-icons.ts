import {
  BookOpen,
  BriefcaseBusiness,
  Code2,
  Dumbbell,
  GraduationCap,
  Heart,
  House,
  Leaf,
  Music2,
  Palette,
  Plane,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import type { CategoryIcon } from "./types";

export const categoryIconOptions: { id: CategoryIcon; label: string; icon: LucideIcon }[] = [
  { id: "briefcase", label: "Work", icon: BriefcaseBusiness },
  { id: "dumbbell", label: "Fitness", icon: Dumbbell },
  { id: "book", label: "Reading", icon: BookOpen },
  { id: "graduation", label: "Learning", icon: GraduationCap },
  { id: "heart", label: "Wellbeing", icon: Heart },
  { id: "palette", label: "Creative", icon: Palette },
  { id: "music", label: "Music", icon: Music2 },
  { id: "plane", label: "Travel", icon: Plane },
  { id: "wallet", label: "Finance", icon: WalletCards },
  { id: "leaf", label: "Nature", icon: Leaf },
  { id: "home", label: "Home", icon: House },
  { id: "code", label: "Coding", icon: Code2 },
];

export const iconByName = Object.fromEntries(
  categoryIconOptions.map((option) => [option.id, option.icon]),
) as Record<CategoryIcon, LucideIcon>;
