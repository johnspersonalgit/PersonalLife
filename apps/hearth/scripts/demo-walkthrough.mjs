import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.HEARTH_URL ?? "http://localhost:3000";
const OUT = process.env.HEARTH_SHOTS ?? "/opt/cursor/artifacts";
const VIDEO_DIR = "/tmp/hearth-video";

fs.mkdirSync(OUT, { recursive: true });
fs.rmSync(VIDEO_DIR, { recursive: true, force: true });
fs.mkdirSync(VIDEO_DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  recordVideo: { dir: VIDEO_DIR, size: { width: 390, height: 844 } },
});
const page = await context.newPage();

const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });
const settle = (ms = 1200) => page.waitForTimeout(ms);

async function tap(locator) {
  const el = await locator.elementHandle();
  if (!el) throw new Error(`tap: missing ${locator}`);
  await el.evaluate((node) => node.click());
}

async function tapNav(label) {
  await tap(page.locator('nav[aria-label="Primary"]').getByText(label, { exact: true }));
}

function startLink() {
  return page.getByRole("link", { name: /^(START|DEEPER|CHEST)$/ });
}

async function walkQuestionLesson(sentence) {
  await tap(page.getByRole("button", { name: "Continue" }));
  await page.waitForSelector("text=How are you arriving");
  await tap(page.getByRole("button", { name: /Good/ }));
  await tap(page.getByRole("button", { name: "Continue" }));
  await page.waitForSelector("text=Which is closer");
  await tap(page.locator("[data-lesson-choice]").first());
  await page.waitForSelector("text=One word for today");
  await tap(page.locator("[data-lesson-chip]").first());
  await page.waitForSelector("text=One short sentence");
  await page.locator("textarea").fill(sentence);
  await tap(page.getByRole("button", { name: "Seal my answer" }));
}

async function step(name, fn) {
  try {
    await fn();
    console.log(`ok   ${name}`);
  } catch (err) {
    console.log(`FAIL ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

await step("01 welcome", async () => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector("text=Two people. One tiny daily quest.");
  await settle();
  await shot("hearth-01-welcome");
});

await step("02 seat picker", async () => {
  await tap(page.getByRole("button", { name: "I have a code" }));
  await page.getByPlaceholder("CODE").fill("HEARTH");
  await tap(page.getByRole("button", { name: "Continue" }));
  await page.waitForSelector("text=Reconnect this device");
  await settle();
  await shot("hearth-02-seat-picker");
});

await step("02b wrong PIN rejected", async () => {
  await tap(page.getByRole("button", { name: /John/ }));
  await page.getByLabel("Your PIN").fill("9999");
  await tap(page.getByRole("button", { name: "Reconnect" }));
  await page.waitForSelector("text=Wrong PIN for that seat.");
});

await step("03 home as John", async () => {
  await page.getByLabel("Your PIN").fill("1111");
  await tap(page.getByRole("button", { name: "Reconnect" }));
  await page.waitForSelector("[data-start-card]");
  await page.waitForSelector("text=Yours unlocks it.");
  await page.waitForSelector("text=START");
  await settle();
  await shot("hearth-03-home-john");
});

await step("04 answer form", async () => {
  await tap(startLink());
  await page.waitForSelector("text=Today's quest");
  await settle();
  await shot("hearth-04-answer-form");
});

await step("05 celebration", async () => {
  await walkQuestionLesson(
    "Long day but a good one. Your note this morning carried the 3pm meeting. Porch photos looked perfect.",
  );
  await page.waitForURL("**/celebration**");
  await settle(2600);
  await shot("hearth-05-celebration");
});

await step("06 home revealed", async () => {
  await tap(page.getByRole("link", { name: /Keep going|Continue/ }));
  await page.waitForSelector("[data-start-card]");
  await page.waitForSelector('[data-start-label="DEEPER"]');
  await settle();
  await shot("hearth-06-home-revealed");
});

await step("06b keep going", async () => {
  await tap(startLink());
  await page.waitForSelector("text=Same thread");
  await page.waitForSelector("[data-lesson-prompt]");
  await page.waitForSelector("[data-from-prompt]");
  const extraPrompt = (
    await page.locator("[data-lesson-prompt]").innerText()
  ).trim();
  fs.writeFileSync(`${OUT}/hearth_generated_extra.txt`, extraPrompt);
  await settle();
  await shot("hearth-06b-keep-going");
  await walkQuestionLesson("That porch light still counts. One layer deeper.");
  await page.waitForURL("**/combo**");
  await page.waitForSelector("[data-combo-page]");
  await settle(1800);
  await shot("hearth-06c-combo");
});

await step("06c next layer", async () => {
  await tap(page.getByRole("link", { name: /Go deeper|Continue|Open the chest/ }));
  await page.waitForSelector('[data-combo]');
  await page.waitForSelector('[data-start-label="DEEPER"]');
  await settle();
  await shot("hearth-06d-next-deeper");
});

await step("07 journal", async () => {
  await tapNav("Us");
  await page.waitForSelector("text=The record that writes itself");
  await settle();
  await shot("hearth-07-journal");
});

await step("07b reopen quest", async () => {
  await tap(page.locator('[data-quest-link="done"]').first());
  await page.waitForSelector("[data-quest-review]");
  await page.waitForSelector("text=Ten more minutes at the table");
  await page.locator("textarea").fill("That porch light still counts.");
  await tap(page.getByRole("button", { name: "Leave it on this quest" }));
  await page.waitForSelector("text=That porch light still counts.");
  await settle();
  await shot("hearth-07b-quest-review");
});

await step("08 notes", async () => {
  await tapNav("Us");
  await page.waitForSelector("text=Leave a line");
  await page.getByLabel("Note text").fill("Dinner Friday. I already miss it.");
  await tap(page.getByRole("button", { name: "Send" }));
  await page.waitForSelector("text=Dinner Friday. I already miss it.");
  await settle();
  await shot("hearth-08-notes");
});

await step("09 streak", async () => {
  await tapNav("Flame");
  await page.waitForSelector("text=Milestones");
  await page.waitForSelector("text=Back to the path");
  await settle();
  await shot("hearth-09-streak");
});

await step("10 settings", async () => {
  await tapNav("Path");
  await page.waitForSelector("[data-start-card]");
  await tap(page.getByLabel("Settings"));
  await page.waitForSelector("text=Ritual topics");
  await settle();
  await shot("hearth-10-settings");
});

await step("11 home as Partner", async () => {
  await tap(page.getByRole("button", { name: /Switch to Partner/ }));
  await page.waitForSelector("[data-start-card]");
  await settle();
  await shot("hearth-11-home-partner");
});

await step("12 desktop", async () => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await settle();
  await shot("hearth-12-desktop");
});

await context.close();
await browser.close();

const videos = fs.readdirSync(VIDEO_DIR).filter((f) => f.endsWith(".webm"));
if (videos.length) {
  fs.copyFileSync(`${VIDEO_DIR}/${videos[0]}`, `${OUT}/hearth-demo.webm`);
  console.log(`video saved: ${OUT}/hearth-demo.webm`);
}
