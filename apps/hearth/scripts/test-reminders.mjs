import { isDue, reminderCopy, minutesOf } from "../src/lib/reminders.ts";

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

check("minutesOf 20:00", minutesOf("20:00"), 1200);

check(
  "due inside window",
  isDue("20:00", new Date("2026-10-01T20:07:00")),
  true,
);
check(
  "not due before window",
  isDue("20:00", new Date("2026-10-01T19:59:00")),
  false,
);
check(
  "not due after window",
  isDue("20:00", new Date("2026-10-01T20:15:00")),
  false,
);
check("malformed time never due", isDue("evening", new Date()), false);

check(
  "partner answered copy",
  reminderCopy({ partnerAnswered: true, partnerName: "Partner", streak: 5 }),
  { title: "Hearth", body: "Partner sealed an answer. Yours unlocks it." },
);
check(
  "streak copy",
  reminderCopy({ partnerAnswered: false, partnerName: "Partner", streak: 5 }),
  { title: "Hearth", body: "Two minutes tonight keeps the 5-day streak." },
);
check(
  "no streak copy",
  reminderCopy({ partnerAnswered: false, partnerName: "Partner", streak: 0 }),
  { title: "Hearth", body: "Today's question is waiting. Two minutes, that is all." },
);

process.exit(failures ? 1 : 0);
