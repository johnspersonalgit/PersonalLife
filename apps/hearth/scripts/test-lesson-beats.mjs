import { closerFor, sparkFor } from "../src/lib/lesson-beats.ts";

let failures = 0;
function check(name, actual, expected) {
  const ok = Array.isArray(expected)
    ? JSON.stringify(actual) === JSON.stringify(expected)
    : actual === expected;
  if (ok) console.log(`ok   ${name}`);
  else {
    failures += 1;
    console.log(`FAIL ${name}: expected ${expected}, got ${actual}`);
  }
}

check("us closer has two taps", closerFor("us").length, 2);
check("unknown category falls back", closerFor("nope")[0], closerFor("us")[0]);
check("spark is four easy words", sparkFor("play").length, 4);
check("every mapped spark is short", sparkFor("load").every((w) => w.length <= 10), true);

if (failures) process.exit(1);
console.log("lesson beats ok");
