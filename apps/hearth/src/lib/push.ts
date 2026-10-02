import webpush from "web-push";
import db from "./db";

const vapidPublic = process.env.HEARTH_VAPID_PUBLIC;
const vapidPrivate = process.env.HEARTH_VAPID_PRIVATE;
const vapidContact = process.env.HEARTH_VAPID_CONTACT ?? "mailto:hearth@localhost";

if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails(vapidContact, vapidPublic, vapidPrivate);
}

export function pushEnabled(): boolean {
  return Boolean(vapidPublic && vapidPrivate);
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

type SubRow = {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function sendToMember(
  memberId: number,
  payload: PushPayload,
): Promise<{ sent: number }> {
  if (!pushEnabled()) return { sent: 0 };
  const subs = db
    .prepare("SELECT * FROM push_subscriptions WHERE member_id = ?")
    .all(memberId) as SubRow[];
  let sent = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      );
      sent += 1;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        db.prepare("DELETE FROM push_subscriptions WHERE id = ?").run(s.id);
      }
    }
  }
  return { sent };
}
