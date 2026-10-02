import { parseGeneratedQuest, wordCount } from "../src/lib/generate-prompt.ts";

let failures = 0;
function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) console.log(`ok   ${name}`);
  else {
    failures += 1;
    console.log(`FAIL ${name}: expected ${e}, got ${a}`);
  }
}

const good = parseGeneratedQuest(
  {
    category: "heard",
    text: "What is one thing you need me to hear before we sleep?",
  },
  [],
);
check("accepts a short couple question", good?.text.includes("hear"), true);
check("forces question kind", good?.kind, "question");

check(
  "rejects a name",
  parseGeneratedQuest(
    {
      category: "us",
      text: "John, what did Ariana do this week that you loved?",
    },
    [],
  ),
  null,
);

check(
  "rejects a recycled line",
  parseGeneratedQuest(
    {
      category: "us",
      text: "What do you wish we had ten more minutes for?",
    },
    ["What do you wish we had ten more minutes for?"],
  ),
  null,
);

check(
  "rejects a bad category",
  parseGeneratedQuest(
    {
      category: "therapy",
      text: "What is one thing you need me to hear before we sleep?",
    },
    [],
  ),
  null,
);

check(
  "rejects a short fragment",
  parseGeneratedQuest({ category: "play", text: "Thoughts?" }, []),
  null,
);

check("word count helper", wordCount("one two three"), 3);

if (process.env.OPENAI_API_KEY || process.env.OPENAI_KEY) {
  const { generateQuestPrompt } = await import("../src/lib/generate-prompt.ts");
  const live = await generateQuestPrompt({
    categories: ["us", "play"],
    recentTexts: ["What do you wish we had ten more minutes for?"],
  });
  check("live generate returns a question", Boolean(live?.text.includes("?")), true);
  check("live generate stays in bounds", live ? wordCount(live.text) >= 8 : false, true);
  if (live) console.log(`live_category ${live.category}`);
} else {
  console.log("skip live generate, no OpenAI key in env");
}

process.exit(failures ? 1 : 0);
