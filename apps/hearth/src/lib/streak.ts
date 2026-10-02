export const GRACE_WINDOW_DAYS = 7;

export type PromptKind = "question" | "rapid" | "mission" | "guess";

// A day completes when both partners did their part. Guess days need one
// answer (from the designated answerer) and one guess (from the other).
export function isDayComplete(
  kind: PromptKind,
  answered: number,
  guessed: number,
  memberCount: number,
): boolean {
  if (kind === "guess") return answered >= 1 && guessed >= 1;
  // A two-person ritual never completes on a solo seat. memberCount of 1
  // used to mark the day done after one answer and hide the path.
  void memberCount;
  return answered >= 2;
}

export type StreakWalk = {
  current: number;
  graceDays: string[];
  todayComplete: boolean;
};

function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

// A streak day counts when both partners answered. Today counts only when
// complete; an open today never breaks the chain. One missed day per rolling
// 7-day window is absorbed as a grace day; a second miss ends the run.
// Days with no row at all count as misses, bounded by the couple's first day.
export function walkStreak(
  completeByDay: Map<string, boolean>,
  firstDay: string | null,
  today: string,
): StreakWalk {
  let current = 0;
  const graceDays: string[] = [];

  const todayComplete = completeByDay.get(today) === true;
  if (todayComplete) {
    current += 1;
  }

  if (firstDay) {
    let cursor = shiftDay(today, -1);
    while (cursor >= firstDay) {
      if (completeByDay.get(cursor) === true) {
        current += 1;
      } else {
        const recentGraces = graceDays.filter(
          (g) => shiftDay(cursor, GRACE_WINDOW_DAYS) > g,
        ).length;
        if (recentGraces === 0) {
          graceDays.push(cursor);
        } else {
          break;
        }
      }
      cursor = shiftDay(cursor, -1);
    }
  }

  return { current, graceDays, todayComplete };
}
