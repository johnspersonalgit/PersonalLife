import {
  calendarDayOf,
  compareLessonKeys,
  isCalendarDay,
  lessonKey,
  lessonSeq,
} from "../src/lib/lesson-keys.ts";
import { canActOnLesson, iDidMyPart } from "../src/lib/lesson-progress.ts";
import { prettyDay } from "../src/lib/time.ts";

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

check("calendar key", isCalendarDay("2026-10-02"), true);
check("extra key is not calendar", isCalendarDay("2026-10-02#001"), false);
check("calendarDayOf extra", calendarDayOf("2026-10-02#001"), "2026-10-02");
check("seq 0", lessonSeq("2026-10-02"), 0);
check("seq 1", lessonSeq("2026-10-02#001"), 1);
check("lessonKey 0", lessonKey("2026-10-02", 0), "2026-10-02");
check("lessonKey 1", lessonKey("2026-10-02", 1), "2026-10-02#001");
check(
  "compare calendar before extra",
  compareLessonKeys("2026-10-02", "2026-10-02#001") < 0,
  true,
);
check("prettyDay calendar stays a date", prettyDay("2026-10-02").includes("#"), false);
check("prettyDay extra adds the count", prettyDay("2026-10-02#001").includes("· 2"), true);

const question = {
  kind: "question",
  answererId: null,
  answers: [{ memberId: 1 }],
  guesses: [],
};
check("iDidMyPart after my answer", iDidMyPart(question, 1), true);
check("iDidMyPart partner still open", iDidMyPart(question, 2), false);
check("canAct after my answer", canActOnLesson(question, 1), false);
check("canAct partner", canActOnLesson(question, 2), true);

const guessWait = {
  kind: "guess",
  answererId: 1,
  answers: [],
  guesses: [],
};
check("guesser waits", canActOnLesson(guessWait, 2), false);
check("answerer can start", canActOnLesson(guessWait, 1), true);

process.exit(failures ? 1 : 0);
