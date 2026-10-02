import Link from "next/link";
import type { DayView } from "@/lib/repo";
import type { Member } from "@/lib/session";
import { Ember } from "./ember";
import { CheckIcon, LockIcon } from "./icons";
import { NudgeButton } from "./nudge-button";

type NodeState = "done" | "current" | "locked";

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

export function QuestPath({
  today,
  member,
  partner,
  coupleCode,
}: {
  today: DayView;
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

  const nodes: { id: string; label: string; hint: string; state: NodeState }[] =
    [
      {
        id: "today",
        label: "Today",
        hint: "Your tiny quest",
        state: today.complete || myAnswer ? "done" : "current",
      },
      {
        id: "seal",
        label: "Seal",
        hint: partner ? "Wait together" : "Share the code",
        state: today.complete
          ? "done"
          : waiting
            ? "current"
            : myAnswer
              ? "done"
              : "locked",
      },
      {
        id: "together",
        label: "Together",
        hint: "The reveal",
        state: today.complete ? "done" : "locked",
      },
    ];

  let caption = "Tap START. One small step at a time.";
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

  return (
    <section className="flex flex-col items-center" aria-label="Today's path">
      <p id="today-heading" className="mb-2 font-display text-lg text-ink">
        {caption}
      </p>
      <div className="relative mx-auto w-full max-w-xs py-4">
        <div
          className="absolute top-16 bottom-16 left-1/2 w-1.5 -translate-x-1/2 rounded-full bg-ink"
          aria-hidden="true"
        />
        <ol className="relative flex flex-col gap-10">
          {nodes.map((node, i) => (
            <li
              key={node.id}
              className={`flex items-center ${
                i % 2 === 0 ? "justify-end pr-2" : "justify-start pl-2"
              }`}
            >
              <PathNode
                label={node.label}
                hint={node.hint}
                state={node.state}
                current={node.state === "current"}
                start={open && node.id === "today" && node.state === "current"}
              />
            </li>
          ))}
        </ol>
      </div>

      {open ? (
        <Link href="/answer" className="btn btn-primary mt-2 w-full max-w-xs">
          START
        </Link>
      ) : waiting && partner ? (
        <div className="mt-2 w-full max-w-xs">
          <NudgeButton partnerName={partner.name} />
        </div>
      ) : waiting && !partner ? (
        <p className="card mt-2 w-full max-w-xs px-4 py-3 text-center font-mono text-lg tracking-[0.25em] text-ink">
          {coupleCode}
        </p>
      ) : null}
    </section>
  );
}

function PathNode({
  label,
  hint,
  state,
  current,
  start,
}: {
  label: string;
  hint: string;
  state: NodeState;
  current: boolean;
  start: boolean;
}) {
  const fill =
    state === "done"
      ? "bg-sage text-card"
      : state === "current"
        ? "bg-flame text-card path-node-current"
        : "bg-cream text-ink-soft";

  return (
    <div className="relative flex w-36 flex-col items-center">
      {current ? (
        <div className="absolute -top-12">
          <Ember mood="happy" size={72} />
        </div>
      ) : null}
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-ink shadow-[0_6px_0_#1f2a55] ${fill} ${
          current ? "mt-6" : ""
        }`}
        aria-current={current ? "step" : undefined}
      >
        {state === "done" ? (
          <CheckIcon size={28} />
        ) : state === "locked" ? (
          <LockIcon size={26} />
        ) : (
          <span className="font-display text-xl">{start ? "1" : "!"}</span>
        )}
      </div>
      <p className="mt-2 font-display text-base text-ink">{label}</p>
      <p className="text-[11px] font-semibold tracking-wide text-ink-soft">
        {hint}
      </p>
    </div>
  );
}
