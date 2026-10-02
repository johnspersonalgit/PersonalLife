import Link from "next/link";
import { calendarDayOf, isCalendarDay } from "@/lib/lesson-keys";
import { canActOnLesson, iDidMyPart } from "@/lib/lesson-progress";
import type { DayView, WeekDot } from "@/lib/repo";
import type { Member } from "@/lib/session";
import { startLabel } from "@/lib/thread";
import { Ember } from "./ember";
import { CheckIcon, LockIcon, StarIcon } from "./icons";
import { NudgeButton } from "./nudge-button";
import { PathScroller } from "./path-scroller";

type NodeState = "done" | "grace" | "current" | "locked";

const WAVE = [50, 28, 18, 28, 50, 72, 82, 72];
const ROW = 102;

function canAct(lesson: DayView, member: Member): boolean {
  return canActOnLesson(lesson, member.id);
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

  let startKicker = extra ? "From the last one" : "Today";
  let startTitle = "Your turn";
  if (!myAnswer && partnerAnswer) {
    startKicker = `${person} already answered`;
    startTitle = "Yours unlocks it.";
  } else if (!myAnswer && !partner) {
    startKicker = "Just you for now";
    startTitle = "Your turn";
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
  const locked = [
    {
      id: "preview-0",
      lessonId: rewind?.id ?? null,
      state: "locked" as const,
    },
  ];
  const nodes: {
    id: string;
    lessonId: number | null;
    state: NodeState;
  }[] = [
    ...past.map((d) => {
      const lesson = lessons.find((l) => l.day === d.day);
      return {
        id: d.day,
        lessonId: lesson?.id ?? null,
        state: (d.state === "grace" ? "grace" : "done") as NodeState,
      };
    }),
    ...visibleDone.map((l) => ({
      id: l.day,
      lessonId: l.id,
      state: "done" as const,
    })),
    {
      id: current.day,
      lessonId: current.id,
      state: "current" as const,
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
                {extra ? "Keep going" : "Today"}
              </p>
              <h1
                id="today-heading"
                className="mt-1 font-display text-xl leading-snug text-card"
              >
                {current.prompt}
              </h1>
            </div>
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
                      aria-label="Open this finished quest"
                      data-quest-node={String(node.lessonId)}
                    >
                      <PathNode state={node.state} current={isCurrent} />
                    </Link>
                  ) : (
                    <PathNode state={node.state} current={isCurrent} />
                  )}

                  {isCurrent && open ? (
                    <div className="start-card" data-start-card="">
                      <p className="start-card-kicker">{startKicker}</p>
                      <p className="start-card-title">{startTitle}</p>
                      <Link
                        href="/answer"
                        className={`start-card-btn${
                          label === "DEEPER" ? " start-bubble-deeper" : ""
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
  current,
}: {
  state: NodeState;
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
          <LockIcon size={glyph - 4} />
        ) : (
          <StarIcon size={glyph} />
        )}
      </div>
    </div>
  );
}
