import db from "./db";
import { generateQuestPrompt } from "./generate-prompt";
import {
  calendarDayOf,
  isCalendarDay,
  lessonKey,
  lessonSeq,
} from "./lesson-keys";
import { iDidMyPart } from "./lesson-progress";
import { choosePrompt } from "./pick-prompt";
import { isDayComplete, walkStreak, type PromptKind } from "./streak";
import { nextDepth } from "./thread";
import { shiftDay } from "./time";
import { localDay } from "./today";

export { iDidMyPart } from "./lesson-progress";

export type AnswerView = {
  memberId: number;
  memberName: string;
  avatar: string | null;
  color: string | null;
  mood: number;
  text: string;
  createdAt: string;
};

export type GuessView = {
  memberId: number;
  memberName: string;
  avatar: string | null;
  color: string | null;
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
  parentId: number | null;
  depth: number;
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
  parent_id: number | null;
  depth: number;
};

type AnswerRow = {
  member_id: number;
  member_name: string;
  member_avatar: string | null;
  member_color: string | null;
  mood: number;
  text: string;
  created_at: string;
};

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

function pickPromptId(
  coupleId: number,
  day: string,
  preferKind?: PromptKind,
): { id: number; kind: PromptKind } {
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

  const recent = (
    db
      .prepare(
        "SELECT prompt_id FROM days WHERE couple_id = ? ORDER BY day DESC LIMIT 21",
      )
      .all(coupleId) as { prompt_id: number }[]
  ).map((r) => r.prompt_id);
  return choosePrompt(all, recent, coupleId, day, preferKind);
}

function toDayView(row: DayRow, memberCount: number): DayView {
  const answers = (
    db
      .prepare(
        `SELECT a.member_id, m.name AS member_name, m.avatar AS member_avatar, m.color AS member_color, a.mood, a.text, a.created_at
         FROM answers a JOIN members m ON m.id = a.member_id
         WHERE a.day_id = ? ORDER BY a.created_at`,
      )
      .all(row.id) as AnswerRow[]
  ).map((a) => ({
    memberId: a.member_id,
    memberName: a.member_name,
    avatar: a.member_avatar,
    color: a.member_color,
    mood: a.mood,
    text: a.text,
    createdAt: a.created_at,
  }));
  const guesses = (
    db
      .prepare(
        `SELECT g.member_id, m.name AS member_name, m.avatar AS member_avatar, m.color AS member_color, g.text, g.created_at
         FROM guesses g JOIN members m ON m.id = g.member_id
         WHERE g.day_id = ? ORDER BY g.created_at`,
      )
      .all(row.id) as {
      member_id: number;
      member_name: string;
      member_avatar: string | null;
      member_color: string | null;
      text: string;
      created_at: string;
    }[]
  ).map((g) => ({
    memberId: g.member_id,
    memberName: g.member_name,
    avatar: g.member_avatar,
    color: g.member_color,
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
    parentId: row.parent_id ?? null,
    depth: row.depth ?? 0,
  };
}

export function memberCount(coupleId: number): number {
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM members WHERE couple_id = ?")
    .get(coupleId) as { n: number };
  return row.n;
}

function coupleDayCount(coupleId: number): number {
  return (
    db
      .prepare("SELECT COUNT(*) AS n FROM days WHERE couple_id = ?")
      .get(coupleId) as { n: number }
  ).n;
}

function rewriteUnansweredFirstDay(coupleId: number, day: string): void {
  const row = db
    .prepare(
      `SELECT d.id, p.kind,
         (SELECT COUNT(*) FROM answers a WHERE a.day_id = d.id) AS answered,
         (SELECT COUNT(*) FROM guesses g WHERE g.day_id = d.id) AS guessed
       FROM days d JOIN prompts p ON p.id = d.prompt_id
       WHERE d.couple_id = ? AND d.day = ?`,
    )
    .get(coupleId, day) as
    | { id: number; kind: PromptKind; answered: number; guessed: number }
    | undefined;
  if (!row) return;
  if (coupleDayCount(coupleId) !== 1) return;
  if (row.answered || row.guessed) return;
  if (row.kind === "question") return;
  const picked = pickPromptId(coupleId, `${day}:first`, "question");
  db.prepare("UPDATE days SET prompt_id = ?, answerer_id = NULL WHERE id = ?").run(
    picked.id,
    row.id,
  );
}

function insertGeneratedPrompt(quest: {
  category: string;
  text: string;
  kind: PromptKind;
}): number {
  const existing = db
    .prepare("SELECT id FROM prompts WHERE text = ?")
    .get(quest.text) as { id: number } | undefined;
  if (existing) return existing.id;
  const row = db
    .prepare(
      "INSERT INTO prompts (category, text, kind, options) VALUES (?, ?, ?, NULL)",
    )
    .run(quest.category, quest.text, quest.kind);
  return Number(row.lastInsertRowid);
}

function recentPromptTexts(coupleId: number): string[] {
  return (
    db
      .prepare(
        `SELECT p.text FROM days d JOIN prompts p ON p.id = d.prompt_id
         WHERE d.couple_id = ? ORDER BY d.day DESC LIMIT 24`,
      )
      .all(coupleId) as { text: string }[]
  ).map((r) => r.text);
}

export function getThread(coupleId: number, lesson: DayView): DayView[] {
  const chain: DayView[] = [lesson];
  let parentId = lesson.parentId;
  let guard = 0;
  while (parentId && guard < 12) {
    const parent = getLessonById(coupleId, parentId);
    if (!parent) break;
    chain.unshift(parent);
    parentId = parent.parentId;
    guard += 1;
  }
  return chain;
}

function threadPrompts(coupleId: number, lesson: DayView): string[] {
  return getThread(coupleId, lesson).map((item) => item.prompt);
}

async function pickDeeperPromptId(
  coupleId: number,
  parent: DayView | null,
): Promise<number | null> {
  const cats = coupleCategories(coupleId);
  const recent = recentPromptTexts(coupleId);
  const thread = parent ? threadPrompts(coupleId, parent) : [];
  const generated = await generateQuestPrompt({
    categories: cats.length ? cats : parent ? [parent.category] : [],
    recentTexts: recent,
    followUpTo: parent?.prompt,
    thread,
    deeper: Boolean(parent),
  });
  if (!generated) return null;
  return insertGeneratedPrompt(generated);
}

export function ensureDay(
  coupleId: number,
  day: string,
  preferKind?: PromptKind,
  promptId?: number,
  parentId?: number,
): DayView {
  const existing = db
    .prepare("SELECT 1 FROM days WHERE couple_id = ? AND day = ?")
    .get(coupleId, day);
  if (!existing) {
    const isFirst = coupleDayCount(coupleId) === 0;
    const extra = !isCalendarDay(day);
    const forced = promptId
      ? (db
          .prepare("SELECT id, kind FROM prompts WHERE id = ?")
          .get(promptId) as { id: number; kind: PromptKind } | undefined)
      : undefined;
    const picked =
      forced ??
      pickPromptId(
        coupleId,
        day,
        preferKind ?? (isFirst || extra ? "question" : undefined),
      );
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
    const parentDepth =
      parentId != null
        ? (
            db
              .prepare("SELECT depth FROM days WHERE id = ? AND couple_id = ?")
              .get(parentId, coupleId) as { depth: number } | undefined
          )?.depth
        : undefined;
    db.prepare(
      "INSERT INTO days (couple_id, day, prompt_id, answerer_id, parent_id, depth) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(
      coupleId,
      day,
      picked.id,
      answererId,
      parentId ?? null,
      nextDepth(parentDepth ?? (parentId != null ? 0 : -1)),
    );
  } else if (isCalendarDay(day)) {
    rewriteUnansweredFirstDay(coupleId, day);
  }
  const row = db
    .prepare(
      `SELECT d.id, d.day, d.parent_id, d.depth, p.category, p.text AS prompt, p.kind, p.options, d.answerer_id
       FROM days d JOIN prompts p ON p.id = d.prompt_id
       WHERE d.couple_id = ? AND d.day = ?`,
    )
    .get(coupleId, day) as DayRow;
  return toDayView(row, memberCount(coupleId));
}

export function getDay(coupleId: number, day: string): DayView | null {
  const row = db
    .prepare(
      `SELECT d.id, d.day, d.parent_id, d.depth, p.category, p.text AS prompt, p.kind, p.options, d.answerer_id
       FROM days d JOIN prompts p ON p.id = d.prompt_id
       WHERE d.couple_id = ? AND d.day = ?`,
    )
    .get(coupleId, day) as DayRow | undefined;
  return row ? toDayView(row, memberCount(coupleId)) : null;
}

export function getRecentDays(coupleId: number, limit = 60): DayView[] {
  const rows = db
    .prepare(
      `SELECT d.id, d.day, d.parent_id, d.depth, p.category, p.text AS prompt, p.kind, p.options, d.answerer_id
       FROM days d JOIN prompts p ON p.id = d.prompt_id
       WHERE d.couple_id = ? ORDER BY d.day DESC LIMIT ?`,
    )
    .all(coupleId, limit) as DayRow[];
  const n = memberCount(coupleId);
  return rows.map((r) => toDayView(r, n));
}

export function getLessons(coupleId: number): DayView[] {
  const rows = db
    .prepare(
      `SELECT d.id, d.day, d.parent_id, d.depth, p.category, p.text AS prompt, p.kind, p.options, d.answerer_id
       FROM days d JOIN prompts p ON p.id = d.prompt_id
       WHERE d.couple_id = ? ORDER BY d.day ASC`,
    )
    .all(coupleId) as DayRow[];
  const n = memberCount(coupleId);
  return rows.map((r) => toDayView(r, n));
}

export async function ensureOpenLesson(
  coupleId: number,
  memberId: number,
  today: string = localDay(),
): Promise<DayView> {
  ensureDay(coupleId, today);
  const todayLessons = getLessons(coupleId).filter(
    (l) => calendarDayOf(l.day) === today,
  );
  const open = todayLessons.find((l) => !iDidMyPart(l, memberId));
  if (open) return open;
  const parent =
    [...todayLessons].reverse().find((l) => iDidMyPart(l, memberId)) ?? null;
  const nextSeq =
    todayLessons.reduce((max, l) => Math.max(max, lessonSeq(l.day)), 0) + 1;
  const generatedId = await pickDeeperPromptId(coupleId, parent);
  return ensureDay(
    coupleId,
    lessonKey(today, nextSeq),
    "question",
    generatedId ?? undefined,
    parent?.id,
  );
}

export function sessionCombo(
  coupleId: number,
  memberId: number,
  today: string = localDay(),
): number {
  return getLessons(coupleId).filter(
    (l) => calendarDayOf(l.day) === today && iDidMyPart(l, memberId),
  ).length;
}

export function getLessonById(
  coupleId: number,
  id: number,
): DayView | null {
  const row = db
    .prepare(
      `SELECT d.id, d.day, d.parent_id, d.depth, p.category, p.text AS prompt, p.kind, p.options, d.answerer_id
       FROM days d JOIN prompts p ON p.id = d.prompt_id
       WHERE d.couple_id = ? AND d.id = ?`,
    )
    .get(coupleId, id) as DayRow | undefined;
  return row ? toDayView(row, memberCount(coupleId)) : null;
}

export type EchoView = {
  id: number;
  memberId: number;
  memberName: string;
  avatar: string | null;
  color: string | null;
  text: string;
  createdAt: string;
};

export function getEchoes(dayId: number): EchoView[] {
  const rows = db
    .prepare(
      `SELECT e.id, e.member_id, m.name AS member_name, m.avatar, m.color, e.text, e.created_at
       FROM echoes e JOIN members m ON m.id = e.member_id
       WHERE e.day_id = ? ORDER BY e.created_at`,
    )
    .all(dayId) as {
    id: number;
    member_id: number;
    member_name: string;
    avatar: string | null;
    color: string | null;
    text: string;
    created_at: string;
  }[];
  return rows.map((r) => ({
    id: r.id,
    memberId: r.member_id,
    memberName: r.member_name,
    avatar: r.avatar,
    color: r.color,
    text: r.text,
    createdAt: r.created_at,
  }));
}

export function addEcho(
  coupleId: number,
  memberId: number,
  dayId: number,
  text: string,
): void {
  const lesson = getLessonById(coupleId, dayId);
  if (!lesson) return;
  const trimmed = text.trim().slice(0, 280);
  if (!trimmed) return;
  db.prepare("INSERT INTO echoes (day_id, member_id, text) VALUES (?, ?, ?)").run(
    dayId,
    memberId,
    trimmed,
  );
}

function nextExtraKey(coupleId: number, today: string): string {
  ensureDay(coupleId, today);
  const todayLessons = getLessons(coupleId).filter(
    (l) => calendarDayOf(l.day) === today,
  );
  const nextSeq =
    todayLessons.reduce((max, l) => Math.max(max, lessonSeq(l.day)), 0) + 1;
  return lessonKey(today, nextSeq);
}

export function replayLesson(
  coupleId: number,
  sourceId: number,
  today: string = localDay(),
): DayView | null {
  const source = getLessonById(coupleId, sourceId);
  if (!source) return null;
  const prompt = db
    .prepare("SELECT prompt_id FROM days WHERE id = ? AND couple_id = ?")
    .get(sourceId, coupleId) as { prompt_id: number } | undefined;
  if (!prompt) return null;
  return ensureDay(
    coupleId,
    nextExtraKey(coupleId, today),
    source.kind,
    prompt.prompt_id,
    source.id,
  );
}

export async function followUpLesson(
  coupleId: number,
  sourceId: number,
  today: string = localDay(),
): Promise<DayView | null> {
  const source = getLessonById(coupleId, sourceId);
  if (!source) return null;
  const cats = coupleCategories(coupleId);
  const recent = (
    db
      .prepare(
        `SELECT p.text FROM days d JOIN prompts p ON p.id = d.prompt_id
         WHERE d.couple_id = ? ORDER BY d.day DESC LIMIT 24`,
      )
      .all(coupleId) as { text: string }[]
  ).map((r) => r.text);
  const generated = await generateQuestPrompt({
    categories: cats.length ? cats : [source.category],
    recentTexts: recent,
    followUpTo: source.prompt,
    thread: threadPrompts(coupleId, source),
    deeper: true,
  });
  const promptId = generated ? insertGeneratedPrompt(generated) : null;
  return ensureDay(
    coupleId,
    nextExtraKey(coupleId, today),
    "question",
    promptId ?? undefined,
    source.id,
  );
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
  const calendarRows = rows.filter((r) => isCalendarDay(r.day));
  const byDay = new Map(
    calendarRows.map((r) => [
      r.day,
      isDayComplete(r.kind, r.answered, r.guessed, n),
    ]),
  );

  const first = db
    .prepare(
      "SELECT MIN(day) AS first FROM days WHERE couple_id = ? AND day NOT LIKE '%#%'",
    )
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
  const days = getRecentDays(coupleId, 80);
  const byDay = new Map(
    days.filter((d) => isCalendarDay(d.day)).map((d) => [d.day, d.complete]),
  );
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
  avatar: string | null;
  color: string | null;
  text: string;
  createdAt: string;
};

export function getNotes(coupleId: number, limit = 100): NoteView[] {
  const rows = db
    .prepare(
      `SELECT n.id, n.member_id, m.name AS member_name, m.avatar AS member_avatar, m.color AS member_color, n.text, n.created_at
       FROM notes n JOIN members m ON m.id = n.member_id
       WHERE n.couple_id = ? ORDER BY n.created_at DESC LIMIT ?`,
    )
    .all(coupleId, limit) as {
    id: number;
    member_id: number;
    member_name: string;
    member_avatar: string | null;
    member_color: string | null;
    text: string;
    created_at: string;
  }[];
  return rows.map((r) => ({
    id: r.id,
    memberId: r.member_id,
    memberName: r.member_name,
    avatar: r.member_avatar,
    color: r.member_color,
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
