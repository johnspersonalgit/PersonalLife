"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Ember } from "./ember";

const EMBERS = [
  { left: "18%", delay: "0s", size: 6 },
  { left: "32%", delay: "0.7s", size: 4 },
  { left: "50%", delay: "0.3s", size: 7 },
  { left: "66%", delay: "1.1s", size: 5 },
  { left: "80%", delay: "0.5s", size: 4 },
];

export function CelebrationView({
  streak,
  milestoneName,
}: {
  streak: number;
  milestoneName: string | null;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (streak <= 0) return;
    const step = Math.max(16, Math.floor(700 / streak));
    const t = setInterval(() => {
      setCount((c) => {
        if (c >= streak) {
          clearInterval(t);
          return c;
        }
        return c + 1;
      });
    }, step);
    return () => clearInterval(t);
  }, [streak]);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
      {EMBERS.map((e, i) => (
        <span
          key={i}
          className="absolute bottom-24 rounded-full bg-gold"
          style={{
            left: e.left,
            width: e.size,
            height: e.size,
            animation: `ember-rise 2.6s ease-out ${e.delay} infinite`,
          }}
          aria-hidden="true"
        />
      ))}

      <Ember mood="celebrate" size={150} />

      <p
        className="mt-6 font-display text-7xl leading-none text-ink"
        aria-live="polite"
      >
        {count}
      </p>
      <h1 className="mt-2 font-display text-3xl text-ink">
        {streak === 1 ? "Day Streak" : "Day Streak"}
      </h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
        {streak <= 1
          ? "The flame is lit. Both of you, one question a day."
          : "The flame grows because you both showed up."}
      </p>

      {milestoneName ? (
        <div className="card animate-rise mt-6 w-full max-w-xs px-5 py-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-gold-deep">
            Milestone reached
          </p>
          <p className="mt-1 font-display text-xl text-ink">{milestoneName}</p>
        </div>
      ) : null}

      <Link href="/" className="btn btn-primary mt-10 w-full max-w-xs">
        Continue
      </Link>
    </main>
  );
}
