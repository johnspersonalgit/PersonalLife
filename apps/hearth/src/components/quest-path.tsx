import Link from "next/link";
import { calendarDayOf, isCalendarDay } from "@/lib/lesson-keys";
import { canActOnLesson, iDidMyPart } from "@/lib/lesson-progress";
import type { DayView, WeekDot } from "@/lib/repo";
import type { Member } from "@/lib/session";
import { startLabel } from "@/lib/thread";
import { Ember } from "./ember";
import { CheckIcon, LockIcon, StarIcon } from "./icons";
import { NudgeButton } from "./nudge-button";
import { WeekDots } from "./week-dots";

type NodeState = "done" | "grace" | "current" | "locked";

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

  let status = extra ? "From the last one" : "Today";
  if (!myAnswer && partnerAnswer) status = `${person} already answered`;
  else if (!myAnswer && !partner) status = "Just you for now";
  else if (waiting && !partner) status = `Share ${coupleCode}`;
  else if (waiting) status = `Waiting on ${person}`;

  let action = "Your turn";
  if (!myAnswer && partnerAnswer) action = "Yours unlocks it.";
  else if (waiting && !partner) action = coupleCode;
  else if (waiting) action = `Waiting on ${person}`;

  const calendarToday = calendarDayOf(today.day);
  const todayLessons = lessons.filter(
    (l) => calendarDayOf(l.day) === calendarToday,
  );
  const doneToday = todayLessons.filter((l) => iDidMyPart(l, member.id));
  const thread = [
    ...doneToday.map((l) => ({
      id: l.day,
      lessonId: l.id,
      state: "done" as const,
    })),
    {
      id: current.day,
      lessonId: current.id,
      state: "current" as const,
    },
  ];
  const showThread = doneToday.length > 0;

  return (
    <section aria-label="Today" className="flex flex-1 flex-col px-5 pt-6">
      <div
        className="flex flex-col items-center text-center"
        data-start-card=""
        data-current-node="true"
        data-today-node={current.day === today.day ? "true" : undefined}
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
          size={156}
        />

        <p className="mt-5 text-sm text-ink-soft">{status}</p>
        <h1
          id="today-heading"
          className="mt-2 max-w-sm font-display text-[1.75rem] leading-snug text-ink"
        >
          {current.prompt}
        </h1>
        {open ? <p className="mt-3 text-sm font-medium text-ink">{action}</p> : null}

        {open ? (
          <Link
            href="/answer"
            className="btn btn-primary mt-8 w-full max-w-xs"
            aria-label={label}
            data-start-label={label}
          >
            {label}
          </Link>
        ) : null}

        {waiting && partner ? (
          <div className="mt-8 w-full max-w-xs">
            <NudgeButton partnerName={partner.name} />
          </div>
        ) : null}

        {waiting && !partner ? (
          <p className="mt-8 rounded-full border-2 border-ink bg-card px-5 py-2 font-mono text-sm tracking-[0.2em] text-ink">
            {coupleCode}
          </p>
        ) : null}
      </div>

      <div className="mt-10" aria-label="This week">
        <WeekDots dots={week} />
      </div>

      {showThread ? (
        <ol
          className="mt-8 flex items-center justify-center gap-3"
          aria-label="Today's thread"
        >
          {thread.map((node) => (
            <li key={node.id}>
              {node.lessonId && node.state !== "current" ? (
                <Link
                  href={`/quest/${node.lessonId}`}
                  aria-label="Open this finished quest"
                  data-quest-node={String(node.lessonId)}
                >
                  <PathNode state={node.state} current={false} />
                </Link>
              ) : (
                <PathNode state={node.state} current={node.state === "current"} />
              )}
            </li>
          ))}
        </ol>
      ) : null}
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
  const size = current ? 52 : 40;
  const glyph = current ? 22 : 16;
  let fill = "bg-card text-ink-soft";
  switch (state) {
    case "done":
      fill = "bg-sage text-card";
      break;
    case "grace":
      fill = "bg-honey text-ink";
      break;
    case "current":
      fill = "bg-flame text-card";
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
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-current={current ? "step" : undefined}
    >
      <div
        className={`flex h-full w-full items-center justify-center rounded-full border-2 border-ink ${fill}`}
      >
        {state === "done" ? (
          <CheckIcon size={glyph} />
        ) : state === "locked" ? (
          <LockIcon size={glyph} />
        ) : (
          <StarIcon size={glyph} />
        )}
      </div>
    </div>
  );
}
