import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { hashPin } from "../src/lib/pin.mjs";

const root = path.resolve(import.meta.dirname, "..");
const dbPath = process.env.HEARTH_DB ?? path.join(root, ".data", "hearth.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(fs.readFileSync(path.join(root, "src", "lib", "schema.sql"), "utf8"));

const memberCols = db.prepare("PRAGMA table_info(members)").all();
if (!memberCols.some((c) => c.name === "avatar")) {
  db.exec("ALTER TABLE members ADD COLUMN avatar TEXT");
}
if (!memberCols.some((c) => c.name === "color")) {
  db.exec("ALTER TABLE members ADD COLUMN color TEXT");
}

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

const promptId = (text) =>
  db.prepare("SELECT id FROM prompts WHERE text = ?").get(text).id;

const seed = db.transaction(() => {
  const coupleId = Number(
    db.prepare("INSERT INTO couples (code) VALUES (?)").run("HEARTH")
      .lastInsertRowid,
  );
  const john = Number(
    db
      .prepare(
        "INSERT INTO members (couple_id, name, pin_hash, avatar, color) VALUES (?, ?, ?, ?, ?)",
      )
      .run(coupleId, "John", hashPin("1111"), "bear", "blue").lastInsertRowid,
  );
  const partner = Number(
    db
      .prepare(
        "INSERT INTO members (couple_id, name, pin_hash, avatar, color) VALUES (?, ?, ?, ?, ?)",
      )
      .run(coupleId, "Partner", hashPin("2222"), "rabbit", "rose")
      .lastInsertRowid,
  );
  db.prepare(
    "INSERT INTO streak_meta (couple_id, best, celebrated) VALUES (?, ?, ?)",
  ).run(coupleId, 5, JSON.stringify([3]));

  const history = [
    {
      offset: -6,
      prompt: "What moment with me this week would you relive if you could?",
      john: [4, "Honestly, dinner Tuesday. Twenty minutes at the table beats a week of texts."],
      partner: [4, "Watching you read to the kids last night. The house felt completely settled for once."],
    },
    {
      offset: -5,
      prompt: "What is one thing you carried this week that I did not see?",
      john: [3, "The loan renewal call. Forty minutes on hold. I did not want to bring it home."],
      partner: [3, "The appointment forms, the shoe sizes, the birthday gift for Saturday. Small stuff that is never actually small."],
    },
    {
      offset: -4,
      prompt: "If we had one completely free weekend next month, how would you want to spend it?",
      john: [4, "That. Plus finally pricing the porch project so it stops being a someday."],
      partner: [5, "Porch coffee, no plans before noon, and one dinner we did not cook."],
    },
    {
      offset: -2,
      prompt: "Name one ordinary thing today that you are quietly grateful for.",
      john: [5, "Coffee on the deck before anyone woke up. Quiet house."],
      partner: [4, "A slow morning. I sat with my coffee and did absolutely nothing productive."],
    },
    {
      offset: -1,
      prompt: "What would make this weekend feel restful instead of packed?",
      john: [4, "Back to back meetings all week, but I snagged us a reservation for Friday. No logistics, just us."],
      partner: [4, "Friday dinner out, already booked by you. That is the whole wish."],
    },
  ];

  const today = localDay();
  for (const h of history) {
    const day = shiftDay(today, h.offset);
    const dayId = Number(
      db
        .prepare("INSERT INTO days (couple_id, day, prompt_id) VALUES (?, ?, ?)")
        .run(coupleId, day, promptId(h.prompt)).lastInsertRowid,
    );
    const stamp = `${day} 21:10:00`;
    db.prepare(
      "INSERT INTO answers (day_id, member_id, mood, text, created_at) VALUES (?, ?, ?, ?, ?)",
    ).run(dayId, john, h.john[0], h.john[1], stamp);
    db.prepare(
      "INSERT INTO answers (day_id, member_id, mood, text, created_at) VALUES (?, ?, ?, ?, ?)",
    ).run(dayId, partner, h.partner[0], h.partner[1], stamp);
  }

  const todayId = Number(
    db
      .prepare("INSERT INTO days (couple_id, day, prompt_id) VALUES (?, ?, ?)")
      .run(coupleId, today, promptId("What do you wish we had ten more minutes for?")).lastInsertRowid,
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
