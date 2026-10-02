import Database from "better-sqlite3";
import {
  calendarDayOf,
  isCalendarDay,
  lessonKey,
  lessonSeq,
} from "../src/lib/lesson-keys.ts";
import { iDidMyPart } from "../src/lib/lesson-progress.ts";

let failures = 0;
function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) console.log(`ok   ${name}`);
  else {
    failures += 1;
    console.log(`FAIL ${name}: expected ${e}, got ${a}`);
  }
}

function ensureOpen(lessons, memberId, today) {
  const todayLessons = lessons.filter((l) => calendarDayOf(l.day) === today);
  const open = todayLessons.find((l) => !iDidMyPart(l, memberId));
  if (open) return open;
  const nextSeq =
    todayLessons.reduce((max, l) => Math.max(max, lessonSeq(l.day)), 0) + 1;
  return {
    day: lessonKey(today, nextSeq),
    kind: "question",
    answererId: null,
    answers: [],
    guesses: [],
  };
}

const today = "2026-10-02";
const calendar = {
  day: today,
  kind: "question",
  answererId: null,
  answers: [],
  guesses: [],
};

let lessons = [calendar];
check("first open is calendar", ensureOpen(lessons, 1, today).day, today);

calendar.answers = [{ memberId: 1 }];
const extra = ensureOpen(lessons, 1, today);
check("John unlocks extra after his part", extra.day, `${today}#001`);
check("extra is not a calendar day", isCalendarDay(extra.day), false);
check("Ariana still sits on calendar", ensureOpen(lessons, 2, today).day, today);

calendar.answers = [{ memberId: 1 }, { memberId: 2 }];
lessons = [calendar, extra];
check("Ariana catches the extra John opened", ensureOpen(lessons, 2, today).day, `${today}#001`);

extra.answers = [{ memberId: 1 }];
check("trail keeps minting", ensureOpen(lessons, 1, today).day, `${today}#002`);

const db = new Database(":memory:");
db.exec(`
  CREATE TABLE days (
    id INTEGER PRIMARY KEY,
    couple_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    UNIQUE(couple_id, day)
  );
`);
const insert = db.prepare("INSERT INTO days (couple_id, day) VALUES (1, ?)");
insert.run(today);
insert.run(`${today}#001`);
insert.run(`${today}#002`);
check(
  "schema keeps extras on the same calendar day",
  db.prepare("SELECT COUNT(*) AS n FROM days").get().n,
  3,
);

let uniqueFailed = false;
try {
  insert.run(today);
} catch {
  uniqueFailed = true;
}
check("calendar key stays unique", uniqueFailed, true);

process.exit(failures ? 1 : 0);
