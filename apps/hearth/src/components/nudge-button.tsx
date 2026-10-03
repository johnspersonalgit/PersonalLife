"use client";

import { useState, useTransition } from "react";
import { sendNudge } from "@/lib/actions";
import { HeartIcon } from "./icons";

export function NudgeButton({
  partnerName,
  compact = false,
}: {
  partnerName: string;
  compact?: boolean;
}) {
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending || sent}
      onClick={() =>
        startTransition(async () => {
          await sendNudge();
          setSent(true);
        })
      }
      className={compact ? "start-nudge" : "btn btn-secondary w-full"}
    >
      <HeartIcon size={16} />
      {sent ? `Sent to ${partnerName}` : `Send ${partnerName} a thinking-of-you`}
    </button>
  );
}
