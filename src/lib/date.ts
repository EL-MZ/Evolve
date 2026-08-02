export function startOfWeek(date: Date) {
  const value = new Date(date);
  const day = value.getDay() || 7;
  value.setDate(value.getDate() - day + 1);
  value.setHours(0, 0, 0, 0);
  return value;
}

export function addWeeks(date: Date, amount: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + amount * 7);
  return value;
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

