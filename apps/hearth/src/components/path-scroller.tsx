"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function PathScroller({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current?.querySelector("[data-current-node]");
    if (!(node instanceof HTMLElement)) return;
    node.scrollIntoView({ block: "start", behavior: "auto" });
  }, []);

  return <div ref={ref}>{children}</div>;
}
