export function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// A reminder is due when local time falls inside [reminder, reminder + window).
export function isDue(
  reminderTime: string,
  now: Date,
  windowMinutes = 15,
): boolean {
  if (!/^\d{2}:\d{2}$/.test(reminderTime)) return false;
  const target = minutesOf(reminderTime);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= target && nowMinutes < target + windowMinutes;
}

export function reminderCopy({
  partnerAnswered,
  partnerName,
  streak,
}: {
  partnerAnswered: boolean;
  partnerName: string;
  streak: number;
}): { title: string; body: string } {
  if (partnerAnswered) {
    return {
      title: "Hearth",
      body: `${partnerName} sealed an answer. Yours unlocks it.`,
    };
  }
  return {
    title: "Hearth",
    body:
      streak > 0
        ? `Two minutes tonight keeps the ${streak}-day streak.`
        : "Today's question is waiting. Two minutes, that is all.",
  };
}
