"use client";

import { useRef, useTransition } from "react";
import { sendNote } from "@/lib/actions";

export function NoteComposer({ partnerName }: { partnerName: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      ref={ref}
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (!String(fd.get("text") ?? "").trim()) return;
        startTransition(async () => {
          await sendNote(fd);
          ref.current?.reset();
        });
      }}
    >
      <textarea
        name="text"
        required
        maxLength={2000}
        rows={2}
        className="input min-h-12 flex-1 resize-none"
        placeholder={`Leave a note for ${partnerName}...`}
        aria-label="Note text"
      />
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "..." : "Send"}
      </button>
    </form>
  );
}
