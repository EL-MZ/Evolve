export function startOfWeek(date: Date) {
  const value = new Date(date);
  const day = value.getDay() || 7;
  value.setDate(value.getDate() - day + 1);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, amount: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + amount);
  return value;
}

export function addWeeks(date: Date, amount: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + amount * 7);
  return value;
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function rangesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return startA <= endB && endA >= startB;
}

export function formatWeek(date: Date) {
  const end = new Date(date);
  end.setDate(end.getDate() + 6);
  const sameMonth = date.getMonth() === end.getMonth();
  const startText = new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    ...(sameMonth ? {} : { year: "numeric" as const }),
  }).format(date);
  const endText = new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(end);
  return `${startText} – ${endText}`;
}
