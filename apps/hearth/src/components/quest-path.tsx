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

const WAVE = [50, 30, 18, 30, 50, 70, 82, 70];
const ROW = 96;

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
  const label = startLabel(current.depth);

  let startTitle = extra ? "From the last one" : "Today";
  if (!myAnswer && partnerAnswer) startTitle = "Yours unlocks it.";
  else if (!myAnswer && !partner) startTitle = "Your turn";
  else if (waiting && !partner) startTitle = `Share ${coupleCode}`;
  else if (waiting) startTitle = `Waiting on ${person}`;
  else if (open) startTitle = "Your turn";

  const calendarToday = calendarDayOf(today.day);
  const past = week.filter(
    (d) =>
      d.day !== calendarToday && (d.state === "done" || d.state === "grace"),
  );
  const todayLessons = lessons.filter(
    (l) => calendarDayOf(l.day) === calendarToday,
  );
  const doneToday = todayLessons.filter((l) => iDidMyPart(l, member.id));
  const visibleDone = doneToday.slice(-6);
  const rewind =
    visibleDone.at(-1) ?? [...lessons].reverse().find((l) => l.complete);

  const locked = [0, 1, 2].map((i) => ({
    id: `preview-${i}`,
    lessonId: i === 0 ? (rewind?.id ?? null) : null,
    state: "locked" as const,
  }));

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
  let y = 72;
  for (const node of nodes) {
    positions.push({ x: WAVE[positions.length % WAVE.length], y });
    y += ROW + (node.state === "current" ? 148 : 0);
  }
  const height = y + 40;

  return (
    <section aria-label="Today's path">
      <div className="sticky top-[52px] z-20 bg-paper px-4 pt-3 pb-2">
        <div className="unit-banner">
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-card/80 uppercase">
            {extra ? "Keep going" : "Today"}
          </p>
          <h1
            id="today-heading"
            className="mt-1 font-display text-[1.35rem] leading-snug text-card"
          >
            {current.prompt}
          </h1>
        </div>
      </div>

      <PathScroller>
        <div className="relative mx-auto w-full max-w-md" style={{ height }}>
          {nodes.map((node, i) => {
            const pos = positions[i];
            const isCurrent = node.state === "current";
            const emberRight = pos.x <= 50;
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
                      className={`absolute top-[-18px] z-10 ${
                        emberRight ? "left-[78px]" : "right-[78px]"
                      }`}
                    >
                      <Ember
                        mood={
                          partnerAnswer && open
                            ? "worried"
                            : combo >= 3
                              ? "celebrate"
                              : waiting
                                ? "sleepy"
                                : "happy"
                        }
                        size={108}
                      />
                    </div>
                  ) : null}

                  {node.lessonId && node.state !== "current" ? (
                    <Link
                      href={`/quest/${node.lessonId}`}
                      aria-label="Open this finished quest"
                      data-quest-node={String(node.lessonId)}
                    >
                      <PathNode state={node.state} current={false} />
                    </Link>
                  ) : (
                    <PathNode state={node.state} current={isCurrent} />
                  )}

                  {isCurrent && open ? (
                    <div
                      className={`start-card${pos.x > 58 ? " start-card-left" : ""}`}
                      data-start-card=""
                    >
                      <p className="start-card-title">{startTitle}</p>
                      <Link
                        href="/answer"
                        className="start-card-btn"
                        aria-label={label}
                        data-start-label={label}
                      >
                        {label}
                      </Link>
                    </div>
                  ) : null}

                  {isCurrent && waiting && partner ? (
                    <div className="absolute top-[86px] left-1/2 z-10 w-56 -translate-x-1/2">
                      <NudgeButton partnerName={partner.name} />
                    </div>
                  ) : null}

                  {isCurrent && waiting && !partner ? (
                    <p className="absolute top-[86px] left-1/2 z-10 -translate-x-1/2 rounded-full bg-card px-4 py-2 font-mono text-sm tracking-[0.2em] text-ink shadow-[0_4px_0_var(--color-cream)]">
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
  const size = current ? 72 : 64;
  const glyph = current ? 28 : 24;
  let tone = "path-node-locked";
  switch (state) {
    case "done":
      tone = "path-node-done";
      break;
    case "grace":
      tone = "path-node-grace";
      break;
    case "current":
      tone = "path-node-now";
      break;
    case "locked":
      tone = "path-node-locked";
      break;
    default: {
      const _never: never = state;
      return _never;
    }
  }

  return (
    <div
      className={`path-node ${tone}${current ? " path-node-current" : ""}`}
      style={{ width: size, height: size }}
      aria-current={current ? "step" : undefined}
    >
      {state === "done" ? (
        <CheckIcon size={glyph} />
      ) : state === "locked" ? (
        <LockIcon size={glyph - 4} />
      ) : (
        <StarIcon size={glyph} />
      )}
    </div>
  );
}
