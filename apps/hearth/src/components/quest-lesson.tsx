"use client";

import { useState, useTransition, type ReactNode } from "react";
import {
  submitAnswer,
  submitGuess,
  submitGuessAnswer,
  submitMission,
  submitRapid,
} from "@/lib/actions";
import {
  closerFor,
  GUESS_SURE,
  MISSION_WHEN,
  RAPID_WHY,
  sparkFor,
} from "@/lib/lesson-beats";
import type { PromptKind } from "@/lib/streak";
import { Ember } from "./ember";
import { CheckIcon } from "./icons";
import { MOODS, MoodFace } from "./mood-row";

type LessonProps = {
  kind: PromptKind;
  prompt: string;
  category: string;
  options: string[];
  role: "answerer" | "guesser" | "solo";
  personName: string;
  depth?: number;
  fromPrompt?: string | null;
};

type QuestionStep = "intro" | "mood" | "closer" | "spark" | "write";
type RapidStep = "intro" | "pick" | "why" | "write";
type MissionStep = "intro" | "when" | "write";
type GuessStep = "intro" | "sure" | "write";

export function QuestLesson({
  kind,
  prompt,
  category,
  options,
  role,
  personName,
  depth = 0,
  fromPrompt = null,
}: LessonProps) {
  switch (kind) {
    case "question":
      return (
        <QuestionLesson
          prompt={prompt}
          category={category}
          personName={personName}
          depth={depth}
          fromPrompt={fromPrompt}
        />
      );
    case "rapid":
      return <RapidLesson prompt={prompt} options={options} />;
    case "mission":
      return <MissionLesson prompt={prompt} />;
    case "guess":
      return (
        <GuessLesson prompt={prompt} role={role} personName={personName} />
      );
    default: {
      const _never: never = kind;
      return _never;
    }
  }
}

function QuestionLesson({
  prompt,
  category,
  personName,
  depth,
  fromPrompt,
}: {
  prompt: string;
  category: string;
  personName: string;
  depth: number;
  fromPrompt: string | null;
}) {
  const steps: QuestionStep[] = ["intro", "mood", "closer", "spark", "write"];
  const [step, setStep] = useState<QuestionStep>("intro");
  const [mood, setMood] = useState<number | null>(null);
  const [closer, setCloser] = useState<string | null>(null);
  const [spark, setSpark] = useState<string | null>(null);
  const [text, setText] = useState("");
  const closers = closerFor(category);
  const sparks = sparkFor(category);

  return (
    <LessonShell
      steps={steps}
      step={step}
      ember={step === "intro" ? "happy" : step === "write" ? "celebrate" : "happy"}
    >
      {step === "intro" ? (
        <Intro
          prompt={prompt}
          blurb={`Five tiny taps. About a minute. ${personName} cannot see yours until they finish too.`}
          eyebrow={depth > 0 ? "Keep going" : "Today"}
          fromPrompt={fromPrompt}
          onContinue={() => setStep("mood")}
        />
      ) : null}

      {step === "mood" ? (
        <div className="flex flex-1 flex-col">
          <BeatTitle>How are you arriving?</BeatTitle>
          <div className="mt-4 flex items-center justify-between">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value)}
                aria-pressed={mood === m.value}
                className={`flex flex-col items-center gap-1.5 rounded-md px-2 py-2 ${
                  mood === m.value ? "text-gold-deep scale-110" : "text-ink-soft"
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
          <Continue disabled={!mood} onClick={() => setStep("closer")} />
        </div>
      ) : null}

      {step === "closer" ? (
        <ChoiceBeat
          title="Which is closer?"
          choices={closers}
          selected={closer}
          onPick={(value) => {
            setCloser(value);
            setStep("spark");
          }}
        />
      ) : null}

      {step === "spark" ? (
        <ChipBeat
          title="One word for today"
          choices={sparks}
          selected={spark}
          onPick={(value) => {
            setSpark(value);
            setStep("write");
          }}
        />
      ) : null}

      {step === "write" ? (
        <WriteBeat
          label="One short sentence"
          placeholder="A few honest words. That is enough."
          text={text}
          setText={setText}
          submitLabel="Seal my answer"
          onSubmit={async () => {
            if (!mood) throw new Error("Pick the face that matches today.");
            if (!text.trim()) throw new Error("Write a few words first.");
            const fd = new FormData();
            fd.set("mood", String(mood));
            fd.set("text", text.trim());
            await submitAnswer(fd);
          }}
        />
      ) : null}
    </LessonShell>
  );
}

function RapidLesson({
  prompt,
  options,
}: {
  prompt: string;
  options: string[];
}) {
  const steps: RapidStep[] = ["intro", "pick", "why", "write"];
  const [step, setStep] = useState<RapidStep>("intro");
  const [choice, setChoice] = useState<string | null>(null);
  const [why, setWhy] = useState<string | null>(null);
  const [text, setText] = useState("");

  return (
    <LessonShell steps={steps} step={step}>
      {step === "intro" ? (
        <Intro
          prompt={prompt}
          blurb="Four easy beats. Tap, tap, one line, lock."
          onContinue={() => setStep("pick")}
        />
      ) : null}
      {step === "pick" ? (
        <ChoiceBeat
          title="Tap the one that is you"
          choices={options}
          selected={choice}
          onPick={(value) => {
            setChoice(value);
            setStep("why");
          }}
        />
      ) : null}
      {step === "why" ? (
        <ChipBeat
          title="Why that one?"
          choices={[...RAPID_WHY]}
          selected={why}
          onPick={(value) => {
            setWhy(value);
            setStep("write");
          }}
        />
      ) : null}
      {step === "write" ? (
        <WriteBeat
          label="One line if you want"
          placeholder="Optional. A few words is plenty."
          text={text}
          setText={setText}
          required={false}
          submitLabel="Lock it in"
          onSubmit={async () => {
            if (!choice || !options.includes(choice)) {
              throw new Error("Tap one of the two cards.");
            }
            await submitRapid(choice);
          }}
        />
      ) : null}
    </LessonShell>
  );
}

function MissionLesson({ prompt }: { prompt: string }) {
  const steps: MissionStep[] = ["intro", "when", "write"];
  const [step, setStep] = useState<MissionStep>("intro");
  const [when, setWhen] = useState<string | null>(null);
  const [text, setText] = useState("");

  return (
    <LessonShell steps={steps} step={step}>
      {step === "intro" ? (
        <Intro
          prompt={prompt}
          blurb="A tiny mission. Pick when, write one line, done."
          onContinue={() => setStep("when")}
        />
      ) : null}
      {step === "when" ? (
        <ChipBeat
          title="When can you do it?"
          choices={[...MISSION_WHEN]}
          selected={when}
          onPick={(value) => {
            setWhen(value);
            setStep("write");
          }}
        />
      ) : null}
      {step === "write" ? (
        <WriteBeat
          label="One line of proof"
          placeholder="I did it, or I will before bed."
          text={text}
          setText={setText}
          required={false}
          submitLabel="Done"
          onSubmit={async () => {
            await submitMission(text.trim() || when || "Done");
          }}
        />
      ) : null}
    </LessonShell>
  );
}

function GuessLesson({
  prompt,
  role,
  personName,
}: {
  prompt: string;
  role: LessonProps["role"];
  personName: string;
}) {
  const steps: GuessStep[] = ["intro", "sure", "write"];
  const [step, setStep] = useState<GuessStep>("intro");
  const [sure, setSure] = useState<string | null>(null);
  const [text, setText] = useState("");
  const guesser = role === "guesser";

  return (
    <LessonShell steps={steps} step={step}>
      {step === "intro" ? (
        <Intro
          prompt={prompt}
          blurb={
            guesser
              ? `${personName} already answered. Three easy beats to guess.`
              : "Answer about yourself first. Three easy beats."
          }
          onContinue={() => setStep("sure")}
        />
      ) : null}
      {step === "sure" ? (
        <ChipBeat
          title={guesser ? "How are you guessing?" : "How sure are you?"}
          choices={[...GUESS_SURE]}
          selected={sure}
          onPick={(value) => {
            setSure(value);
            setStep("write");
          }}
        />
      ) : null}
      {step === "write" ? (
        <WriteBeat
          label={guesser ? `What did ${personName} say?` : "Your real answer"}
          placeholder={
            guesser
              ? "Your best guess. Close counts."
              : "Answer honestly. Your person is guessing."
          }
          text={text}
          setText={setText}
          submitLabel={guesser ? "Seal my guess" : "Seal my answer"}
          onSubmit={async () => {
            if (!text.trim()) throw new Error("Write a few words first.");
            if (guesser) await submitGuess(text);
            else await submitGuessAnswer(text);
          }}
        />
      ) : null}
    </LessonShell>
  );
}

function LessonShell({
  steps,
  step,
  ember = "happy",
  children,
}: {
  steps: string[];
  step: string;
  ember?: "happy" | "celebrate";
  children: ReactNode;
}) {
  const index = Math.max(0, steps.indexOf(step));
  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex flex-1 gap-1.5" aria-hidden="true">
          {steps.map((id, i) => (
            <span
              key={id}
              className={`h-2 flex-1 rounded-full border-2 border-ink ${
                i <= index ? "bg-flame" : "bg-cream"
              }`}
            />
          ))}
        </div>
        <p className="font-mono text-[11px] font-bold tracking-widest text-ink-soft uppercase">
          {index + 1} of {steps.length}
        </p>
      </div>
      {step === "intro" ? <Ember mood={ember} size={120} /> : null}
      {children}
    </div>
  );
}

function Intro({
  prompt,
  blurb,
  onContinue,
  eyebrow = "Today",
  fromPrompt = null,
}: {
  prompt: string;
  blurb: string;
  onContinue: () => void;
  eyebrow?: string;
  fromPrompt?: string | null;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <p className="mt-2 text-sm font-semibold tracking-widest text-ink-soft uppercase">
        {eyebrow}
      </p>
      {fromPrompt ? (
        <p className="mt-2 text-sm leading-snug text-ink-soft" data-from-prompt="">
          Deeper than: {fromPrompt}
        </p>
      ) : null}
      <h1
        className="mt-2 font-display text-3xl leading-snug text-ink"
        data-lesson-prompt=""
      >
        {prompt}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{blurb}</p>
      <Continue onClick={onContinue} />
    </div>
  );
}

function BeatTitle({ children }: { children: ReactNode }) {
  return (
    <p className="font-display text-2xl leading-snug text-ink">{children}</p>
  );
}

function Continue({
  onClick,
  disabled = false,
  label = "Continue",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      className="btn btn-primary mt-auto w-full"
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function ChoiceBeat({
  title,
  choices,
  selected,
  onPick,
}: {
  title: string;
  choices: readonly string[];
  selected: string | null;
  onPick: (value: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <BeatTitle>{title}</BeatTitle>
      <div className="mt-5 flex flex-col gap-3">
        {choices.map((opt) => {
          const on = selected === opt;
          return (
            <button
              key={opt}
              type="button"
              data-lesson-choice=""
              aria-pressed={on}
              onClick={() => onPick(opt)}
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
    </div>
  );
}

function ChipBeat({
  title,
  choices,
  selected,
  onPick,
}: {
  title: string;
  choices: readonly string[];
  selected: string | null;
  onPick: (value: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <BeatTitle>{title}</BeatTitle>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {choices.map((opt) => {
          const on = selected === opt;
          return (
            <button
              key={opt}
              type="button"
              data-lesson-chip=""
              aria-pressed={on}
              onClick={() => onPick(opt)}
              className={`card px-4 py-4 text-center font-display text-lg ${
                on ? "border-gold bg-gold-soft/25" : ""
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WriteBeat({
  label,
  placeholder,
  text,
  setText,
  submitLabel,
  onSubmit,
  required = true,
}: {
  label: string;
  placeholder: string;
  text: string;
  setText: (value: string) => void;
  submitLabel: string;
  onSubmit: () => Promise<void>;
  required?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-1 flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          try {
            await onSubmit();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Try that again.");
          }
        });
      }}
    >
      <label className="flex flex-col gap-2">
        <span className="font-display text-2xl leading-snug text-ink">
          {label}
        </span>
        <textarea
          className="input min-h-32 resize-y"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          maxLength={2000}
          required={required}
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm font-medium text-crit">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="btn btn-primary mt-auto w-full"
        disabled={pending || (required && !text.trim())}
      >
        {pending ? "Sealing..." : submitLabel}
      </button>
    </form>
  );
}

