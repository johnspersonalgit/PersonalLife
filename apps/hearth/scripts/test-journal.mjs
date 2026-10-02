import { journalThreads } from "../src/lib/journal.ts";

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

const today = "2026-10-02";
const root = {
  id: 1,
  day: today,
  prompt: "What do you wish we had ten more minutes for?",
  complete: true,
  answers: [{ memberId: 1 }, { memberId: 2 }],
};
const extra = {
  id: 2,
  day: `${today}#001`,
  prompt: "What small kindness landed this week?",
  complete: false,
  answers: [{ memberId: 1 }],
};
const openExtra = {
  id: 3,
  day: `${today}#002`,
  prompt: "Still on the path",
  complete: false,
  answers: [],
};

const threads = journalThreads([openExtra, extra, root]);
check("one thread per calendar day", threads.length, 1);
check("root stays the calendar quest", threads[0].root?.id, 1);
check("answered extra stays in the thread", threads[0].layers.map((l) => l.id), [2]);
check("unanswered open extra stays on the path", threads[0].layers.length, 1);

process.exit(failures ? 1 : 0);
