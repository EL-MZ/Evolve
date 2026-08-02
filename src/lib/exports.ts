import type { Goal } from "./types";

function escapeCalendar(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

export function downloadWeekCalendar(goals: Goal[], weekStart: Date) {
  const events = goals.map((goal, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + Math.min(index, 6));
    const stamp = date.toISOString().slice(0, 10).replace(/-/g, "");
    return [
      "BEGIN:VEVENT",
      `UID:${goal.id}-${stamp}@evolve`,
      `DTSTART;VALUE=DATE:${stamp}`,
      `DTEND;VALUE=DATE:${stamp}`,
      `SUMMARY:${escapeCalendar(goal.title)}`,
      `DESCRIPTION:${escapeCalendar(`Weekly target: ${goal.target} ${goal.unit}`)}`,
      "END:VEVENT",
    ].join("\r\n");
  });

  const calendar = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Evolve//Weekly Goals//EN", ...events, "END:VCALENDAR"].join("\r\n");
  const blob = new Blob([calendar], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "evolve-week.ics";
  link.click();
  URL.revokeObjectURL(url);
}

