import type { ThemeKey } from "./types";

export const themes: Array<{
  key: ThemeKey;
  label: string;
  sidebar: string;
  accent: string;
  accentSoft: string;
  accentContrast: string;
}> = [
  { key: "lime", label: "Evolve Lime", sidebar: "#13211C", accent: "#A8F06A", accentSoft: "#EEF9E5", accentContrast: "#13211C" },
  { key: "ocean", label: "Ocean Blue", sidebar: "#11243A", accent: "#69C9FF", accentSoft: "#E6F6FF", accentContrast: "#102437" },
  { key: "coral", label: "Sunset Coral", sidebar: "#34201F", accent: "#FF837A", accentSoft: "#FFF0EE", accentContrast: "#341817" },
  { key: "violet", label: "Violet Focus", sidebar: "#271D3B", accent: "#BC94FF", accentSoft: "#F3ECFF", accentContrast: "#25183A" },
];

export function themeStyle(themeKey: ThemeKey) {
  const theme = themes.find((item) => item.key === themeKey) ?? themes[0];
  return {
    "--sidebar-bg": theme.sidebar,
    "--accent": theme.accent,
    "--accent-soft": theme.accentSoft,
    "--accent-contrast": theme.accentContrast,
  } as React.CSSProperties;
}
