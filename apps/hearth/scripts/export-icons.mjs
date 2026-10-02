import { chromium } from "playwright";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const svgPath = path.join(root, "public", "icon.svg");

const browser = await chromium.launch();
for (const size of [192, 512]) {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  await page.goto(`file://${svgPath}`);
  const el = page.locator("svg");
  await el.screenshot({
    path: path.join(root, "public", `icon-${size}.png`),
    omitBackground: false,
  });
  await page.close();
  console.log(`icon-${size}.png`);
}
await browser.close();
