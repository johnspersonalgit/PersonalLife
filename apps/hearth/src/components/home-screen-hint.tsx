"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/i.test(ua);
  const standalone =
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone)) ||
    window.matchMedia("(display-mode: standalone)").matches;
  return ios && !standalone;
}

export function HomeScreenHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const detect = async () => {
      await Promise.resolve();
      if (!cancelled) setShow(isIosSafari());
    };
    void detect();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!show) return null;

  return (
    <Link
      href="/install"
      className="card mt-4 flex items-center justify-between gap-3 px-4 py-3 text-left"
    >
      <span>
        <span className="block font-display text-base text-ink">
          Put Hearth on this phone
        </span>
        <span className="block text-xs text-ink-soft">
          Safari Share, then Add to Home Screen.
        </span>
      </span>
      <span className="chip bg-flame text-card">Now</span>
    </Link>
  );
}
