"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import db from "./db";
import { hashPin, isValidPin, verifyPin } from "./pin.mjs";
import { sendToMember } from "./push";
import {
  addCelebrated,
  ensureDay,
  getStreak,
  recordBest,
  MILESTONES,
} from "./repo";
import { getSessionMember, getPartner, type Member } from "./session";
import { localDay } from "./today";

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
  pin: string,
): Promise<{ code: string } | { error: string }> {
  const trimmed = name.trim().slice(0, 40);
  if (!trimmed) return { error: "Name is required" };
  if (!isValidPin(pin)) return { error: "Pick a 4 to 6 digit PIN." };
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
      .prepare(
        "INSERT INTO members (couple_id, name, pin_hash, avatar, color) VALUES (?, ?, ?, ?, ?)",
      )
      .run(couple.lastInsertRowid, trimmed, hashPin(pin), "bear", "blue");
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
  | { status: "full"; members: { id: number; name: string; avatar: string | null; color: string | null }[] }
  | { error: string };

export async function lookupRitual(code: string): Promise<RitualLookup> {
  const couple = db
    .prepare("SELECT id FROM couples WHERE code = ?")
    .get(code.trim().toUpperCase()) as { id: number } | undefined;
  if (!couple) return { error: "That code does not match any ritual." };
  const members = db
    .prepare("SELECT id, name, avatar, color FROM members WHERE couple_id = ? ORDER BY id")
    .all(couple.id) as {
    id: number;
    name: string;
    avatar: string | null;
    color: string | null;
  }[];
  if (members.length >= 2) return { status: "full", members };
  return { status: "open" };
}

export async function joinRitual(
  code: string,
  name: string,
  pin: string,
): Promise<{ ok: true } | { error: string }> {
  const trimmed = name.trim().slice(0, 40);
  if (!trimmed) return { error: "Name is required" };
  if (!isValidPin(pin)) return { error: "Pick a 4 to 6 digit PIN." };
  const couple = db
    .prepare("SELECT id FROM couples WHERE code = ?")
    .get(code.trim().toUpperCase()) as { id: number } | undefined;
  if (!couple) return { error: "That code does not match any ritual." };
  const count = db
    .prepare("SELECT COUNT(*) AS n FROM members WHERE couple_id = ?")
    .get(couple.id) as { n: number };
  if (count.n >= 2) return { error: "This ritual already has two people." };
  const member = db
    .prepare(
      "INSERT INTO members (couple_id, name, pin_hash, avatar, color) VALUES (?, ?, ?, ?, ?)",
    )
    .run(couple.id, trimmed, hashPin(pin), "rabbit", "rose");
  await setSession(Number(member.lastInsertRowid));
  return { ok: true };
}

export async function claimSeat(
  code: string,
  memberId: number,
  pin: string,
): Promise<{ ok: true } | { error: string }> {
  const row = db
    .prepare(
      `SELECT m.id, m.pin_hash FROM members m JOIN couples c ON c.id = m.couple_id
       WHERE m.id = ? AND c.code = ?`,
    )
    .get(memberId, code.trim().toUpperCase()) as
    | { id: number; pin_hash: string | null }
    | undefined;
  if (!row) return { error: "That seat does not match this code." };
  if (!verifyPin(pin, row.pin_hash)) return { error: "Wrong PIN for that seat." };
  await setSession(row.id);
  return { ok: true };
}

export async function updateAvatar(avatarId: string) {
  const member = await requireMember();
  const allowed = ["ember", "bear", "rabbit", "fox", "deer"];
  if (!allowed.includes(avatarId)) return;
  db.prepare("UPDATE members SET avatar = ? WHERE id = ?").run(
    avatarId,
    member.id,
  );
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function updatePin(
  current: string,
  next: string,
): Promise<{ ok: true } | { error: string }> {
  const member = await requireMember();
  const row = db
    .prepare("SELECT pin_hash FROM members WHERE id = ?")
    .get(member.id) as { pin_hash: string | null };
  if (!verifyPin(current, row.pin_hash)) return { error: "Current PIN is wrong." };
  if (!isValidPin(next)) return { error: "Pick a 4 to 6 digit PIN." };
  db.prepare("UPDATE members SET pin_hash = ? WHERE id = ?").run(
    hashPin(next),
    member.id,
  );
  return { ok: true };
}

async function finishDay(member: Member): Promise<never> {
  const today = localDay();
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

  await finishDay(member);
}

export async function submitRapid(choice: string) {
  const member = await requireMember();
  const today = localDay();
  const day = ensureDay(member.coupleId, today);
  if (day.kind !== "rapid" || !day.options.includes(choice)) {
    throw new Error("That is not one of today's options");
  }
  db.prepare(
    `INSERT INTO answers (day_id, member_id, mood, text) VALUES (?, ?, 0, ?)
     ON CONFLICT(day_id, member_id) DO UPDATE SET text = excluded.text`,
  ).run(day.id, member.id, choice);

  await finishDay(member);
}

export async function submitMission(note: string) {
  const member = await requireMember();
  const today = localDay();
  const day = ensureDay(member.coupleId, today);
  if (day.kind !== "mission") throw new Error("Today is not a mission");
  db.prepare(
    `INSERT INTO answers (day_id, member_id, mood, text) VALUES (?, ?, 0, ?)
     ON CONFLICT(day_id, member_id) DO UPDATE SET text = excluded.text`,
  ).run(day.id, member.id, note.trim().slice(0, 2000));

  await finishDay(member);
}

export async function submitGuessAnswer(text: string) {
  const member = await requireMember();
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Write your answer first");
  const today = localDay();
  const day = ensureDay(member.coupleId, today);
  if (day.kind !== "guess") throw new Error("Today is not a guess day");
  if (day.answererId !== member.id) throw new Error("Today is your person's answer");
  db.prepare(
    `INSERT INTO answers (day_id, member_id, mood, text) VALUES (?, ?, 0, ?)
     ON CONFLICT(day_id, member_id) DO UPDATE SET text = excluded.text`,
  ).run(day.id, member.id, trimmed.slice(0, 2000));

  await finishDay(member);
}

export async function submitGuess(text: string) {
  const member = await requireMember();
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Write your guess first");
  const today = localDay();
  const day = ensureDay(member.coupleId, today);
  if (day.kind !== "guess") throw new Error("Today is not a guess day");
  if (day.answererId === member.id) throw new Error("You are the answerer today");
  const answered = day.answers.some((a) => a.memberId === day.answererId);
  if (!answered) throw new Error("Your person has not answered yet");
  db.prepare(
    `INSERT INTO guesses (day_id, member_id, text) VALUES (?, ?, ?)
     ON CONFLICT(day_id, member_id) DO UPDATE SET text = excluded.text`,
  ).run(day.id, member.id, trimmed.slice(0, 2000));

  await finishDay(member);
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
  const partner = getPartner(member);
  if (partner) {
    await sendToMember(partner.id, {
      title: "Hearth",
      body: `${member.name} sent a thinking-of-you.`,
      url: "/",
    });
  }
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
