"use client";

import { useState, useTransition } from "react";
import { updateAvatar, updateCategories, updatePin } from "@/lib/actions";
import { AVATARS } from "./avatar";
import { CheckIcon } from "./icons";

export function AvatarPanel({ current }: { current: string | null }) {
  const [selected, setSelected] = useState(current ?? "ember");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      {AVATARS.map((a) => {
        const on = selected === a.id;
        return (
          <button
            key={a.id}
            type="button"
            aria-pressed={on}
            aria-label={`Choose ${a.label} avatar`}
            disabled={pending}
            onClick={() => {
              setSelected(a.id);
              startTransition(() => updateAvatar(a.id));
            }}
            className={`overflow-hidden rounded-full border-2 transition-all ${
              on
                ? "border-gold scale-110 shadow-sm"
                : "border-line hover:border-gold-soft"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={a.src}
              alt={a.label}
              className="h-12 w-12 object-cover"
            />
          </button>
        );
      })}
    </div>
  );
}

const CATEGORIES = [
  { id: "us", name: "Us" },
  { id: "heard", name: "Heard" },
  { id: "load", name: "Load" },
  { id: "gratitude", name: "Gratitude" },
  { id: "dreams", name: "Dreams" },
  { id: "play", name: "Play" },
];

export function PinPanel() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const res = await updatePin(current, next);
          if ("error" in res) {
            setOk(false);
            setMessage(res.error);
          } else {
            setOk(true);
            setMessage("PIN updated.");
            setCurrent("");
            setNext("");
          }
        });
      }}
    >
      <div className="flex gap-3">
        <input
          className="input font-mono tracking-[0.3em]"
          type="password"
          inputMode="numeric"
          value={current}
          onChange={(e) => setCurrent(e.target.value.replace(/\D/g, ""))}
          placeholder="CURRENT"
          maxLength={6}
          aria-label="Current PIN"
        />
        <input
          className="input font-mono tracking-[0.3em]"
          type="password"
          inputMode="numeric"
          value={next}
          onChange={(e) => setNext(e.target.value.replace(/\D/g, ""))}
          placeholder="NEW"
          maxLength={6}
          aria-label="New PIN"
        />
      </div>
      {message ? (
        <p
          role="alert"
          className={`text-sm font-medium ${ok ? "text-sage" : "text-crit"}`}
        >
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        className="btn btn-secondary self-start"
        disabled={pending || !current || !next}
      >
        {pending ? "Saving..." : "Change PIN"}
      </button>
    </form>
  );
}

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
