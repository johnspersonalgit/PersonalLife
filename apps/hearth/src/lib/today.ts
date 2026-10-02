import fs from "node:fs";
import path from "node:path";
import { localDay as realLocalDay } from "./time";

// Demo simulator hook: when HEARTH_DEMO=1, the date in .data/demo-clock
// overrides today. Server-only (reads the filesystem). Never set in
// production; the file is gitignored.
export function localDay(d: Date = new Date()): string {
  if (process.env.HEARTH_DEMO === "1") {
    try {
      const v = fs
        .readFileSync(path.join(process.cwd(), ".data", "demo-clock"), "utf8")
        .trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    } catch {
      // no clock file, fall through to the real date
    }
  }
  return realLocalDay(d);
}
