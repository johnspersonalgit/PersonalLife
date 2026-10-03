"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function PathScroller({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node =
      ref.current?.querySelector("[data-start-card]") ??
      ref.current?.querySelector("[data-current-node]") ??
      ref.current?.querySelector("[data-today-node]");
    if (!(node instanceof HTMLElement)) return;
    const header = 164;
    const top = node.getBoundingClientRect().top + window.scrollY - header;
    window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
  }, []);

  return <div ref={ref}>{children}</div>;
}
