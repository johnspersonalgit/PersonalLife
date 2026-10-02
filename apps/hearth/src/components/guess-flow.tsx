"use client";

import { useState, useTransition } from "react";
import { submitGuess, submitGuessAnswer } from "@/lib/actions";

export function GuessFlow({
  role,
  answererName,
}: {
  role: "answerer" | "guesser";
  answererName: string;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isAnswerer = role === "answerer";

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) {
          setError(isAnswerer ? "Write your answer first." : "Write your guess first.");
          return;
        }
        setError(null);
        startTransition(async () => {
          try {
            if (isAnswerer) {
              await submitGuessAnswer(text);
            } else {
              await submitGuess(text);
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
          }
        });
      }}
    >
      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold tracking-widest uppercase text-ink-soft">
          {isAnswerer ? "Your real answer" : `What did ${answererName} say?`}
        </span>
        <textarea
          className="input min-h-24 resize-y"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            isAnswerer
              ? "Answer honestly. Your person is guessing."
              : "Your best guess. Close counts."
          }
          maxLength={2000}
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm font-medium text-crit">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending
          ? "Sealing..."
          : isAnswerer
            ? "Seal my answer"
            : "Seal my guess"}
      </button>
    </form>
  );
}
