import type { CalendarEvent } from "./types";

function escapeCalendar(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function calendarTimestamp(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function downloadWeekCalendar(calendarEvents: CalendarEvent[]) {
  const events = calendarEvents.map((event) => {
    return [
      "BEGIN:VEVENT",
      `UID:${event.id}@evolve`,
      `DTSTART:${calendarTimestamp(event.startsAt)}`,
      `DTEND:${calendarTimestamp(event.endsAt)}`,
      `SUMMARY:${escapeCalendar(event.title)}`,
      `DESCRIPTION:${escapeCalendar("Scheduled with Evolve")}`,
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
