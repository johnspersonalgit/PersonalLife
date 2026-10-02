import { walkStreak, isDayComplete } from "../src/lib/streak.ts";

let failures = 0;

function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`ok   ${name}`);
  } else {
    failures += 1;
    console.log(`FAIL ${name}: expected ${e}, got ${a}`);
  }
}

const today = "2026-10-01";

// 1. Gap day with no row at all is absorbed by grace, run continues past it.
check(
  "missing day uses grace and continues",
  walkStreak(
    new Map([
      ["2026-09-30", true],
      ["2026-09-29", true],
      ["2026-09-27", true],
      ["2026-09-26", true],
      ["2026-09-25", true],
    ]),
    "2026-09-25",
    today,
  ),
  { current: 5, graceDays: ["2026-09-28"], todayComplete: false },
);

// 2. Completed today counts and extends the run.
check(
  "complete today counts",
  walkStreak(
    new Map([
      [today, true],
      ["2026-09-30", true],
      ["2026-09-29", true],
      ["2026-09-27", true],
      ["2026-09-26", true],
      ["2026-09-25", true],
    ]),
    "2026-09-25",
    today,
  ).current,
  6,
);

// 3. Two misses inside one 7-day window end the run at the second miss.
check(
  "second miss in window breaks",
  walkStreak(
    new Map([
      ["2026-09-30", true],
      ["2026-09-28", true],
      ["2026-09-25", true],
    ]),
    "2026-09-25",
    today,
  ),
  { current: 2, graceDays: ["2026-09-29"], todayComplete: false },
);

// 4. An open today neither counts nor breaks.
check(
  "open today keeps streak alive",
  walkStreak(
  new Map([
      ["2026-09-30", true],
      ["2026-09-29", true],
    ]),
    "2026-09-29",
    today,
  ).current,
  2,
);

// 5. No history at all: zero, no grace spent.
check(
  "empty history",
  walkStreak(new Map(), null, today),
  { current: 0, graceDays: [], todayComplete: false },
);

// 6. A half-answered past day (exists but incomplete) consumes grace too.
check(
  "incomplete day row consumes grace",
  walkStreak(
    new Map([
      ["2026-09-30", true],
      ["2026-09-29", false],
      ["2026-09-28", true],
    ]),
    "2026-09-28",
    today,
  ),
  { current: 2, graceDays: ["2026-09-29"], todayComplete: false },
);

// 7. Kind-aware completion.
check("question needs both", isDayComplete("question", 1, 0, 2), false);
check("question complete at both", isDayComplete("question", 2, 0, 2), true);
check("rapid needs both", isDayComplete("rapid", 1, 0, 2), false);
check("mission needs both", isDayComplete("mission", 2, 0, 2), true);
check("guess needs answer plus guess", isDayComplete("guess", 1, 0, 2), false);
check("guess complete", isDayComplete("guess", 1, 1, 2), true);
check("guess: two answers without guess is not complete", isDayComplete("guess", 2, 0, 2), false);

process.exit(failures ? 1 : 0);
