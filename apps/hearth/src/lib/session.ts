import { cookies } from "next/headers";
import db from "./db";

export type Member = {
  id: number;
  coupleId: number;
  name: string;
  reminderTime: string;
  avatar: string | null;
  color: string | null;
};

type MemberRow = {
  id: number;
  couple_id: number;
  name: string;
  reminder_time: string;
  avatar: string | null;
  color: string | null;
};

function toMember(row: MemberRow): Member {
  return {
    id: row.id,
    coupleId: row.couple_id,
    name: row.name,
    reminderTime: row.reminder_time,
    avatar: row.avatar,
    color: row.color,
  };
}

export async function getSessionMember(): Promise<Member | null> {
  const store = await cookies();
  const raw = store.get("hearth_member")?.value;
  if (!raw) return null;
  const id = Number(raw);
  if (!Number.isInteger(id)) return null;
  const row = db
    .prepare("SELECT * FROM members WHERE id = ?")
    .get(id) as MemberRow | undefined;
  return row ? toMember(row) : null;
}

export function getMember(id: number): Member | null {
  const row = db
    .prepare("SELECT * FROM members WHERE id = ?")
    .get(id) as MemberRow | undefined;
  return row ? toMember(row) : null;
}

export function getPartner(member: Member): Member | null {
  const row = db
    .prepare(
      "SELECT * FROM members WHERE couple_id = ? AND id != ? ORDER BY id LIMIT 1",
    )
    .get(member.coupleId, member.id) as MemberRow | undefined;
  return row ? toMember(row) : null;
}
