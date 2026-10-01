import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import prompts from "./prompts.json";

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

const promptCount = db
  .prepare("SELECT COUNT(*) AS n FROM prompts")
  .get() as { n: number };
if (promptCount.n === 0) {
  const insert = db.prepare(
    "INSERT INTO prompts (category, text) VALUES (?, ?)",
  );
  const seedAll = db.transaction(() => {
    for (const p of prompts) insert.run(p.category, p.text);
  });
  seedAll();
}

export default db;
