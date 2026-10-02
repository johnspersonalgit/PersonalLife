import Link from "next/link";
import type { DayView } from "@/lib/repo";
import type { Member } from "@/lib/session";
import { CountdownChip } from "./countdown-chip";
import { Ember } from "./ember";
import { CheckIcon, SealIcon } from "./icons";
import { MoodFace } from "./mood-row";
import { NudgeButton } from "./nudge-button";

const KIND_LABELS: Record<string, string> = {
  question: "Question",
  rapid: "Rapid fire",
  mission: "Mission",
  guess: "Guess day",
};

export function TodayCard({
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
  const myGuess = today.guesses.find((g) => g.memberId === member.id);
  const partnerGuess = partner
    ? today.guesses.find((g) => g.memberId === partner.id)
    : undefined;

  const emberMood =
    today.complete || myAnswer || myGuess
      ? "happy"
      : partnerAnswer
        ? "worried"
        : "happy";

  return (
    <div className="card mt-2 flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="chip">{today.category}</span>
          <span className="chip border-gold-soft bg-gold-soft/30 text-gold-deep">
            {KIND_LABELS[today.kind]}
          </span>
        </div>
        <Ember mood={emberMood} size={44} />
      </div>
      <h1 id="today-heading" className="font-display text-2xl leading-snug text-ink">
        {today.prompt}
      </h1>

      {!partner ? (
        <div className="rounded-md border border-line bg-cream p-4 text-sm text-ink-soft">
          Your ritual is lit. Share the code{" "}
          <span className="font-mono font-semibold tracking-widest text-gold-deep">
            {coupleCode}
          </span>{" "}
          so your person can join from her phone.
        </div>
      ) : today.kind === "rapid" ? (
        <RapidState
          today={today}
          member={member}
          partner={partner}
          myAnswer={myAnswer}
          partnerAnswer={partnerAnswer}
        />
      ) : today.kind === "mission" ? (
        <MissionState
          today={today}
          member={member}
          partner={partner}
          myAnswer={myAnswer}
          partnerAnswer={partnerAnswer}
        />
      ) : today.kind === "guess" ? (
        <GuessState
          today={today}
          member={member}
          partner={partner}
          myAnswer={myAnswer}
          myGuess={myGuess}
          partnerGuess={partnerGuess}
        />
      ) : (
        <QuestionState
          member={member}
          partner={partner}
          myAnswer={myAnswer}
          partnerAnswer={partnerAnswer}
        />
      )}
    </div>
  );
}

function QuestionState({
  member,
  partner,
  myAnswer,
  partnerAnswer,
}: {
  member: Member;
  partner: Member;
  myAnswer: { mood: number; text: string } | undefined;
  partnerAnswer: { mood: number; text: string } | undefined;
}) {
  if (!myAnswer) {
    return (
      <div className="flex flex-col gap-3">
        {partnerAnswer ? (
          <>
            <p className="text-sm text-ink">
              <span className="font-semibold">{partner.name}</span> sealed an
              answer. Yours unlocks it.
            </p>
            <CountdownChip />
          </>
        ) : (
          <p className="text-sm text-ink-soft">
            Answer to see what {partner.name} wrote.
          </p>
        )}
        <Link href="/answer" className="btn btn-primary w-full">
          Answer today&rsquo;s question
        </Link>
      </div>
    );
  }
  if (!partnerAnswer) {
    return (
      <div className="flex flex-col gap-3">
        <Sealed text={`Sealed. Waiting on ${partner.name} to answer.`} />
        <NudgeButton partnerName={partner.name} />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <AnswerBlock name={member.name} mood={myAnswer.mood} text={myAnswer.text} mine />
      <AnswerBlock name={partner.name} mood={partnerAnswer.mood} text={partnerAnswer.text} />
    </div>
  );
}

function RapidState({
  today,
  member,
  partner,
  myAnswer,
  partnerAnswer,
}: {
  today: DayView;
  member: Member;
  partner: Member;
  myAnswer: { text: string } | undefined;
  partnerAnswer: { text: string } | undefined;
}) {
  if (!myAnswer) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          {today.options.map((o) => (
            <div
              key={o}
              className="rounded-md border border-line bg-cream px-4 py-3 text-sm font-medium text-ink"
            >
              {o}
            </div>
          ))}
        </div>
        {partnerAnswer ? <CountdownChip /> : null}
        <Link href="/answer" className="btn btn-primary w-full">
          Make your pick
        </Link>
      </div>
    );
  }
  if (!partnerAnswer) {
    return (
      <div className="flex flex-col gap-3">
        <Sealed
          text={`You picked "${myAnswer.text}". ${partner.name}'s pick is still coming.`}
        />
        <NudgeButton partnerName={partner.name} />
      </div>
    );
  }
  const match = myAnswer.text === partnerAnswer.text;
  return (
    <div className="flex flex-col gap-3">
      <span
        className={`chip self-start ${
          match
            ? "border-gold bg-gold text-card"
            : "border-flame-soft bg-flame-soft/40 text-flame-deep"
        }`}
      >
        {match ? "You match" : "Opposite ends today"}
      </span>
      <PickBlock name={member.name} pick={myAnswer.text} mine />
      <PickBlock name={partner.name} pick={partnerAnswer.text} />
    </div>
  );
}

function MissionState({
  today,
  member,
  partner,
  myAnswer,
  partnerAnswer,
}: {
  today: DayView;
  member: Member;
  partner: Member;
  myAnswer: { text: string } | undefined;
  partnerAnswer: { text: string } | undefined;
}) {
  if (!today.complete) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <MissionRow name={member.name} done={Boolean(myAnswer)} />
          <MissionRow name={partner.name} done={Boolean(partnerAnswer)} />
        </div>
        {!myAnswer ? (
          <Link href="/answer" className="btn btn-primary w-full">
            Do the mission
          </Link>
        ) : (
          <NudgeButton partnerName={partner.name} />
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <span className="chip self-start border-gold bg-gold text-card">
        Mission complete
      </span>
      {myAnswer?.text ? (
        <PickBlock name={member.name} pick={myAnswer.text} mine />
      ) : null}
      {partnerAnswer?.text ? (
        <PickBlock name={partner.name} pick={partnerAnswer.text} />
      ) : null}
    </div>
  );
}

function GuessState({
  today,
  member,
  partner,
  myAnswer,
  myGuess,
  partnerGuess,
}: {
  today: DayView;
  member: Member;
  partner: Member;
  myAnswer: { text: string } | undefined;
  myGuess: { text: string } | undefined;
  partnerGuess: { text: string } | undefined;
}) {
  const iAmAnswerer = today.answererId === member.id;
  const answererName = iAmAnswerer ? member.name : partner.name;
  const answererAnswered = today.answers.some(
    (a) => a.memberId === today.answererId,
  );

  if (!today.complete) {
    if (iAmAnswerer && !myAnswer) {
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink">
            Today starts with you. Answer about yourself, and{" "}
            <span className="font-semibold">{partner.name}</span> guesses.
          </p>
          <Link href="/answer" className="btn btn-primary w-full">
            Answer first
          </Link>
        </div>
      );
    }
    if (!iAmAnswerer && !answererAnswered) {
      return (
        <div className="flex flex-col gap-3">
          <Sealed
            text={`Today starts with ${answererName}. They answer, you guess what they said.`}
          />
          <NudgeButton partnerName={partner.name} />
        </div>
      );
    }
    if (!iAmAnswerer && !myGuess) {
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink">
            <span className="font-semibold">{answererName}</span> answered. What
            did they say?
          </p>
          <CountdownChip />
          <Link href="/answer" className="btn btn-primary w-full">
            Make your guess
          </Link>
        </div>
      );
    }
    return <Sealed text="Sealed. Waiting on your person." />;
  }

  const answerText = today.answers.find(
    (a) => a.memberId === today.answererId,
  )?.text;
  const guessText = today.guesses[0]?.text;
  return (
    <div className="flex flex-col gap-3">
      <PickBlock
        name={`${answererName} said`}
        pick={answerText ?? ""}
        mine={iAmAnswerer}
      />
      <PickBlock
        name={`${iAmAnswerer ? partner.name : member.name} guessed`}
        pick={guessText ?? ""}
        mine={!iAmAnswerer}
      />
      {partnerGuess || myGuess ? null : null}
    </div>
  );
}

function Sealed({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-line bg-cream p-4">
      <SealIcon size={18} className="shrink-0 text-gold-deep" />
      <p className="text-sm text-ink">{text}</p>
    </div>
  );
}

function MissionRow({ name, done }: { name: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-line bg-cream px-4 py-3">
      <span className="text-sm font-medium text-ink">{name}</span>
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full border ${
          done
            ? "border-gold bg-gold text-card"
            : "border-line bg-card text-transparent"
        }`}
      >
        <CheckIcon size={13} />
      </span>
    </div>
  );
}

function PickBlock({
  name,
  pick,
  mine = false,
}: {
  name: string;
  pick: string;
  mine?: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-4 ${
        mine ? "border-gold-soft bg-gold-soft/15" : "border-line bg-cream"
      }`}
    >
      <span className="text-xs font-semibold tracking-widest uppercase text-ink-soft">
        {name}
      </span>
      <p className="mt-1.5 text-sm leading-relaxed text-ink">{pick}</p>
    </div>
  );
}

function AnswerBlock({
  name,
  mood,
  text,
  mine = false,
}: {
  name: string;
  mood: number;
  text: string;
  mine?: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-4 ${
        mine ? "border-gold-soft bg-gold-soft/15" : "border-line bg-cream"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest uppercase text-ink-soft">
          {name}
        </span>
        {mood > 0 ? (
          <MoodFace value={mood} size={18} className="text-gold-deep" />
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink">{text}</p>
    </div>
  );
}
