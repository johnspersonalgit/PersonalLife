import Link from "next/link";
import { calendarDayOf, isCalendarDay } from "@/lib/lesson-keys";
import { canActOnLesson, iDidMyPart } from "@/lib/lesson-progress";
import type { DayView, WeekDot } from "@/lib/repo";
import type { Member } from "@/lib/session";
import {
  isChestDepth,
  pathSection,
  pathUnit,
  startLabel,
} from "@/lib/thread";
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

function canAct(lesson: DayView, member: Member): boolean {
  return canActOnLesson(lesson, member.id);
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
  current,
  lessons,
  week,
  member,
  partner,
  coupleCode,
  combo,
}: {
  today: DayView;
  current: DayView;
  lessons: DayView[];
  week: WeekDot[];
  member: Member;
  partner: Member | null;
  coupleCode: string;
  combo: number;
}) {
  const myAnswer = current.answers.find((a) => a.memberId === member.id);
  const partnerAnswer = partner
    ? current.answers.find((a) => a.memberId === partner.id)
    : undefined;
  const open = canAct(current, member);
  const waiting = Boolean(myAnswer) && !current.complete;
  const person = partner?.name ?? "your person";
  const extra = !isCalendarDay(current.day);
  const unitTitle = CATEGORY_TITLE[current.category] ?? "Today's tiny quest";

  let startKicker = extra ? "Same thread" : "Today's quest";
  let startTitle = extra
    ? `Layer ${current.depth} · keep going`
    : unitTitle;
  if (extra && open && isChestDepth(current.depth)) {
    startKicker = "Chest";
    startTitle = "The thread just opened.";
  } else if (!myAnswer && partnerAnswer) {
    startKicker = `${person} sealed`;
    startTitle = "Yours unlocks it.";
  } else if (!myAnswer && !partner) {
    startKicker = "Just you for now";
    startTitle = "Walk it. They join when ready.";
  } else if (waiting && !partner) {
    startKicker = "Sealed";
    startTitle = `Share ${coupleCode}`;
  } else if (waiting) {
    startKicker = "Sealed";
    startTitle = `Waiting on ${person}`;
  }

  const calendarToday = calendarDayOf(today.day);
  const past = week.filter(
    (d) =>
      d.day !== calendarToday && (d.state === "done" || d.state === "grace"),
  );
  const todayLessons = lessons.filter(
    (l) => calendarDayOf(l.day) === calendarToday,
  );
  const doneToday = todayLessons.filter((l) => iDidMyPart(l, member.id));
  const visibleDone = doneToday.slice(-8);

  const rewind =
    visibleDone.at(-1) ?? [...lessons].reverse().find((l) => l.complete);
  const locked = Array.from({ length: 3 }, (_, i) => ({
    id: `preview-${i}`,
    lessonId: i === 0 && rewind ? rewind.id : null,
    state: "locked" as const,
    icon: (i === 0 && rewind
      ? "chest"
      : ICONS[(past.length + visibleDone.length + 1 + i) % ICONS.length]) as IconName,
  }));
  const nodes: {
    id: string;
    lessonId: number | null;
    state: NodeState;
    icon: IconName;
  }[] = [
    ...past.map((d, i) => {
      const lesson = lessons.find((l) => l.day === d.day);
      return {
        id: d.day,
        lessonId: lesson?.id ?? null,
        state: (d.state === "grace" ? "grace" : "done") as NodeState,
        icon: ICONS[i % ICONS.length],
      };
    }),
    ...visibleDone.map((l, i) => ({
      id: l.day,
      lessonId: l.id,
      state: "done" as const,
      icon: ICONS[(past.length + i) % ICONS.length],
    })),
    {
      id: current.day,
      lessonId: current.id,
      state: "current" as const,
      icon: isChestDepth(current.depth)
        ? "chest"
        : ICONS[(past.length + visibleDone.length) % ICONS.length],
    },
    ...locked,
  ];

  const positions: { x: number; y: number }[] = [];
  let y = 108;
  for (const node of nodes) {
    positions.push({ x: WAVE[positions.length % WAVE.length], y });
    y += ROW + (node.state === "current" ? 128 : 0);
  }
  const height = y + 48;

  return (
    <section aria-label="Today's path">
      <div className="sticky top-[52px] z-20 bg-paper px-4 pt-3 pb-1">
        <div className="unit-banner">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.16em] text-card/80 uppercase">
                Section {pathSection(combo)}, Unit {pathUnit(combo)}
                {current.depth > 0 ? ` · Layer ${current.depth}` : ""}
              </p>
              <h1
                id="today-heading"
                className="mt-1 font-display text-xl leading-snug text-card"
              >
                {unitTitle}
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
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.34"
            />
          </svg>

          {nodes.map((node, i) => {
            const pos = positions[i];
            const isCurrent = node.state === "current";
            const emberRight = pos.x <= 50;
            const label = startLabel(current.depth);
            return (
              <div
                key={node.id}
                className="absolute"
                style={{ left: `${pos.x}%`, top: pos.y }}
              >
                <div
                  className="relative -translate-x-1/2 -translate-y-1/2"
                  data-current-node={isCurrent ? "true" : undefined}
                  data-today-node={node.id === today.day ? "true" : undefined}
                >
                  {isCurrent ? (
                    <div
                      className={`absolute top-[-8px] z-10 ${
                        emberRight ? "left-[86px]" : "right-[86px]"
                      }`}
                    >
                      <Ember
                        mood={
                          partnerAnswer && open
                            ? "worried"
                            : combo >= 3
                              ? "celebrate"
                              : "happy"
                        }
                        size={88}
                      />
                    </div>
                  ) : null}

                  {node.lessonId && node.state !== "current" ? (
                    <Link
                      href={`/quest/${node.lessonId}`}
                      aria-label={
                        node.icon === "chest"
                          ? "Open a finished quest"
                          : "Open this finished quest"
                      }
                      data-quest-node={String(node.lessonId)}
                    >
                      <PathNode
                        state={node.state}
                        icon={node.icon}
                        current={isCurrent}
                      />
                    </Link>
                  ) : (
                    <PathNode
                      state={node.state}
                      icon={node.icon}
                      current={isCurrent}
                    />
                  )}

                  {isCurrent && open ? (
                    <div className="start-card" data-start-card="">
                      <p className="start-card-kicker">{startKicker}</p>
                      <p className="start-card-title">{startTitle}</p>
                      <Link
                        href="/answer"
                        className={`start-card-btn${
                          label === "CHEST"
                            ? " start-bubble-chest"
                            : label === "DEEPER"
                              ? " start-bubble-deeper"
                              : ""
                        }`}
                        aria-label={label}
                        data-start-label={label}
                      >
                        {label}
                      </Link>
                    </div>
                  ) : null}

                  {isCurrent && waiting && partner ? (
                    <div className="absolute top-[86px] left-1/2 z-10 w-52 -translate-x-1/2">
                      <NudgeButton partnerName={partner.name} />
                    </div>
                  ) : null}

                  {isCurrent && waiting && !partner ? (
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
