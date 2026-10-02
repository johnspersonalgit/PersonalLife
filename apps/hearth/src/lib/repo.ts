import db from "./db";
import { isDayComplete, walkStreak, type PromptKind } from "./streak";
import { shiftDay } from "./time";
import { localDay } from "./today";

export type AnswerView = {
  memberId: number;
  memberName: string;
  mood: number;
  text: string;
  createdAt: string;
};

export type GuessView = {
  memberId: number;
  memberName: string;
  text: string;
  createdAt: string;
};

export type DayView = {
  id: number;
  day: string;
  category: string;
  prompt: string;
  kind: PromptKind;
  options: string[];
  answererId: number | null;
  answers: AnswerView[];
  guesses: GuessView[];
  complete: boolean;
};

export type StreakView = {
  current: number;
  best: number;
  graceLeft: boolean;
  graceDays: string[];
  todayComplete: boolean;
};

export const MILESTONES = [3, 7, 14, 30, 60, 100] as const;

export const MILESTONE_NAMES: Record<number, string> = {
  3: "Spark",
  7: "Kindling",
  14: "Glow",
  30: "Hearthfire",
  60: "Everwarm",
  100: "Centennial",
};

type DayRow = {
  id: number;
  day: string;
  category: string;
  prompt: string;
  kind: PromptKind;
  options: string | null;
  answerer_id: number | null;
};

type AnswerRow = {
  member_id: number;
  member_name: string;
  mood: number;
  text: string;
  created_at: string;
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function coupleCategories(coupleId: number): string[] {
  const row = db
    .prepare("SELECT categories FROM couples WHERE id = ?")
    .get(coupleId) as { categories: string } | undefined;
  if (!row) return [];
  try {
    return JSON.parse(row.categories) as string[];
  } catch {
    return [];
  }
}

function pickPromptId(coupleId: number, day: string): { id: number; kind: PromptKind } {
  const cats = coupleCategories(coupleId);
  const all = (
    cats.length
      ? (db
          .prepare(
            `SELECT id, kind FROM prompts WHERE category IN (${cats.map(() => "?").join(",")}) ORDER BY id`,
          )
          .all(...cats) as { id: number; kind: PromptKind }[])
      : (db
          .prepare("SELECT id, kind FROM prompts ORDER BY id")
          .all() as { id: number; kind: PromptKind }[])
  );

  const recent = new Set(
    (
      db
        .prepare(
          "SELECT prompt_id FROM days WHERE couple_id = ? ORDER BY day DESC LIMIT 21",
        )
        .all(coupleId) as { prompt_id: number }[]
    ).map((r) => r.prompt_id),
  );
  const pool = all.filter((p) => !recent.has(p.id));
  const source = pool.length ? pool : all;
  return source[hashString(`${coupleId}:${day}`) % source.length];
}

function toDayView(row: DayRow, memberCount: number): DayView {
  const answers = (
    db
      .prepare(
        `SELECT a.member_id, m.name AS member_name, a.mood, a.text, a.created_at
         FROM answers a JOIN members m ON m.id = a.member_id
         WHERE a.day_id = ? ORDER BY a.created_at`,
      )
      .all(row.id) as AnswerRow[]
  ).map((a) => ({
    memberId: a.member_id,
    memberName: a.member_name,
    mood: a.mood,
    text: a.text,
    createdAt: a.created_at,
  }));
  const guesses = (
    db
      .prepare(
        `SELECT g.member_id, m.name AS member_name, g.text, g.created_at
         FROM guesses g JOIN members m ON m.id = g.member_id
         WHERE g.day_id = ? ORDER BY g.created_at`,
      )
      .all(row.id) as {
      member_id: number;
      member_name: string;
      text: string;
      created_at: string;
    }[]
  ).map((g) => ({
    memberId: g.member_id,
    memberName: g.member_name,
    text: g.text,
    createdAt: g.created_at,
  }));
  let options: string[] = [];
  if (row.options) {
    try {
      options = JSON.parse(row.options) as string[];
    } catch {
      options = [];
    }
  }
  return {
    id: row.id,
    day: row.day,
    category: row.category,
    prompt: row.prompt,
    kind: row.kind,
    options,
    answererId: row.answerer_id,
    answers,
    guesses,
    complete: isDayComplete(row.kind, answers.length, guesses.length, memberCount),
  };
}

export function memberCount(coupleId: number): number {
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM members WHERE couple_id = ?")
    .get(coupleId) as { n: number };
  return row.n;
}

export function ensureDay(coupleId: number, day: string): DayView {
  const existing = db
    .prepare("SELECT 1 FROM days WHERE couple_id = ? AND day = ?")
    .get(coupleId, day);
  if (!existing) {
    const picked = pickPromptId(coupleId, day);
    let answererId: number | null = null;
    if (picked.kind === "guess") {
      const members = db
        .prepare("SELECT id FROM members WHERE couple_id = ? ORDER BY id")
        .all(coupleId) as { id: number }[];
      const pastGuessDays = db
        .prepare(
          `SELECT COUNT(*) AS n FROM days d JOIN prompts p ON p.id = d.prompt_id
           WHERE d.couple_id = ? AND p.kind = 'guess'`,
        )
        .get(coupleId) as { n: number };
      if (members.length) {
        answererId = members[pastGuessDays.n % members.length].id;
      }
    }
    db.prepare(
      "INSERT INTO days (couple_id, day, prompt_id, answerer_id) VALUES (?, ?, ?, ?)",
    ).run(coupleId, day, picked.id, answererId);
  }
  const row = db
    .prepare(
      `SELECT d.id, d.day, p.category, p.text AS prompt, p.kind, p.options, d.answerer_id
       FROM days d JOIN prompts p ON p.id = d.prompt_id
       WHERE d.couple_id = ? AND d.day = ?`,
    )
    .get(coupleId, day) as DayRow;
  return toDayView(row, memberCount(coupleId));
}

export function getDay(coupleId: number, day: string): DayView | null {
  const row = db
    .prepare(
      `SELECT d.id, d.day, p.category, p.text AS prompt, p.kind, p.options, d.answerer_id
       FROM days d JOIN prompts p ON p.id = d.prompt_id
       WHERE d.couple_id = ? AND d.day = ?`,
    )
    .get(coupleId, day) as DayRow | undefined;
  return row ? toDayView(row, memberCount(coupleId)) : null;
}

export function getRecentDays(coupleId: number, limit = 60): DayView[] {
  const rows = db
    .prepare(
      `SELECT d.id, d.day, p.category, p.text AS prompt, p.kind, p.options, d.answerer_id
       FROM days d JOIN prompts p ON p.id = d.prompt_id
       WHERE d.couple_id = ? ORDER BY d.day DESC LIMIT ?`,
    )
    .all(coupleId, limit) as DayRow[];
  const n = memberCount(coupleId);
  return rows.map((r) => toDayView(r, n));
}

export function getStreak(coupleId: number, today: string = localDay()): StreakView {
  const n = memberCount(coupleId);
  const rows = db
    .prepare(
      `SELECT d.day, p.kind AS kind,
         (SELECT COUNT(*) FROM answers a WHERE a.day_id = d.id) AS answered,
         (SELECT COUNT(*) FROM guesses g WHERE g.day_id = d.id) AS guessed
       FROM days d JOIN prompts p ON p.id = d.prompt_id
       WHERE d.couple_id = ? ORDER BY d.day DESC`,
    )
    .all(coupleId) as { day: string; kind: PromptKind; answered: number; guessed: number }[];
  const byDay = new Map(
    rows.map((r) => [
      r.day,
      isDayComplete(r.kind, r.answered, r.guessed, n),
    ]),
  );

  const first = db
    .prepare("SELECT MIN(day) AS first FROM days WHERE couple_id = ?")
    .get(coupleId) as { first: string | null };

  const walk = walkStreak(byDay, first.first, today);

  const meta = db
    .prepare("SELECT best FROM streak_meta WHERE couple_id = ?")
    .get(coupleId) as { best: number } | undefined;

  return {
    current: walk.current,
    best: Math.max(meta?.best ?? 0, walk.current),
    graceLeft: walk.graceDays.length === 0,
    graceDays: walk.graceDays,
    todayComplete: walk.todayComplete,
  };
}

export function recordBest(coupleId: number, current: number): void {
  db.prepare(
    `INSERT INTO streak_meta (couple_id, best) VALUES (?, ?)
     ON CONFLICT(couple_id) DO UPDATE SET best = MAX(best, excluded.best)`,
  ).run(coupleId, current);
}

export function getCelebrated(coupleId: number): number[] {
  const row = db
    .prepare("SELECT celebrated FROM streak_meta WHERE couple_id = ?")
    .get(coupleId) as { celebrated: string } | undefined;
  if (!row) return [];
  try {
    return JSON.parse(row.celebrated) as number[];
  } catch {
    return [];
  }
}

export function addCelebrated(coupleId: number, milestone: number): void {
  const celebrated = getCelebrated(coupleId);
  if (celebrated.includes(milestone)) return;
  celebrated.push(milestone);
  db.prepare(
    `INSERT INTO streak_meta (couple_id, celebrated) VALUES (?, ?)
     ON CONFLICT(couple_id) DO UPDATE SET celebrated = excluded.celebrated`,
  ).run(coupleId, JSON.stringify(celebrated));
}

export type WeekDot = {
  day: string;
  label: string;
  state: "done" | "grace" | "missed" | "today-open" | "today-done";
};

export function weekStatus(coupleId: number, today: string = localDay()): WeekDot[] {
  const days = getRecentDays(coupleId, 14);
  const byDay = new Map(days.map((d) => [d.day, d.complete]));
  const graceDays = new Set(getStreak(coupleId, today).graceDays);
  const dots: WeekDot[] = [];
  const labels = ["S", "M", "T", "W", "T", "F", "S"];
  for (let i = 6; i >= 0; i--) {
    const day = shiftDay(today, -i);
    const dow = labels[new Date(`${day}T12:00:00`).getDay()];
    let state: WeekDot["state"];
    if (day === today) {
      state = byDay.get(today) ? "today-done" : "today-open";
    } else if (byDay.get(day) === true) {
      state = "done";
    } else if (graceDays.has(day)) {
      state = "grace";
    } else {
      state = "missed";
    }
    dots.push({ day, label: dow, state });
  }
  return dots;
}

export type NoteView = {
  id: number;
  memberId: number;
  memberName: string;
  text: string;
  createdAt: string;
};

export function getNotes(coupleId: number, limit = 100): NoteView[] {
  const rows = db
    .prepare(
      `SELECT n.id, n.member_id, m.name AS member_name, n.text, n.created_at
       FROM notes n JOIN members m ON m.id = n.member_id
       WHERE n.couple_id = ? ORDER BY n.created_at DESC LIMIT ?`,
    )
    .all(coupleId, limit) as {
    id: number;
    member_id: number;
    member_name: string;
    text: string;
    created_at: string;
  }[];
  return rows.map((r) => ({
    id: r.id,
    memberId: r.member_id,
    memberName: r.member_name,
    text: r.text,
    createdAt: r.created_at,
  }));
}

export type NudgeView = {
  id: number;
  fromName: string;
  createdAt: string;
};

export function unseenNudgesFor(memberId: number, coupleId: number): NudgeView[] {
  const rows = db
    .prepare(
      `SELECT n.id, m.name AS from_name, n.created_at
       FROM nudges n JOIN members m ON m.id = n.member_id
       WHERE n.couple_id = ? AND n.member_id != ? AND (n.seen_by IS NULL OR n.seen_by != ?)
       ORDER BY n.created_at DESC`,
    )
    .all(coupleId, memberId, memberId) as {
    id: number;
    from_name: string;
    created_at: string;
  }[];
  return rows.map((r) => ({ id: r.id, fromName: r.from_name, createdAt: r.created_at }));
}
