export function localDay(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function calendarPart(day: string): string {
  return day.split("#")[0] ?? day;
}

export function shiftDay(day: string, delta: number): string {
  const d = new Date(`${calendarPart(day)}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return localDay(d);
}

export function prettyDay(day: string): string {
  const d = new Date(`${calendarPart(day)}T12:00:00`);
  const base = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const extra = day.split("#")[1];
  const seq = extra ? Number(extra) : 0;
  if (Number.isFinite(seq) && seq > 0) return `${base} · ${seq + 1}`;
  return base;
}

export function msUntilMidnight(now: Date = new Date()): number {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

export function prettyTime(iso: string): string {
  const d = new Date(iso.replace(" ", "T") + "Z");
  const today = localDay();
  const thatDay = localDay(
    new Date(d.getTime() - d.getTimezoneOffset() * 60000),
  );
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (thatDay === today) return `Today, ${time}`;
  if (thatDay === shiftDay(today, -1)) return `Yesterday, ${time}`;
  return `${prettyDay(thatDay)}, ${time}`;
}
