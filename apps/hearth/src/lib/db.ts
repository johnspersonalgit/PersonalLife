import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import promptsRaw from "./prompts.json";

type PromptSeed = {
  category: string;
  text: string;
  kind?: string;
  options?: string[];
};
const prompts = promptsRaw as PromptSeed[];

const dbPath =
  process.env.HEARTH_DB ?? path.join(process.cwd(), ".data", "hearth.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const schema = fs.readFileSync(
  path.join(process.cwd(), "src", "lib", "schema.sql"),
  "utf8",
);
db.exec(schema);

const memberCols = db.prepare("PRAGMA table_info(members)").all() as {
  name: string;
}[];
if (!memberCols.some((c) => c.name === "pin_hash")) {
  db.exec("ALTER TABLE members ADD COLUMN pin_hash TEXT");
}
if (!memberCols.some((c) => c.name === "avatar")) {
  db.exec("ALTER TABLE members ADD COLUMN avatar TEXT");
}
if (!memberCols.some((c) => c.name === "color")) {
  db.exec("ALTER TABLE members ADD COLUMN color TEXT");
}

const uncolored = db
  .prepare(
    "SELECT id, couple_id FROM members WHERE color IS NULL OR color = '' ORDER BY id",
  )
  .all() as { id: number; couple_id: number }[];
if (uncolored.length) {
  const seen = new Map<number, number>();
  const paint = db.prepare("UPDATE members SET color = ? WHERE id = ?");
  for (const row of uncolored) {
    const nth = seen.get(row.couple_id) ?? 0;
    paint.run(nth === 0 ? "blue" : "rose", row.id);
    seen.set(row.couple_id, nth + 1);
  }
}

const unavatar = db
  .prepare(
    "SELECT id, color FROM members WHERE avatar IS NULL OR avatar = ''",
  )
  .all() as { id: number; color: string | null }[];
if (unavatar.length) {
  const paint = db.prepare("UPDATE members SET avatar = ? WHERE id = ?");
  for (const row of unavatar) {
    paint.run(row.color === "rose" ? "rabbit" : "bear", row.id);
  }
}

const promptCols = db.prepare("PRAGMA table_info(prompts)").all() as {
  name: string;
}[];
if (!promptCols.some((c) => c.name === "kind")) {
  db.exec("ALTER TABLE prompts ADD COLUMN kind TEXT NOT NULL DEFAULT 'question'");
  db.exec("ALTER TABLE prompts ADD COLUMN options TEXT");
}
const dayCols = db.prepare("PRAGMA table_info(days)").all() as {
  name: string;
}[];
if (!dayCols.some((c) => c.name === "answerer_id")) {
  db.exec("ALTER TABLE days ADD COLUMN answerer_id INTEGER REFERENCES members(id)");
}
if (!dayCols.some((c) => c.name === "parent_id")) {
  db.exec("ALTER TABLE days ADD COLUMN parent_id INTEGER REFERENCES days(id)");
}
if (!dayCols.some((c) => c.name === "depth")) {
  db.exec("ALTER TABLE days ADD COLUMN depth INTEGER NOT NULL DEFAULT 0");
}

const insertPrompt = db.prepare(
  `INSERT INTO prompts (category, text, kind, options)
   SELECT ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM prompts WHERE text = ?)`,
);
const seedPrompts = db.transaction(() => {
  for (const p of prompts) {
    insertPrompt.run(
      p.category,
      p.text,
      p.kind ?? "question",
      "options" in p && p.options ? JSON.stringify(p.options) : null,
      p.text,
    );
  }
});
seedPrompts();

export default db;
