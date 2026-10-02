import { NextResponse } from "next/server";
import db from "@/lib/db";
import { sendToMember } from "@/lib/push";
import { isDue, reminderCopy } from "@/lib/reminders";
import { getStreak } from "@/lib/repo";
import { localDay } from "@/lib/time";

type MemberRow = {
  id: number;
  couple_id: number;
  name: string;
  reminder_time: string;
};

// Called by an external cron every 15 minutes with the cron secret.
// Sends the evening reminder to members who have not answered today.
export async function POST(req: Request) {
  const secret = process.env.HEARTH_CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const today = localDay();
  const now = new Date();
  const members = db.prepare("SELECT * FROM members").all() as MemberRow[];
  let sent = 0;
  const skipped = { notDue: 0, answered: 0 };

  for (const m of members) {
    if (!isDue(m.reminder_time, now)) {
      skipped.notDue += 1;
      continue;
    }
    const day = db
      .prepare("SELECT id FROM days WHERE couple_id = ? AND day = ?")
      .get(m.couple_id, today) as { id: number } | undefined;
    const answered =
      day &&
      db
        .prepare("SELECT 1 FROM answers WHERE day_id = ? AND member_id = ?")
        .get(day.id, m.id);
    if (answered) {
      skipped.answered += 1;
      continue;
    }
    const partner = db
      .prepare("SELECT id, name FROM members WHERE couple_id = ? AND id != ?")
      .get(m.couple_id, m.id) as { id: number; name: string } | undefined;
    const partnerAnswered = Boolean(
      day &&
        partner &&
        db
          .prepare("SELECT 1 FROM answers WHERE day_id = ? AND member_id = ?")
          .get(day.id, partner.id),
    );
    const streak = getStreak(m.couple_id, today);
    const copy = reminderCopy({
      partnerAnswered,
      partnerName: partner?.name ?? "Your person",
      streak: streak.current,
    });
    const res = await sendToMember(m.id, { ...copy, url: "/" });
    sent += res.sent;
  }

  return NextResponse.json({ sent, skipped });
}
