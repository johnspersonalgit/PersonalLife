import Database from "better-sqlite3";
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

// Two-week demo simulator. Requires the dev server running with HEARTH_DEMO=1.
// Writes .data/demo-clock per simulated day, inserts real rows, and captures
// the real UI as John each day. Synthetic content only.

const root = path.resolve(import.meta.dirname, "..");
const dbPath = path.join(root, ".data", "hearth.db");
const clockPath = path.join(root, ".data", "demo-clock");
const OUT = process.env.HEARTH_SHOTS ?? "/opt/cursor/artifacts/mock";
const BASE = process.env.HEARTH_URL ?? "http://localhost:3000";
fs.mkdirSync(OUT, { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.exec(fs.readFileSync(path.join(root, "src", "lib", "schema.sql"), "utf8"));
const memberCols = db.prepare("PRAGMA table_info(members)").all();
if (!memberCols.some((c) => c.name === "avatar")) {
  db.exec("ALTER TABLE members ADD COLUMN avatar TEXT");
}
if (!memberCols.some((c) => c.name === "color")) {
  db.exec("ALTER TABLE members ADD COLUMN color TEXT");
}

const promptId = (text) =>
  db.prepare("SELECT id FROM prompts WHERE text = ?").get(text).id;

function localDay(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function shiftDay(day, delta) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return localDay(d);
}

const DAYS = [
  {
    prompt: "What is one thing you have been meaning to tell me but the day kept interrupting?",
    john: [4, "The porch quote is booked for Saturday. I wanted to tell you in person, not in a text between meetings."],
    partner: [4, "I noticed you checked in at night all week. It matters more than you think."],
  },
  {
    prompt: "If our life this week had a title, what would it be?",
    john: [4, "The Spreadsheet and the Sunset. Too many tabs open, but we caught the good light twice."],
    partner: [5, "Controlled Chaos: A Love Story. Featuring one missing shoe, always."],
    note: ["partner", "Shoe found. It was in the car. Obviously."],
  },
  {
    prompt: "Name one ordinary thing today that you are quietly grateful for.",
    john: [4, "The coffee you leave measured out the night before. Tiny thing. Lands every time."],
    partner: [3, "The dryer buzzed and someone had already folded it. Oh wait, that was me. Grateful for past me."],
  },
  {
    prompt: "What is one thing you carried this week that I did not see?",
    john: [3, "The renewal paperwork. Three calls, all on hold. I did not want it on your plate too."],
    partner: [3, "The school form, the dentist reschedule, the gift for Saturday's party. None of it is hard. All of it is mine by default."],
  },
  {
    prompt: "What do you need me to hear today, in one sentence?",
    john: [3, "When I go quiet at dinner it is the day, not you."],
    partner: [4, "When I say I am tired, I mean the kind sleep does not fix. Just hear it."],
    note: ["john", "Read it twice. You are heard. More tonight at 9."],
  },
  {
    prompt: "If we had one completely free weekend next month, how would you want to spend it?",
    john: [5, "Porch coffee, nowhere to be before noon, and one dinner we did not cook."],
    partner: [5, "That exact weekend. Add a bookstore and I am in."],
  },
  {
    prompt: "When did you feel closest to me recently?",
    john: [5, "Tuesday in the kitchen, laughing at the dog. Nothing happened. That was everything."],
    partner: [4, "When you texted a photo of my coffee order from the drive-through line. Seen."],
  },
  {
    prompt: "What song should be playing the next time I walk through the door?",
    john: [4, "Something with horns. Friday energy on a Thursday."],
    partner: [4, "The playlist from the August road trip. Windows down."],
    note: ["partner", "Horns acquired. Do not be late."],
  },
  {
    prompt: "Describe an ordinary Tuesday five years from now that would make you happy.",
    john: [5, "Porch done, dinner on it, you reading while I pretend to tend the grill. Nobody anywhere on time."],
    partner: [5, "Same porch. Homework done without a chase, and us not talking about logistics even once."],
  },
  {
    prompt: "What would make this weekend feel restful instead of packed?",
    john: [3, "One thing, not five. The porch quote Saturday, then we guard Sunday."],
    partner: [3, "Agreed. And if the grocery run just happened without a discussion, I would weep with joy."],
  },
  {
    prompt: "What did I do this week that made you feel considered?",
    john: [4, "You moved the Tuesday call so I could do pickup. You did not announce it. I noticed."],
    partner: [4, "You read my long note and answered every line. Every line. Keep that."],
    note: ["john", "Groceries ordered for pickup tomorrow. No discussion needed."],
  },
  {
    prompt: "What is a quality of mine you counted on this week?",
    john: [4, "Your memory for the small stuff. The permission slip existed because of you."],
    partner: [4, "Your calm when the sink leaked. You just handled it."],
  },
  {
    prompt: "What do you wish we had ten more minutes for?",
    john: [4, "The table, after dinner, phones in the other room. Like August."],
    partner: [5, "Slow mornings. Ten minutes of nobody needing anything."],
    nudge: "partner",
    note: ["partner", "August was good. More August."],
  },
  {
    prompt: "What is one tradition you would love us to start?",
    john: [5, "First Friday of every month, we do not cook. Standing rule."],
    partner: [5, "Sunday evening walk, fifteen minutes, no agenda. Starting this week."],
  },
];

const MILESTONES = [3, 7, 14, 30, 60, 100];

const coupleId = Number(
  db.prepare("INSERT INTO couples (code) VALUES (?)").run("HEARTH").lastInsertRowid,
);
const { hashPin } = await import("../src/lib/pin.mjs");
const john = Number(
  db.prepare(
    "INSERT INTO members (couple_id, name, pin_hash, avatar, color) VALUES (?, ?, ?, ?, ?)",
  )
    .run(coupleId, "John", hashPin("1111"), "bear", "blue").lastInsertRowid,
);
const partner = Number(
  db.prepare(
    "INSERT INTO members (couple_id, name, pin_hash, avatar, color) VALUES (?, ?, ?, ?, ?)",
  )
    .run(coupleId, "Partner", hashPin("2222"), "rabbit", "rose").lastInsertRowid,
);
db.prepare("INSERT INTO streak_meta (couple_id, best, celebrated) VALUES (?, 0, '[]')").run(coupleId);

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
await context.grantPermissions(["notifications"]);
await context.addCookies([
  { name: "hearth_member", value: String(john), url: BASE, httpOnly: true },
]);
const page = await context.newPage();

const today = localDay();
const celebrated = [];

for (let i = 0; i < DAYS.length; i++) {
  const dayNum = i + 1;
  const date = shiftDay(today, -(DAYS.length - 1 - i));
  const d = DAYS[i];

  fs.writeFileSync(clockPath, date);

  const dayId = Number(
    db.prepare("INSERT INTO days (couple_id, day, prompt_id) VALUES (?, ?, ?)")
      .run(coupleId, date, promptId(d.prompt)).lastInsertRowid,
  );
  db.prepare("INSERT INTO answers (day_id, member_id, mood, text, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(dayId, partner, d.partner[0], d.partner[1], `${date} 08:4${i % 10}:00`);
  db.prepare("INSERT INTO answers (day_id, member_id, mood, text, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(dayId, john, d.john[0], d.john[1], `${date} 21:0${i % 10}:00`);

  if (d.note) {
    const who = d.note[0] === "john" ? john : partner;
    db.prepare("INSERT INTO notes (couple_id, member_id, text, created_at) VALUES (?, ?, ?, ?)")
      .run(coupleId, who, d.note[1], `${date} 22:15:00`);
  }
  if (d.nudge) {
    const who = d.nudge === "john" ? john : partner;
    db.prepare("INSERT INTO nudges (couple_id, member_id, created_at) VALUES (?, ?, ?)")
      .run(coupleId, who, `${date} 09:05:00`);
  }

  for (const m of MILESTONES) {
    if (dayNum === m && !celebrated.includes(m)) celebrated.push(m);
  }
  db.prepare("UPDATE streak_meta SET best = ?, celebrated = ? WHERE couple_id = ?")
    .run(dayNum, JSON.stringify(celebrated), coupleId);

  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForSelector(`text=${d.prompt.slice(0, 30)}`);
  await page.waitForTimeout(1100);
  await page.screenshot({ path: `${OUT}/day-${String(dayNum).padStart(2, "0")}-home.png` });
  console.log(`day ${dayNum} (${date}) captured, streak ${dayNum}`);

  if (dayNum === 7 || dayNum === 14) {
    await page.goto(`${BASE}/celebration?s=${dayNum}&m=${dayNum}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2600);
    await page.screenshot({ path: `${OUT}/day-${String(dayNum).padStart(2, "0")}-celebration.png` });
    console.log(`day ${dayNum} milestone celebration captured`);
  }
}

await page.goto(BASE + "/journal", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/day-14-journal-full.png`, fullPage: true });

await page.goto(BASE + "/streak", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/day-14-streak.png` });

await page.goto(BASE + "/notes", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/day-14-notes.png` });

await browser.close();
console.log("two-week mock complete:", OUT);
