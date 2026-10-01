"use client";

import { useEffect, useState } from "react";
import { msUntilMidnight } from "@/lib/time";

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function CountdownChip() {
  const [left, setLeft] = useState(() => msUntilMidnight());

  useEffect(() => {
    const t = setInterval(() => setLeft(msUntilMidnight()), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <span className="chip border-flame-soft bg-flame-soft/40 text-flame-deep normal-case tracking-normal">
      Streak rests at midnight. {format(left)} left.
    </span>
  );
}
