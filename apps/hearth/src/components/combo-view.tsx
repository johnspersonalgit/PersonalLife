"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { comboBody, comboTitle, isChestDepth } from "@/lib/thread";
import { Ember } from "./ember";
import { JuiceStats } from "./juice-stats";

const EMBERS = [
  { left: "16%", delay: "0s", size: 6 },
  { left: "34%", delay: "0.6s", size: 4 },
  { left: "52%", delay: "0.25s", size: 7 },
  { left: "70%", delay: "1s", size: 5 },
  { left: "84%", delay: "0.45s", size: 4 },
];

export function ComboView({
  combo,
  depth,
}: {
  combo: number;
  depth: number;
}) {
  const [count, setCount] = useState(0);
  const chest = isChestDepth(depth);

  useEffect(() => {
    if (combo <= 0) return;
    const step = Math.max(14, Math.floor(520 / combo));
    const t = setInterval(() => {
      setCount((c) => {
        if (c >= combo) {
          clearInterval(t);
          return c;
        }
        return c + 1;
      });
    }, step);
    return () => clearInterval(t);
  }, [combo]);

  return (
    <main
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center"
      data-combo-page=""
      data-combo={combo}
      data-depth={depth}
    >
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

      <Ember mood="celebrate" size={196} />

      <p
        className="mt-6 font-display text-7xl leading-none text-ink"
        aria-live="polite"
      >
        x{count}
      </p>
      <h1 className="mt-2 font-display text-3xl text-ink">
        {comboTitle(combo, depth)}
      </h1>
      {depth > 0 ? (
        <p className="mt-2 font-mono text-xs font-extrabold tracking-[0.18em] text-ink-soft uppercase">
          {chest ? `Chest · Layer ${depth}` : `Layer ${depth}`}
        </p>
      ) : null}
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
        {comboBody(combo, depth)}
      </p>

      <JuiceStats
        items={[
          { label: "Combo", value: `x${combo}` },
          { label: "Layer", value: String(Math.max(1, depth)) },
          { label: "Thread", value: chest ? "Chest" : "Same" },
        ]}
      />

      <Link href="/" className="btn btn-primary mt-10 w-full max-w-xs">
        {chest ? "Open the chest" : depth > 0 ? "Go deeper" : "Continue"}
      </Link>
    </main>
  );
}
