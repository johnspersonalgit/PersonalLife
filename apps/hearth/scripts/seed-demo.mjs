import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dbPath = process.env.HEARTH_DB ?? path.join(root, ".data", "hearth.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(fs.readFileSync(path.join(root, "src", "lib", "schema.sql"), "utf8"));

const prompts = JSON.parse(
  fs.readFileSync(path.join(root, "src", "lib", "prompts.json"), "utf8"),
);
const insertPrompt = db.prepare(
  "INSERT INTO prompts (category, text) VALUES (?, ?)",
);
if (db.prepare("SELECT COUNT(*) AS n FROM prompts").get().n === 0) {
  for (const p of prompts) insertPrompt.run(p.category, p.text);
}

const existing = db
  .prepare("SELECT id FROM couples WHERE code = ?")
  .get("HEARTH");
if (existing) {
  console.log("Demo couple already exists. No changes made.");
  process.exit(0);
}

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

const promptIds = db
  .prepare("SELECT id FROM prompts ORDER BY id")
  .all()
  .map((r) => r.id);

const seed = db.transaction(() => {
  const coupleId = Number(
    db.prepare("INSERT INTO couples (code) VALUES (?)").run("HEARTH")
      .lastInsertRowid,
  );
  const john = Number(
    db
      .prepare("INSERT INTO members (couple_id, name) VALUES (?, ?)")
      .run(coupleId, "John").lastInsertRowid,
  );
  const partner = Number(
    db
      .prepare("INSERT INTO members (couple_id, name) VALUES (?, ?)")
      .run(coupleId, "Partner").lastInsertRowid,
  );
  db.prepare(
    "INSERT INTO streak_meta (couple_id, best, celebrated) VALUES (?, ?, ?)",
  ).run(coupleId, 5, JSON.stringify([3]));

  const johnAnswers = [
    [4, "Honestly the best part was dinner Tuesday. Even twenty minutes at the table beats a week of texts."],
    [3, "Long day. The call ran over and I missed sunset. Grateful you handled pickup without being asked."],
    [4, "I keep thinking about that porch idea. Let's actually price it out this weekend."],
    [5, "Woke up before the alarm and just felt good. Coffee on the deck, you still asleep, quiet house."],
    [3, "Back to back meetings. I did snag us a reservation for Friday though. No logistics, just us."],
  ];
  const partnerAnswers = [
    [4, "Watching you read to the kids last night. The house felt completely settled for once."],
    [3, "Tired but okay. The garden finally got weeded, which felt like winning a small war."],
    [5, "Yes to the porch. I found three photos of exactly what I mean. Remind me to show you."],
    [4, "A slow morning for once. I sat with coffee and did absolutely nothing productive."],
    [4, "Friday sounds perfect. I already know what I'm wearing."],
  ];

  const today = localDay();
  const gapDay = shiftDay(today, -3);
  let cursor = 0;
  for (let i = 6; i >= 1; i--) {
    const day = shiftDay(today, -i);
    if (day === gapDay) continue;
    const promptId = promptIds[(i * 5) % promptIds.length];
    const dayId = Number(
      db
        .prepare("INSERT INTO days (couple_id, day, prompt_id) VALUES (?, ?, ?)")
        .run(coupleId, day, promptId).lastInsertRowid,
    );
    const stamp = `${day} 21:1${i}:00`;
    db.prepare(
      "INSERT INTO answers (day_id, member_id, mood, text, created_at) VALUES (?, ?, ?, ?, ?)",
    ).run(dayId, john, johnAnswers[cursor][0], johnAnswers[cursor][1], stamp);
    db.prepare(
      "INSERT INTO answers (day_id, member_id, mood, text, created_at) VALUES (?, ?, ?, ?, ?)",
    ).run(dayId, partner, partnerAnswers[cursor][0], partnerAnswers[cursor][1], stamp);
    cursor += 1;
  }

  const todayId = Number(
    db
      .prepare("INSERT INTO days (couple_id, day, prompt_id) VALUES (?, ?, ?)")
      .run(coupleId, today, promptIds[2]).lastInsertRowid,
  );
  db.prepare(
    "INSERT INTO answers (day_id, member_id, mood, text, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(
    todayId,
    partner,
    4,
    "Ten more minutes at the table after dinner, phones in the other room. Just us, talking like we did in August.",
    `${today} 08:42:00`,
  );

  const notes = [
    [partner, "Saw your 6am text. You are doing too much. I love you anyway.", -2, "07:58:00"],
    [john, "Flight got moved, home by 9. Save me a plate and ten quiet minutes.", -2, "18:20:00"],
    [partner, "Plated and warming. Porch photos are on the counter.", -2, "18:41:00"],
    [john, "Today was a lot. Seeing your answer this morning carried me through the 3pm meeting.", 0, "07:12:00"],
  ];
  for (const [who, text, dayDelta, clock] of notes) {
    db.prepare(
      "INSERT INTO notes (couple_id, member_id, text, created_at) VALUES (?, ?, ?, ?)",
    ).run(coupleId, who, text, `${shiftDay(today, dayDelta)} ${clock}`);
  }

  db.prepare(
    "INSERT INTO nudges (couple_id, member_id, created_at) VALUES (?, ?, ?)",
  ).run(coupleId, partner, `${today} 09:05:00`);

  console.log(
    `Seeded demo couple HEARTH (members ${john}, ${partner}) with 5-day streak.`,
  );
});

seed();
