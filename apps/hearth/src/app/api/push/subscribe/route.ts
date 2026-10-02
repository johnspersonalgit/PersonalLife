import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSessionMember } from "@/lib/session";

export async function POST(req: Request) {
  const member = await getSessionMember();
  if (!member) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: "invalid subscription" }, { status: 400 });
  }
  db.prepare(
    `INSERT INTO push_subscriptions (member_id, endpoint, p256dh, auth)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET member_id = excluded.member_id`,
  ).run(member.id, body.endpoint, body.keys.p256dh, body.keys.auth);
  return NextResponse.json({ ok: true });
}
