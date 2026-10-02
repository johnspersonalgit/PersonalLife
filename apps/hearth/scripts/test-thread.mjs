import {
  comboBody,
  comboTitle,
  isChestDepth,
  nextDepth,
  pathSection,
  pathUnit,
  startLabel,
} from "../src/lib/thread.ts";
import {
  calendarDayOf,
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

check("root depth", nextDepth(undefined), 0);
check("child of root", nextDepth(0), 1);
check("child of layer 2", nextDepth(2), 3);
check("root is not a chest", isChestDepth(0), false);
check("layer 1 is not a chest", isChestDepth(1), false);
check("every third layer is a chest", isChestDepth(3), true);
check("sixth layer is a chest", isChestDepth(6), true);
check("unit stays 1 until combo 4", pathUnit(3), 1);
check("unit 2 at combo 4", pathUnit(4), 2);
check("section 1 at combo 1", pathSection(1), 1);
check("section 2 at combo 21", pathSection(21), 2);
check("calendar start", startLabel(0), "START");
check("thread start", startLabel(1), "DEEPER");
check("chest start", startLabel(3), "CHEST");
check("combo title at 2", comboTitle(2, 1), "Keep going");
check("combo title at 3", comboTitle(3, 2), "Combo");
check("chest title", comboTitle(4, 3), "Chest unlocked");
check("deeper body mentions thread", comboBody(2, 1).includes("Same thread"), true);
check("chest body mentions chest", comboBody(4, 3).includes("chest"), true);

function mintChild(lessons, memberId, today) {
  const todayLessons = lessons.filter((l) => calendarDayOf(l.day) === today);
  const open = todayLessons.find((l) => !iDidMyPart(l, memberId));
  if (open) return open;
  const parent =
    [...todayLessons].reverse().find((l) => iDidMyPart(l, memberId)) ?? null;
  const nextSeq =
    todayLessons.reduce((max, l) => Math.max(max, lessonSeq(l.day)), 0) + 1;
  return {
    id: lessons.length + 1,
    day: lessonKey(today, nextSeq),
    parentId: parent?.id ?? null,
    depth: nextDepth(parent?.depth ?? -1),
    kind: "question",
    answererId: null,
    answers: [],
    guesses: [],
  };
}

const today = "2026-10-02";
const calendar = {
  id: 1,
  day: today,
  parentId: null,
  depth: 0,
  kind: "question",
  answererId: null,
  answers: [{ memberId: 1 }],
  guesses: [],
};
let lessons = [calendar];
const extra1 = mintChild(lessons, 1, today);
lessons = [calendar, extra1];
check("first extra parents the calendar", extra1.parentId, 1);
check("first extra is layer 1", extra1.depth, 1);
check("first extra start is DEEPER", startLabel(extra1.depth), "DEEPER");

extra1.answers = [{ memberId: 1 }];
const extra2 = mintChild(lessons, 1, today);
lessons = [calendar, extra1, extra2];
check("second extra parents the first extra", extra2.parentId, extra1.id);
check("second extra is layer 2", extra2.depth, 2);

extra2.answers = [{ memberId: 1 }];
const extra3 = mintChild(lessons, 1, today);
check("third extra parents the second extra", extra3.parentId, extra2.id);
check("third extra is a chest", extra3.depth, 3);
check("third extra start is CHEST", startLabel(extra3.depth), "CHEST");

function sessionCombo(rows, memberId) {
  return rows.filter(
    (l) => calendarDayOf(l.day) === today && iDidMyPart(l, memberId),
  ).length;
}
extra3.answers = [{ memberId: 1 }];
lessons = [calendar, extra1, extra2, extra3];
check("combo counts the whole thread", sessionCombo(lessons, 1), 4);
check("partner combo stays 0", sessionCombo(lessons, 2), 0);

process.exit(failures ? 1 : 0);
