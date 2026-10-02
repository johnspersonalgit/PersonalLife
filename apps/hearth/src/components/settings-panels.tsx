"use client";

import { useState, useTransition } from "react";
import { updateCategories } from "@/lib/actions";
import { CheckIcon } from "./icons";

const CATEGORIES = [
  { id: "us", name: "Us" },
  { id: "heard", name: "Heard" },
  { id: "load", name: "Load" },
  { id: "gratitude", name: "Gratitude" },
  { id: "dreams", name: "Dreams" },
  { id: "play", name: "Play" },
];

export function CategoryPanel({ initial }: { initial: string[] }) {
  const [cats, setCats] = useState<string[]>(initial);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const on = cats.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setSaved(false);
                setCats((prev) =>
                  on ? prev.filter((x) => x !== c.id) : [...prev, c.id],
                );
              }}
              className={`chip transition-colors ${
                on ? "border-gold bg-gold-soft/30 text-ink" : ""
              }`}
            >
              {on ? <CheckIcon size={11} /> : null}
              {c.name}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="btn btn-secondary mt-4"
        disabled={!cats.length || pending}
        onClick={() =>
          startTransition(async () => {
            await updateCategories(cats);
            setSaved(true);
          })
        }
      >
        {saved ? "Saved" : pending ? "Saving..." : "Save categories"}
      </button>
    </div>
  );
}
