"use client";

import { useState, useTransition } from "react";
import { submitAnswer } from "@/lib/actions";
import { MOODS, MoodFace } from "./mood-row";

export function AnswerForm() {
  const [mood, setMood] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!mood) {
          setError("Pick the face that matches how you arrive today.");
          return;
        }
        if (!text.trim()) {
          setError("Write a few words first.");
          return;
        }
        setError(null);
        const fd = new FormData();
        fd.set("mood", String(mood));
        fd.set("text", text);
        startTransition(() => submitAnswer(fd));
      }}
    >
      <fieldset>
        <legend className="mb-3 text-xs font-semibold tracking-widest uppercase text-ink-soft">
          How are you arriving today?
        </legend>
        <div className="flex items-center justify-between">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMood(m.value)}
              aria-pressed={mood === m.value}
              className={`flex flex-col items-center gap-1.5 rounded-md px-2 py-2 transition-all ${
                mood === m.value
                  ? "text-gold-deep scale-110"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
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
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold tracking-widest uppercase text-ink-soft">
          Your answer
        </span>
        <textarea
          className="input min-h-32 resize-y"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="A few honest sentences beat a perfect paragraph."
          maxLength={2000}
        />
      </label>

      {error ? (
        <p role="alert" className="text-sm font-medium text-crit">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Sealing..." : "Seal my answer"}
      </button>
    </form>
  );
}
