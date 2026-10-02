const CALENDAR = /^(\d{4}-\d{2}-\d{2})$/;

export function isCalendarDay(key: string): boolean {
  return CALENDAR.test(key);
}

export function calendarDayOf(key: string): string {
  return key.split("#")[0] ?? key;
}

export function lessonSeq(key: string): number {
  if (isCalendarDay(key)) return 0;
  const n = Number(key.split("#")[1] ?? "0");
  return Number.isFinite(n) ? n : 0;
}

export function lessonKey(day: string, seq: number): string {
  if (seq <= 0) return day;
  return `${day}#${String(seq).padStart(3, "0")}`;
}

export function compareLessonKeys(a: string, b: string): number {
  const day = calendarDayOf(a).localeCompare(calendarDayOf(b));
  if (day !== 0) return day;
  return lessonSeq(a) - lessonSeq(b);
}
