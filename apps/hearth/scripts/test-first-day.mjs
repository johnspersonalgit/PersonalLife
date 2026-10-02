import { choosePrompt, shouldRewriteFirstDay } from "../src/lib/pick-prompt.ts";

let failures = 0;
function check(name, actual, expected) {
  if (actual === expected) console.log(`ok   ${name}`);
  else {
    failures += 1;
    console.log(`FAIL ${name}: expected ${expected}, got ${actual}`);
  }
}

const pool = [
  { id: 1, kind: "rapid" },
  { id: 2, kind: "guess" },
  { id: 3, kind: "question" },
  { id: 4, kind: "mission" },
  { id: 5, kind: "question" },
];

const kinds = [1, 2, 3, 4, 5, 6, 7].map(
  (id) => choosePrompt(pool, [], id, "2026-10-02").kind,
);
check(
  "unfiltered pool still includes non-questions",
  kinds.some((k) => k !== "question"),
  true,
);
check(
  "preferred first day is a question",
  choosePrompt(pool, [], 1, "2026-10-02", "question").kind,
  "question",
);

check(
  "rewrite unanswered first rapid",
  shouldRewriteFirstDay({
    coupleDayCount: 1,
    answered: 0,
    guessed: 0,
    kind: "rapid",
  }),
  true,
);
check(
  "do not rewrite after an answer",
  shouldRewriteFirstDay({
    coupleDayCount: 1,
    answered: 1,
    guessed: 0,
    kind: "rapid",
  }),
  false,
);
check(
  "do not rewrite later days",
  shouldRewriteFirstDay({
    coupleDayCount: 2,
    answered: 0,
    guessed: 0,
    kind: "guess",
  }),
  false,
);

process.exit(failures ? 1 : 0);
