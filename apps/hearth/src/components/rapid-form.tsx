"use client";

import { useState, useTransition } from "react";
import { submitRapid } from "@/lib/actions";
import { CheckIcon } from "./icons";

export function RapidForm({ options }: { options: string[] }) {
  const [choice, setChoice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      {options.map((opt) => {
        const on = choice === opt;
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={on}
            onClick={() => setChoice(opt)}
            className={`card flex items-center justify-between px-5 py-5 text-left transition-all ${
              on ? "border-gold bg-gold-soft/25 scale-[1.01]" : "hover:border-gold-soft"
            }`}
          >
            <span className="font-display text-lg text-ink">{opt}</span>
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                on ? "border-gold bg-gold text-card" : "border-line text-transparent"
              }`}
            >
              <CheckIcon size={13} />
            </span>
          </button>
        );
      })}
      <button
        type="button"
        className="btn btn-primary mt-3 w-full"
        disabled={!choice || pending}
        onClick={() => choice && startTransition(() => submitRapid(choice))}
      >
        {pending ? "Locking..." : "Lock it in"}
      </button>
      <p className="text-center text-xs text-ink-soft">
        Your pick stays sealed until you both choose.
      </p>
    </div>
  );
}
