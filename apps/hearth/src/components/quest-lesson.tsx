"use client";

import { useState, useTransition } from "react";
import {
  submitAnswer,
  submitGuess,
  submitGuessAnswer,
  submitMission,
  submitRapid,
} from "@/lib/actions";
import type { PromptKind } from "@/lib/streak";
import { Ember } from "./ember";
import { CheckIcon } from "./icons";
import { MOODS, MoodFace } from "./mood-row";

type LessonProps = {
  kind: PromptKind;
  prompt: string;
  options: string[];
  role: "answerer" | "guesser" | "solo";
  personName: string;
};

type Step = "intro" | "act" | "write";

export function QuestLesson({
  kind,
  prompt,
  options,
  role,
  personName,
}: LessonProps) {
  const [step, setStep] = useState<Step>("intro");
  const [mood, setMood] = useState<number | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const introCopy = introFor(kind, role, personName);

  if (step === "intro") {
    return (
      <div className="flex flex-1 flex-col">
        <Ember mood="happy" size={140} />
        <p className="mt-2 text-sm font-semibold tracking-widest text-ink-soft uppercase">
          One step
        </p>
        <h1 className="mt-2 font-display text-3xl leading-snug text-ink">
          {prompt}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{introCopy}</p>
        <button
          type="button"
          className="btn btn-primary mt-auto w-full"
          onClick={() => setStep(kind === "question" ? "act" : "write")}
        >
          Continue
        </button>
      </div>
    );
  }

  if (kind === "question" && step === "act") {
    return (
      <div className="flex flex-1 flex-col">
        <p className="text-xs font-semibold tracking-widest text-ink-soft uppercase">
          How are you arriving?
        </p>
        <div className="mt-4 flex items-center justify-between">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMood(m.value)}
              aria-pressed={mood === m.value}
              className={`flex flex-col items-center gap-1.5 rounded-md px-2 py-2 ${
                mood === m.value
                  ? "text-gold-deep scale-110"
                  : "text-ink-soft"
              }`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full border ${
                  mood === m.value
                    ? "border-gold bg-gold-soft/50"
                    : "border-line bg-card"
                }`}
              >
                <MoodFace value={m.value} size={26} />
              </span>
              <span className="text-[10px] font-semibold tracking-widest uppercase">
                {m.label}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary mt-auto w-full"
          disabled={!mood}
          onClick={() => setStep("write")}
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-1 flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          try {
            await submitLesson({
              kind,
              role,
              mood,
              choice,
              text,
              options,
            });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Try that again.");
          }
        });
      }}
    >
      {kind === "rapid" ? (
        <div className="flex flex-col gap-3">
          {options.map((opt) => {
            const on = choice === opt;
            return (
              <button
                key={opt}
                type="button"
                aria-pressed={on}
                onClick={() => setChoice(opt)}
                className={`card flex items-center justify-between px-5 py-5 text-left ${
                  on ? "border-gold bg-gold-soft/25" : ""
                }`}
              >
                <span className="font-display text-lg text-ink">{opt}</span>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                    on
                      ? "border-gold bg-gold text-card"
                      : "border-line text-transparent"
                  }`}
                >
                  <CheckIcon size={13} />
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold tracking-widest text-ink-soft uppercase">
            {writeLabel(kind, role, personName)}
          </span>
          <textarea
            className="input min-h-32 resize-y"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={writePlaceholder(kind, role)}
            maxLength={2000}
          />
        </label>
      )}

      {error ? (
        <p role="alert" className="text-sm font-medium text-crit">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="btn btn-primary mt-auto w-full"
        disabled={pending || (kind === "rapid" && !choice)}
      >
        {pending ? "Sealing..." : sealLabel(kind, role)}
      </button>
    </form>
  );
}

function introFor(
  kind: PromptKind,
  role: LessonProps["role"],
  personName: string,
): string {
  switch (kind) {
    case "question":
      return "Pick a face, write a few words, tap Seal. That is the whole quest.";
    case "rapid":
      return "Two cards. Tap the one that is you. Lock it in.";
    case "mission":
      return "Do the tiny thing, or write one line that you did it. Then you are done.";
    case "guess":
      return role === "guesser"
        ? `${personName} already answered. Guess what they said.`
        : "Answer about yourself first. Your person guesses next.";
    default: {
      const _never: never = kind;
      return _never;
    }
  }
}

function writeLabel(
  kind: PromptKind,
  role: LessonProps["role"],
  personName: string,
): string {
  switch (kind) {
    case "question":
      return "Your answer";
    case "rapid":
      return "Your pick";
    case "mission":
      return "One line of proof (optional)";
    case "guess":
      return role === "guesser"
        ? `What did ${personName} say?`
        : "Your real answer";
    default: {
      const _never: never = kind;
      return _never;
    }
  }
}

function writePlaceholder(kind: PromptKind, role: LessonProps["role"]): string {
  switch (kind) {
    case "question":
      return "A few honest sentences beat a perfect paragraph.";
    case "rapid":
      return "";
    case "mission":
      return "One line is plenty.";
    case "guess":
      return role === "guesser"
        ? "Your best guess. Close counts."
        : "Answer honestly. Your person is guessing.";
    default: {
      const _never: never = kind;
      return _never;
    }
  }
}

function sealLabel(kind: PromptKind, role: LessonProps["role"]): string {
  switch (kind) {
    case "question":
      return "Seal my answer";
    case "rapid":
      return "Lock it in";
    case "mission":
      return "Done";
    case "guess":
      return role === "guesser" ? "Seal my guess" : "Seal my answer";
    default: {
      const _never: never = kind;
      return _never;
    }
  }
}

async function submitLesson(input: {
  kind: PromptKind;
  role: LessonProps["role"];
  mood: number | null;
  choice: string | null;
  text: string;
  options: string[];
}): Promise<void> {
  switch (input.kind) {
    case "question": {
      if (!input.mood) throw new Error("Pick the face that matches today.");
      if (!input.text.trim()) throw new Error("Write a few words first.");
      const fd = new FormData();
      fd.set("mood", String(input.mood));
      fd.set("text", input.text);
      await submitAnswer(fd);
      return;
    }
    case "rapid": {
      if (!input.choice || !input.options.includes(input.choice)) {
        throw new Error("Tap one of the two cards.");
      }
      await submitRapid(input.choice);
      return;
    }
    case "mission":
      await submitMission(input.text);
      return;
    case "guess":
      if (!input.text.trim()) throw new Error("Write a few words first.");
      if (input.role === "guesser") await submitGuess(input.text);
      else await submitGuessAnswer(input.text);
      return;
    default: {
      const _never: never = input.kind;
      return _never;
    }
  }
}
