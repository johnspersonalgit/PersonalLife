import type { PromptKind } from "./streak";

export type PromptPick = { id: number; kind: PromptKind };

export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function choosePrompt(
  all: PromptPick[],
  recentIds: number[],
  coupleId: number,
  day: string,
  preferKind?: PromptKind,
): PromptPick {
  const recent = new Set(recentIds);
  const pool = all.filter((p) => !recent.has(p.id));
  let source = pool.length ? pool : all;
  if (preferKind) {
    const preferred = source.filter((p) => p.kind === preferKind);
    if (preferred.length) source = preferred;
  }
  return source[hashString(`${coupleId}:${day}`) % source.length];
}

export function shouldRewriteFirstDay(input: {
  coupleDayCount: number;
  answered: number;
  guessed: number;
  kind: PromptKind;
}): boolean {
  return (
    input.coupleDayCount === 1 &&
    input.answered === 0 &&
    input.guessed === 0 &&
    input.kind !== "question"
  );
}
