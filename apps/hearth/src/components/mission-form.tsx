"use client";

import { useState, useTransition } from "react";
import { submitMission } from "@/lib/actions";

export function MissionForm() {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(() => submitMission(note));
      }}
    >
      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold tracking-widest uppercase text-ink-soft">
          Your proof or thought (optional)
        </span>
        <textarea
          className="input min-h-24 resize-y"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="One line is plenty."
          maxLength={2000}
        />
      </label>
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Marking..." : "Done"}
      </button>
    </form>
  );
}
