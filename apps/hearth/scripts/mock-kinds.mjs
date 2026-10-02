import Database from "better-sqlite3";
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

// Drives the three layered activity kinds through the real UI.
// Requires the dev server running with HEARTH_DEMO=1.

const root = path.resolve(import.meta.dirname, "..");
const dbPath = path.join(root, ".data", "hearth.db");
const clockPath = path.join(root, ".data", "demo-clock");
const OUT = process.env.HEARTH_SHOTS ?? "/opt/cursor/artifacts/kinds";
const BASE = process.env.HEARTH_URL ?? "http://localhost:3000";
fs.mkdirSync(OUT, { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.exec(fs.readFileSync(path.join(root, "src", "lib", "schema.sql"), "utf8"));

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

const { hashPin } = await import("../src/lib/pin.mjs");
const coupleId = Number(
  db.prepare("INSERT INTO couples (code) VALUES (?)").run("HEARTH").lastInsertRowid,
);
const john = Number(
  db.prepare("INSERT INTO members (couple_id, name, pin_hash) VALUES (?, ?, ?)")
    .run(coupleId, "John", hashPin("1111")).lastInsertRowid,
);
const partner = Number(
  db.prepare("INSERT INTO members (couple_id, name, pin_hash) VALUES (?, ?, ?)")
    .run(coupleId, "Partner", hashPin("2222")).lastInsertRowid,
);
db.prepare("INSERT INTO streak_meta (couple_id) VALUES (?)").run(coupleId);

const browser = await chromium.launch();

async function session(memberId) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  await context.grantPermissions(["notifications"]);
  await context.addCookies([
    { name: "hearth_member", value: String(memberId), url: BASE, httpOnly: true },
  ]);
  return context.newPage();
}

const today = localDay();
const shot = (page, name) =>
  page.screenshot({ path: `${OUT}/${name}.png` });

function insertDay(date, promptText, answererId = null) {
  return Number(
    db.prepare(
      "INSERT INTO days (couple_id, day, prompt_id, answerer_id) VALUES (?, ?, ?, ?)",
    ).run(coupleId, date, promptId(promptText), answererId).lastInsertRowid,
  );
}

// --- Rapid fire ---
fs.writeFileSync(clockPath, today);
insertDay(today, "Would you rather...", null);
// ensureDay would pick by hash; force the kind by replacing prompt
db.prepare("UPDATE days SET prompt_id = ? WHERE couple_id = ? AND day = ?").run(
  db.prepare("SELECT id FROM prompts WHERE kind = 'rapid' ORDER BY id LIMIT 1").get().id,
  coupleId,
  today,
);

let page = await session(john);
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForSelector("text=Make your pick");
await page.waitForTimeout(900);
await shot(page, "rapid-01-home");
await page.getByRole("link", { name: "Make your pick" }).click();
await page.waitForSelector("text=Lock it in");
await page.waitForTimeout(700);
await shot(page, "rapid-02-pick");
await page.getByRole("button", { name: /A quiet cabin weekend/ }).click();
await page.getByRole("button", { name: "Lock it in" }).click();
await page.waitForURL("**/celebration**");
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForSelector("text=still coming");
await shot(page, "rapid-03-sealed");
db.prepare(
  "INSERT INTO answers (day_id, member_id, mood, text) SELECT id, ?, 0, ? FROM days WHERE couple_id = ? AND day = ?",
).run(partner, "A quiet cabin weekend", coupleId, today);
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForSelector("text=You match");
await page.waitForTimeout(700);
await shot(page, "rapid-04-match");
await page.context().close();

// --- Mission ---
const missionDay = shiftDay(today, 1);
fs.writeFileSync(clockPath, missionDay);
db.prepare("INSERT INTO days (couple_id, day, prompt_id) VALUES (?, ?, ?)").run(
  coupleId,
  missionDay,
  db.prepare("SELECT id FROM prompts WHERE kind = 'mission' ORDER BY id LIMIT 1").get().id,
);
page = await session(john);
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForSelector("text=Do the mission");
await page.waitForTimeout(900);
await shot(page, "mission-01-home");
await page.getByRole("link", { name: "Do the mission" }).click();
await page.waitForSelector("text=Your proof or thought");
await page.locator("textarea").fill("The porch photo from Tuesday. The light was perfect.");
await page.waitForTimeout(400);
await shot(page, "mission-02-form");
await page.getByRole("button", { name: "Done" }).click();
await page.waitForURL("**/celebration**");
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(700);
await shot(page, "mission-03-half");
db.prepare(
  "INSERT INTO answers (day_id, member_id, mood, text) SELECT id, ?, 0, ? FROM days WHERE couple_id = ? AND day = ?",
).run(partner, "Same photo. Great minds.", coupleId, missionDay);
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForSelector("text=Mission complete");
await page.waitForTimeout(700);
await shot(page, "mission-04-complete");
await page.context().close();

// --- Guess day ---
const guessDay = shiftDay(today, 2);
fs.writeFileSync(clockPath, guessDay);
insertDay(guessDay, "Where would I teleport us for dinner tonight?", john);

page = await session(john);
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForSelector("text=Today starts with you");
await page.waitForTimeout(900);
await shot(page, "guess-01-home-answerer");
await page.getByRole("link", { name: "Answer first" }).click();
await page.waitForSelector("text=Your real answer");
await page.locator("textarea").fill("That little Italian place with the candle wax on the bottles.");
await page.waitForTimeout(400);
await shot(page, "guess-02-answer");
await page.getByRole("button", { name: "Seal my answer" }).click();
await page.waitForURL("**/celebration**");
await page.context().close();

page = await session(partner);
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForSelector("text=What did they say");
await page.waitForTimeout(900);
await shot(page, "guess-03-home-guesser");
await page.getByRole("link", { name: "Make your guess" }).click();
await page.waitForSelector("text=What did John say?");
await page.locator("textarea").fill("The Italian place with the candles. Easy.");
await page.waitForTimeout(400);
await shot(page, "guess-04-guess");
await page.getByRole("button", { name: "Seal my guess" }).click();
await page.waitForURL("**/celebration**");
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForSelector("text=guessed");
await page.waitForTimeout(700);
await shot(page, "guess-05-revealed");
await page.context().close();

await browser.close();
console.log("kinds mock complete:", OUT);
