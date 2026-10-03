import Link from "next/link";
import { calendarDayOf, isCalendarDay } from "@/lib/lesson-keys";
import { canActOnLesson, iDidMyPart } from "@/lib/lesson-progress";
import type { DayView, WeekDot } from "@/lib/repo";
import type { Member } from "@/lib/session";
import { startLabel } from "@/lib/thread";
import { Ember } from "./ember";
import { NudgeButton } from "./nudge-button";
import { PathScroller } from "./path-scroller";

type NodeState = "done" | "grace" | "current" | "locked";

const WAVE = [50, 26, 14, 26, 50, 74, 86, 74];
const ROW = 84;

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
  const extra = !isCalendarDay(current.day);
  const label = startLabel(current.depth);
  const answered =
    Number(Boolean(myAnswer)) + Number(Boolean(partnerAnswer));
  const progress = current.complete ? 1 : answered === 0 ? 0.18 : 0.55;

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

  const locked = [0, 1, 2, 3].map((i) => ({
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
  let y = 84;
  for (const node of nodes) {
    if (node.state === "current") y += 56;
    positions.push({ x: WAVE[positions.length % WAVE.length], y });
    y += ROW;
  }
  const height = y + 72;

  return (
    <section aria-label="Today's path">
      <div className="sticky top-[48px] z-20 bg-paper pb-4">
        <div className="unit-banner">
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-card/80 uppercase">
            {extra ? "Keep going" : "Today"}
          </p>
          <h1
            id="today-heading"
            className="mt-1 font-display text-[1.15rem] leading-snug text-card"
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
                      className={`pointer-events-none absolute top-[28px] z-10 ${
                        emberRight ? "left-[84px]" : "right-[84px]"
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
                        size={118}
                      />
                    </div>
                  ) : null}

                  {isCurrent && open ? (
                    <Link
                      href="/answer"
                      className="relative block"
                      aria-label={label}
                      data-start-label={label}
                    >
                      <span className="start-chip" data-start-card="">
                        {label}
                      </span>
                      <PathNode
                        state={node.state}
                        current
                        progress={progress}
                      />
                    </Link>
                  ) : node.lessonId && node.state !== "current" ? (
                    <Link
                      href={`/quest/${node.lessonId}`}
                      aria-label="Open this finished quest"
                      data-quest-node={String(node.lessonId)}
                    >
                      <PathNode state={node.state} current={false} />
                    </Link>
                  ) : (
                    <PathNode
                      state={node.state}
                      current={isCurrent}
                      progress={isCurrent ? progress : undefined}
                    />
                  )}

                  {isCurrent && waiting && partner ? (
                    <div className="absolute top-[92px] left-1/2 z-10 -translate-x-1/2">
                      <NudgeButton partnerName={partner.name} compact />
                    </div>
                  ) : null}

                  {isCurrent && waiting && !partner ? (
                    <p className="absolute top-[92px] left-1/2 z-10 -translate-x-1/2 rounded-full bg-card px-4 py-2 font-mono text-sm tracking-[0.2em] text-ink shadow-[0_4px_0_#e8d7c2]">
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
  progress = 0.18,
}: {
  state: NodeState;
  current: boolean;
  progress?: number;
}) {
  const size = current ? 64 : 60;
  const glyph = current ? 26 : 22;
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

  const node = (
    <div
      className={`path-node-stack${current ? " path-node-current" : ""}`}
      style={{ width: size, height: size + 10 }}
      aria-current={current ? "step" : undefined}
    >
      <span className={`path-node-base ${tone}`} style={{ width: size, height: size }} />
      <span className={`path-node ${tone}`} style={{ width: size, height: size }}>
        <NodeGlyph state={state} size={glyph} />
      </span>
    </div>
  );

  if (!current) return node;

  const ring = 90;
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - progress);

  return (
    <div className="path-node-halo" style={{ width: ring, height: ring }}>
      <svg
        className="path-node-track"
        width={ring}
        height={ring}
        viewBox={`0 0 ${ring} ${ring}`}
        aria-hidden="true"
      >
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          className="path-node-track-bg"
        />
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          className="path-node-track-fg"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      {node}
    </div>
  );
}

function NodeGlyph({ state, size }: { state: NodeState; size: number }) {
  switch (state) {
    case "done":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 12.6 9.6 17.2 19 7.6"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "locked":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M8 10V8a4 4 0 1 1 8 0v2h1.1c.8 0 1.4.6 1.4 1.4v7.2c0 .8-.6 1.4-1.4 1.4H6.9c-.8 0-1.4-.6-1.4-1.4v-7.2c0-.8.6-1.4 1.4-1.4H8zm2.1 0h3.8V8a1.9 1.9 0 1 0-3.8 0v2z" />
        </svg>
      );
    case "current":
    case "grace":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2.6l2.6 5.7 6.2.9-4.5 4.3 1.1 6.2L12 16.8l-5.4 2.9 1.1-6.2-4.5-4.3 6.2-.9L12 2.6z" />
        </svg>
      );
    default: {
      const _never: never = state;
      return _never;
    }
  }
}
