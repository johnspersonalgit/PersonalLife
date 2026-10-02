import Link from "next/link";
import type { DayView, WeekDot } from "@/lib/repo";
import { shiftDay } from "@/lib/time";
import type { Member } from "@/lib/session";
import { Ember } from "./ember";
import {
  BookIcon,
  CheckIcon,
  ChestIcon,
  HeadphonesIcon,
  LockIcon,
  MicIcon,
  StarIcon,
  VideoIcon,
} from "./icons";
import { NudgeButton } from "./nudge-button";
import { PathScroller } from "./path-scroller";

type NodeState = "done" | "grace" | "current" | "locked";
type IconName = "star" | "headphones" | "video" | "book" | "chest" | "mic";

const WAVE = [50, 28, 18, 28, 50, 72, 82, 72];
const ROW = 102;
const ICONS: IconName[] = [
  "star",
  "headphones",
  "video",
  "book",
  "star",
  "chest",
  "mic",
  "star",
];

const CATEGORY_TITLE: Record<string, string> = {
  us: "Show up for us",
  heard: "Hear each other",
  load: "Share the load",
  gratitude: "Name the good",
  dreams: "Keep a someday",
  play: "Play a little",
};

function canAct(today: DayView, member: Member): boolean {
  const myAnswer = today.answers.some((a) => a.memberId === member.id);
  const myGuess = today.guesses.some((g) => g.memberId === member.id);
  if (today.kind === "guess") {
    const iAmAnswerer = today.answererId === member.id;
    const answererAnswered = today.answers.some(
      (a) => a.memberId === today.answererId,
    );
    if (iAmAnswerer) return !myAnswer;
    return answererAnswered && !myGuess;
  }
  return !myAnswer;
}

function iconFor(name: IconName, size: number) {
  switch (name) {
    case "star":
      return <StarIcon size={size} />;
    case "headphones":
      return <HeadphonesIcon size={size} />;
    case "video":
      return <VideoIcon size={size} />;
    case "book":
      return <BookIcon size={size} />;
    case "chest":
      return <ChestIcon size={size} />;
    case "mic":
      return <MicIcon size={size} />;
    default: {
      const _never: never = name;
      return _never;
    }
  }
}

export function QuestPath({
  today,
  week,
  member,
  partner,
  coupleCode,
}: {
  today: DayView;
  week: WeekDot[];
  member: Member;
  partner: Member | null;
  coupleCode: string;
}) {
  const myAnswer = today.answers.find((a) => a.memberId === member.id);
  const partnerAnswer = partner
    ? today.answers.find((a) => a.memberId === partner.id)
    : undefined;
  const open = canAct(today, member);
  const waiting = Boolean(myAnswer) && !today.complete;
  const person = partner?.name ?? "your person";

  let caption = CATEGORY_TITLE[today.category] ?? "Today's tiny quest";
  if (!myAnswer && partnerAnswer) {
    caption = `${person} sealed an answer. Yours unlocks it.`;
  } else if (!myAnswer && !partner) {
    caption = "You can do today now. She joins when she is ready.";
  } else if (waiting && !partner) {
    caption = `Sealed. Share ${coupleCode} so she can unlock it.`;
  } else if (waiting) {
    caption = `Sealed. Waiting on ${person}.`;
  } else if (today.complete) {
    caption = "You both showed up. The path is open.";
  }

  const past = week.filter(
    (d) =>
      d.day !== today.day && (d.state === "done" || d.state === "grace"),
  );
  const futureDays = Array.from({ length: 7 }, (_, i) =>
    shiftDay(today.day, i + 1),
  );

  const nodes: {
    id: string;
    state: NodeState;
    icon: IconName;
  }[] = [
    ...past.map((d, i) => ({
      id: d.day,
      state: (d.state === "grace" ? "grace" : "done") as NodeState,
      icon: ICONS[i % ICONS.length],
    })),
    {
      id: today.day,
      state: today.complete ? "done" : ("current" as const),
      icon: ICONS[past.length % ICONS.length],
    },
    ...futureDays.map((day, i) => ({
      id: day,
      state: "locked" as const,
      icon: ICONS[(past.length + 1 + i) % ICONS.length],
    })),
  ];

  const positions: { x: number; y: number }[] = [];
  let y = 108;
  for (const node of nodes) {
    positions.push({ x: WAVE[positions.length % WAVE.length], y });
    y += ROW + (node.state === "current" ? 62 : 0);
  }
  const height = y + 48;

  return (
    <section aria-label="Today's path">
      <div className="sticky top-[52px] z-20 bg-paper px-4 pt-3 pb-1">
        <div className="unit-banner">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.16em] text-card/80 uppercase">
                Section 1, Unit 1
              </p>
              <h1
                id="today-heading"
                className="mt-1 font-display text-xl leading-snug text-card"
              >
                {caption}
              </h1>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card/15 text-card">
              <BookIcon size={20} />
            </span>
          </div>
        </div>
      </div>

      <PathScroller>
        <div className="relative mx-auto w-full max-w-md" style={{ height }}>
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox={`0 0 100 ${height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polyline
              points={positions.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#1f2a55"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.22"
            />
          </svg>

          {nodes.map((node, i) => {
            const pos = positions[i];
            const current = node.state === "current";
            const emberRight = pos.x <= 50;
            return (
              <div
                key={node.id}
                className="absolute"
                style={{ left: `${pos.x}%`, top: pos.y }}
              >
                <div
                  className="relative -translate-x-1/2 -translate-y-1/2"
                  data-current-node={current ? "true" : undefined}
                  data-today-node={node.id === today.day ? "true" : undefined}
                >
                  {current ? (
                    <div
                      className={`absolute top-[-8px] z-10 ${
                        emberRight ? "left-[86px]" : "right-[86px]"
                      }`}
                    >
                      <Ember
                        mood={partnerAnswer && open ? "worried" : "happy"}
                        size={88}
                      />
                    </div>
                  ) : null}

                  <PathNode
                    state={node.state}
                    icon={node.icon}
                    current={current}
                  />

                  {current && open ? (
                    <Link
                      href="/answer"
                      className="start-bubble"
                      aria-label="START"
                    >
                      START
                    </Link>
                  ) : null}

                  {current && waiting && partner ? (
                    <div className="absolute top-[86px] left-1/2 z-10 w-52 -translate-x-1/2">
                      <NudgeButton partnerName={partner.name} />
                    </div>
                  ) : null}

                  {current && waiting && !partner ? (
                    <p className="absolute top-[86px] left-1/2 z-10 -translate-x-1/2 rounded-full border-[3px] border-ink bg-card px-4 py-2 font-mono text-sm tracking-[0.2em] text-ink shadow-[0_4px_0_#1f2a55]">
                      {coupleCode}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </PathScroller>
    </section>
  );
}

function PathNode({
  state,
  icon,
  current,
}: {
  state: NodeState;
  icon: IconName;
  current: boolean;
}) {
  const size = current ? 78 : 64;
  const glyph = state === "done" || state === "grace" ? 26 : 28;
  let fill = "bg-card text-ink-soft";
  switch (state) {
    case "done":
      fill = "bg-sage text-card";
      break;
    case "grace":
      fill = "bg-honey text-ink";
      break;
    case "current":
      fill = "bg-flame text-card path-node-current";
      break;
    case "locked":
      fill = "bg-cream text-ink-soft";
      break;
    default: {
      const _never: never = state;
      return _never;
    }
  }

  return (
    <div
      className={`relative flex items-center justify-center ${
        current ? "path-node-ring" : ""
      }`}
      style={{ width: size, height: size }}
      aria-current={current ? "step" : undefined}
    >
      <div
        className={`flex h-full w-full items-center justify-center rounded-full border-[4px] border-ink shadow-[0_7px_0_#1f2a55] ${fill}`}
      >
        {state === "done" ? (
          <CheckIcon size={glyph} />
        ) : state === "locked" ? (
          icon === "chest" ? (
            <ChestIcon size={glyph - 2} />
          ) : (
            <LockIcon size={glyph - 4} />
          )
        ) : state === "grace" ? (
          <StarIcon size={glyph} />
        ) : (
          iconFor(icon, glyph)
        )}
      </div>
    </div>
  );
}
