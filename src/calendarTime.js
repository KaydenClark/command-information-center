export function calendarEventTime(event = {}) {
  if (event.when) return String(event.when);
  const start = String(event.start || "").trim();
  const end = String(event.end || "").trim();
  if (start && end) return `${start} – ${end}`;
  return start || end || "Time unavailable";
}
