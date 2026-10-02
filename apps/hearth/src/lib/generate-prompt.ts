export const QUEST_CATEGORIES = [
  "us",
  "heard",
  "load",
  "gratitude",
  "dreams",
  "play",
] as const;

export type QuestCategory = (typeof QUEST_CATEGORIES)[number];

export type GeneratedQuest = {
  category: QuestCategory;
  text: string;
  kind: "question";
};

const BANNED =
  /\b(john|ariana|willette|smith\s*&?\s*oak|chatgpt|as an ai)\b/i;

export function openaiApiKey(): string | null {
  const primary = process.env.OPENAI_API_KEY?.trim();
  if (primary) return primary;
  const alias = process.env.OPENAI_KEY?.trim();
  return alias || null;
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function parseGeneratedQuest(
  raw: unknown,
  recentTexts: string[],
  allowedCategories: string[] = [...QUEST_CATEGORIES],
): GeneratedQuest | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as { category?: unknown; text?: unknown; kind?: unknown };
  const category = String(row.category ?? "").trim();
  const text = String(row.text ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["']|["']$/g, "");
  if (!allowedCategories.includes(category)) return null;
  if (!QUEST_CATEGORIES.includes(category as QuestCategory)) return null;
  if (row.kind && row.kind !== "question") return null;
  if (wordCount(text) < 8 || wordCount(text) > 28) return null;
  if (text.length < 24 || text.length > 160) return null;
  if (BANNED.test(text)) return null;
  if (!text.includes("?")) return null;
  const recent = new Set(recentTexts.map((t) => t.trim().toLowerCase()));
  if (recent.has(text.toLowerCase())) return null;
  return {
    category: category as QuestCategory,
    text,
    kind: "question",
  };
}

export async function generateQuestPrompt(input: {
  categories: string[];
  recentTexts: string[];
  followUpTo?: string;
}): Promise<GeneratedQuest | null> {
  const key = openaiApiKey();
  if (!key) return null;
  const allowed = input.categories.filter((c) =>
    QUEST_CATEGORIES.includes(c as QuestCategory),
  );
  const categories = allowed.length ? allowed : [...QUEST_CATEGORIES];
  const avoid = input.recentTexts.slice(0, 16).map((t) => `- ${t}`).join("\n");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.9,
        max_tokens: 80,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You write one tiny couple ritual question for Hearth. Warm, concrete, one breath. No therapy-speak, no lists, no names, no invented facts about their life. JSON only: {\"category\":\"us|heard|load|gratitude|dreams|play\",\"text\":\"...\"}",
          },
          {
            role: "user",
            content: input.followUpTo
              ? `Allowed categories: ${categories.join(", ")}.\nWrite one follow-up question to this quest, without repeating it and without guessing their answers:\n${input.followUpTo}\nDo not repeat:\n${avoid || "- (none yet)"}`
              : `Allowed categories: ${categories.join(", ")}.\nWrite one new question they can answer in a sentence.\nDo not repeat:\n${avoid || "- (none yet)"}`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return null;
    }
    return parseGeneratedQuest(parsed, input.recentTexts, categories);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
