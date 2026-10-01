import type { WeekDot } from "@/lib/repo";
import { CheckIcon, FlameIcon } from "./icons";

export function WeekDots({ dots }: { dots: WeekDot[] }) {
  return (
    <div className="flex items-center justify-between gap-1">
      {dots.map((d) => (
        <div key={d.day} className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-semibold tracking-widest text-ink-soft">
            {d.label}
          </span>
          <Dot state={d.state} />
        </div>
      ))}
    </div>
  );
}

function Dot({ state }: { state: WeekDot["state"] }) {
  const base =
    "flex h-8 w-8 items-center justify-center rounded-full border text-ink";
  switch (state) {
    case "done":
      return (
        <span className={`${base} border-gold bg-gold text-card`}>
          <CheckIcon size={14} />
        </span>
      );
    case "today-done":
      return (
        <span className={`${base} border-gold-deep bg-gold text-card ring-2 ring-gold-soft`}>
          <CheckIcon size={14} />
        </span>
      );
    case "today-open":
      return (
        <span
          className={`${base} border-gold bg-card`}
          style={{ borderStyle: "dashed" }}
        >
          <FlameIcon size={13} className="text-gold" />
        </span>
      );
    case "grace":
      return (
        <span className={`${base} border-flame bg-flame-soft/60`}>
          <FlameIcon size={13} className="text-flame-deep" />
        </span>
      );
    case "missed":
      return <span className={`${base} border-line bg-cream`} />;
  }
}
