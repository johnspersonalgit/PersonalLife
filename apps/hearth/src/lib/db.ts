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
