export type StartLabel = "START" | "DEEPER";

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
  return depth > 0 ? "DEEPER" : "START";
}

export function comboTitle(combo: number, _depth: number): string {
  return combo >= 3 ? "Still going" : "Done";
}

export function comboBody(_combo: number, _depth: number): string {
  return "Another one is ready if you want it.";
}