export type JournalItem = {
  id: number;
  day: string;
  complete: boolean;
  answers: unknown[];
};

export type JournalThread<T extends JournalItem = JournalItem> = {
  day: string;
  root: T | null;
  layers: T[];
};

function calendarDayOf(day: string): string {
  return day.split("#")[0] ?? day;
}

function isCalendarDay(day: string): boolean {
  return !day.includes("#");
}

export function journalThreads<T extends JournalItem>(days: T[]): JournalThread<T>[] {
  const groups = new Map<string, T[]>();
  for (const item of days) {
    const key = calendarDayOf(item.day);
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([day, items]) => {
      const ordered = [...items].sort((a, b) => a.day.localeCompare(b.day));
      return {
        day,
        root: ordered.find((item) => isCalendarDay(item.day)) ?? null,
        layers: ordered.filter(
          (item) =>
            !isCalendarDay(item.day) &&
            (item.complete || item.answers.length > 0),
        ),
      };
    })
    .filter((thread) => thread.root || thread.layers.length);
}