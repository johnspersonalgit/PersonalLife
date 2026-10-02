export const LESSON_CLOSER: Record<string, [string, string]> = {
  us: ["A small moment we already had", "A moment I still want"],
  heard: ["Something I said", "Something I needed back"],
  load: ["Something I carried", "Something I want handed off"],
  gratitude: ["Something ordinary", "Something I almost missed"],
  dreams: ["Something soon", "Something someday"],
  play: ["The funny version", "The true version"],
};

export const LESSON_SPARK: Record<string, string[]> = {
  us: ["Closer", "Missed you", "Proud", "Tender"],
  heard: ["Landed", "Missed", "Softer", "Clearer"],
  load: ["Heavy", "Shared", "Lighter", "Later"],
  gratitude: ["Warm", "Quiet", "Lucky", "Home"],
  dreams: ["Soon", "Wild", "Simple", "Together"],
  play: ["Silly", "True", "Weird", "Ours"],
};

export const RAPID_WHY = ["Gut", "Us", "Tonight"] as const;
export const MISSION_WHEN = ["Now", "Before bed", "This weekend"] as const;
export const GUESS_SURE = ["Gut", "History", "Wild guess"] as const;

export function closerFor(category: string): [string, string] {
  return LESSON_CLOSER[category] ?? LESSON_CLOSER.us;
}

export function sparkFor(category: string): string[] {
  return LESSON_SPARK[category] ?? LESSON_SPARK.us;
}
