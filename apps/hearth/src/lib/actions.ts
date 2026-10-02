"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import db from "./db";
import {
  addCelebrated,
  ensureDay,
  getStreak,
  recordBest,
  MILESTONES,
} from "./repo";
import { getSessionMember, getPartner, type Member } from "./session";
import { localDay } from "./time";

const COOKIE = "hearth_member";

async function setSession(memberId: number) {
  const store = await cookies();
  store.set(COOKIE, String(memberId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

async function requireMember(): Promise<Member> {
  const member = await getSessionMember();
  if (!member) redirect("/onboarding");
  return member;
}

function makeCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export async function createRitual(
  name: string,
  categories: string[],
): Promise<{ code: string }> {
  const trimmed = name.trim().slice(0, 40);
  if (!trimmed) throw new Error("Name is required");
  const cats = categories.length
    ? categories
    : ["us", "heard", "load", "gratitude", "dreams", "play"];

  let code = makeCode();
  while (db.prepare("SELECT 1 FROM couples WHERE code = ?").get(code)) {
    code = makeCode();
  }

  const tx = db.transaction(() => {
    const couple = db
      .prepare("INSERT INTO couples (code, categories) VALUES (?, ?)")
      .run(code, JSON.stringify(cats));
    const member = db
      .prepare("INSERT INTO members (couple_id, name) VALUES (?, ?)")
      .run(couple.lastInsertRowid, trimmed);
    db.prepare("INSERT INTO streak_meta (couple_id) VALUES (?)").run(
      couple.lastInsertRowid,
    );
    return Number(member.lastInsertRowid);
  });
  const memberId = tx();
  await setSession(memberId);
  return { code };
}

export type RitualLookup =
  | { status: "open" }
  | { status: "full"; members: { id: number; name: string }[] }
  | { error: string };

export async function lookupRitual(code: string): Promise<RitualLookup> {
  const couple = db
    .prepare("SELECT id FROM couples WHERE code = ?")
    .get(code.trim().toUpperCase()) as { id: number } | undefined;
  if (!couple) return { error: "That code does not match any ritual." };
  const members = db
    .prepare("SELECT id, name FROM members WHERE couple_id = ? ORDER BY id")
    .all(couple.id) as { id: number; name: string }[];
  if (members.length >= 2) return { status: "full", members };
  return { status: "open" };
}

export async function joinRitual(
  code: string,
  name: string,
): Promise<{ ok: true } | { error: string }> {
  const trimmed = name.trim().slice(0, 40);
  if (!trimmed) return { error: "Name is required" };
  const couple = db
    .prepare("SELECT id FROM couples WHERE code = ?")
    .get(code.trim().toUpperCase()) as { id: number } | undefined;
  if (!couple) return { error: "That code does not match any ritual." };
  const count = db
    .prepare("SELECT COUNT(*) AS n FROM members WHERE couple_id = ?")
    .get(couple.id) as { n: number };
  if (count.n >= 2) return { error: "This ritual already has two people." };
  const member = db
    .prepare("INSERT INTO members (couple_id, name) VALUES (?, ?)")
    .run(couple.id, trimmed);
  await setSession(Number(member.lastInsertRowid));
  return { ok: true };
}

export async function claimSeat(
  code: string,
  memberId: number,
): Promise<{ ok: true } | { error: string }> {
  const row = db
    .prepare(
      `SELECT m.id FROM members m JOIN couples c ON c.id = m.couple_id
       WHERE m.id = ? AND c.code = ?`,
    )
    .get(memberId, code.trim().toUpperCase()) as { id: number } | undefined;
  if (!row) return { error: "That seat does not match this code." };
  await setSession(row.id);
  return { ok: true };
}

export async function submitAnswer(formData: FormData) {
  const member = await requireMember();
  const mood = Number(formData.get("mood"));
  const text = String(formData.get("text") ?? "").trim();
  if (!Number.isInteger(mood) || mood < 1 || mood > 5) {
    throw new Error("Pick a mood first");
  }
  if (!text) throw new Error("Write a few words first");

  const today = localDay();
  const day = ensureDay(member.coupleId, today);
  db.prepare(
    `INSERT INTO answers (day_id, member_id, mood, text) VALUES (?, ?, ?, ?)
     ON CONFLICT(day_id, member_id) DO UPDATE SET mood = excluded.mood, text = excluded.text`,
  ).run(day.id, member.id, mood, text.slice(0, 2000));

  const streak = getStreak(member.coupleId, today);
  recordBest(member.coupleId, streak.current);

  let milestone: number | null = null;
  if (streak.todayComplete) {
    for (const m of MILESTONES) {
      if (streak.current === m) {
        milestone = m;
        addCelebrated(member.coupleId, m);
      }
    }
  }

  revalidatePath("/");
  redirect(
    `/celebration?s=${streak.current}${milestone ? `&m=${milestone}` : ""}`,
  );
}

export async function sendNote(formData: FormData) {
  const member = await requireMember();
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;
  db.prepare("INSERT INTO notes (couple_id, member_id, text) VALUES (?, ?, ?)").run(
    member.coupleId,
    member.id,
    text.slice(0, 2000),
  );
  revalidatePath("/notes");
}

export async function sendNudge() {
  const member = await requireMember();
  db.prepare("INSERT INTO nudges (couple_id, member_id) VALUES (?, ?)").run(
    member.coupleId,
    member.id,
  );
  revalidatePath("/");
}

export async function markNudgeSeen(nudgeId: number) {
  const member = await requireMember();
  db.prepare("UPDATE nudges SET seen_by = ? WHERE id = ? AND couple_id = ?").run(
    member.id,
    nudgeId,
    member.coupleId,
  );
}

export async function updateProfile(formData: FormData) {
  const member = await requireMember();
  const name = String(formData.get("name") ?? "").trim().slice(0, 40);
  const reminder = String(formData.get("reminder") ?? "20:00");
  if (name) {
    db.prepare("UPDATE members SET name = ? WHERE id = ?").run(name, member.id);
  }
  if (/^\d{2}:\d{2}$/.test(reminder)) {
    db.prepare("UPDATE members SET reminder_time = ? WHERE id = ?").run(
      reminder,
      member.id,
    );
  }
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function updateCategories(categories: string[]) {
  const member = await requireMember();
  const allowed = ["us", "heard", "load", "gratitude", "dreams", "play"];
  const cats = categories.filter((c) => allowed.includes(c));
  if (!cats.length) return;
  db.prepare("UPDATE couples SET categories = ? WHERE id = ?").run(
    JSON.stringify(cats),
    member.coupleId,
  );
  revalidatePath("/settings");
}

export async function switchProfile() {
  const member = await requireMember();
  const partner = getPartner(member);
  if (partner) {
    await setSession(partner.id);
  }
  revalidatePath("/");
  redirect("/");
}

export async function signOut() {
  const store = await cookies();
  store.delete(COOKIE);
  redirect("/onboarding");
}
