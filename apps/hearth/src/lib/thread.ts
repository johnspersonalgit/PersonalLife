export type StartLabel = "START" | "DEEPER" | "CHEST";

export function nextDepth(parentDepth: number | null | undefined): number {
  return (parentDepth ?? -1) + 1;
}

export function isChestDepth(depth: number): boolean {
  return depth > 0 && depth % 3 === 0;
}

export function pathUnit(combo: number): number {
  return Math.max(1, Math.floor(combo / 4) + 1);
}

export function pathSection(combo: number): number {
  return Math.max(1, Math.floor((combo - 1) / 20) + 1);
}

export function startLabel(depth: number): StartLabel {
  if (isChestDepth(depth)) return "CHEST";
  if (depth > 0) return "DEEPER";
  return "START";
}

export function comboTitle(combo: number, depth: number): string {
  if (isChestDepth(depth)) return "Chest unlocked";
  if (combo >= 5) return "On a tear";
  if (combo >= 3) return "Combo";
  return "Keep going";
}

export function comboBody(combo: number, depth: number): string {
  if (isChestDepth(depth)) {
    return "The thread just opened a chest. The next node grew out of this one.";
  }
  if (depth > 0) {
    return "Same thread. Tighter cut. Seal the next one to go another layer down.";
  }
  return combo === 1
    ? "The path stays open as long as you do."
    : "Another node is already waiting.";
}
