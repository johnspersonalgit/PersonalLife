"use client";

import { useEffect } from "react";
import { markNudgeSeen } from "@/lib/actions";
import { HeartIcon } from "./icons";

export function NudgeCard({
  nudgeId,
  fromName,
}: {
  nudgeId: number;
  fromName: string;
}) {
  useEffect(() => {
    void markNudgeSeen(nudgeId);
  }, [nudgeId]);

  return (
    <div className="card animate-rise flex items-center gap-3 border-gold-soft bg-cream px-4 py-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-card">
        <HeartIcon size={16} />
      </span>
      <p className="text-sm text-ink">
        <span className="font-semibold">{fromName}</span> sent a
        thinking-of-you.
      </p>
    </div>
  );
}
