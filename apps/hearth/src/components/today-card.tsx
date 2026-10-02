import Link from "next/link";
import type { DayView } from "@/lib/repo";
import type { Member } from "@/lib/session";
import { CountdownChip } from "./countdown-chip";
import { Ember } from "./ember";
import { CheckIcon, SealIcon } from "./icons";
import { MoodFace } from "./mood-row";
import { NudgeButton } from "./nudge-button";
import { Avatar, personTint } from "./avatar";

const KIND_LABELS: Record<string, string> = {
  question: "Question",
  rapid: "Rapid fire",
  mission: "Mission",
  guess: "Guess day",
};

export const KIND_CHIP: Record<string, string> = {
  question: "border-gold-soft bg-gold-soft/30 text-gold-deep",
  rapid: "border-flame-soft bg-flame-soft/40 text-flame-deep",
  mission: "border-sage-soft bg-sage-soft/50 text-sage",
  guess: "border-plum-soft bg-plum-soft/50 text-plum",
};

export { personTint } from "./avatar";

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

  const emberMood =
    today.complete || myAnswer || myGuess
      ? "happy"
      : partnerAnswer
        ? "worried"
        : "happy";

  return (
    <div className="card relative mt-8 flex flex-col gap-4 p-5 pt-10">
      <div className="absolute -top-10 right-4">
        <Ember mood={emberMood} size={88} />
      </div>
      <div className="flex items-center gap-2 pr-20">
        <span className="chip">{today.category}</span>
        <span className={`chip ${KIND_CHIP[today.kind]}`}>
          {KIND_LABELS[today.kind]}
        </span>
      </div>
      <h1 id="today-heading" className="font-display text-2xl leading-snug text-ink">
        {today.prompt}
      </h1>

      {!partner ? (
        <div className="rounded-md border border-line bg-cream p-4 text-sm text-ink-soft">
          Share{" "}
          <span className="font-mono font-semibold tracking-widest text-gold-deep">
            {coupleCode}
          </span>{" "}
          when she is ready. You can still walk today&rsquo;s path now.
        </div>
      ) : null}
      {today.kind === "rapid" ? (
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
  partner: Member | null;
  myAnswer: { mood: number; text: string; avatar: string | null; color: string | null } | undefined;
  partnerAnswer: { mood: number; text: string; avatar: string | null; color: string | null } | undefined;
}) {
  const person = partner?.name ?? "your person";
  if (!myAnswer) {
    return (
      <div className="flex flex-col gap-3">
        {partnerAnswer ? (
          <>
            <p className="text-sm text-ink">
              <span className="font-semibold">{person}</span> sealed an
              answer. Yours unlocks it.
            </p>
            <CountdownChip />
          </>
        ) : (
          <p className="text-sm text-ink-soft">
            Answer to see what {person} wrote.
          </p>
        )}
        <Link href="/answer" className="btn btn-primary w-full">
          START
        </Link>
      </div>
    );
  }
  if (!partnerAnswer) {
    return (
      <div className="flex flex-col gap-3">
        <Sealed text={`Sealed. Waiting on ${person} to answer.`} />
        {partner ? <NudgeButton partnerName={partner.name} /> : null}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <AnswerBlock name={member.name} mood={myAnswer.mood} text={myAnswer.text} avatar={myAnswer.avatar} color={myAnswer.color} mine />
      <AnswerBlock name={partner?.name ?? "Your person"} mood={partnerAnswer.mood} text={partnerAnswer.text} avatar={partnerAnswer.avatar} color={partnerAnswer.color} />
    </div>
  );
}

function RapidState({
  member,
  partner,
  myAnswer,
  partnerAnswer,
}: {
  today: DayView;
  member: Member;
  partner: Member | null;
  myAnswer: { text: string; avatar: string | null; color: string | null } | undefined;
  partnerAnswer: { text: string; avatar: string | null; color: string | null } | undefined;
}) {
  const person = partner?.name ?? "your person";
  if (!myAnswer) {
    return (
      <div className="flex flex-col gap-3">
        {partnerAnswer ? <CountdownChip /> : null}
        <Link href="/answer" className="btn btn-primary w-full">
          START
        </Link>
      </div>
    );
  }
  if (!partnerAnswer) {
    return (
      <div className="flex flex-col gap-3">
        <Sealed
          text={`You picked "${myAnswer.text}". ${person}'s pick is still coming.`}
        />
        {partner ? <NudgeButton partnerName={partner.name} /> : null}
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
      <PickBlock name={member.name} pick={myAnswer.text} avatar={myAnswer.avatar} color={myAnswer.color} mine />
      <PickBlock name={partner?.name ?? "Your person"} pick={partnerAnswer.text} avatar={partnerAnswer.avatar} color={partnerAnswer.color} />
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
  partner: Member | null;
  myAnswer: { text: string; avatar: string | null; color: string | null } | undefined;
  partnerAnswer: { text: string; avatar: string | null; color: string | null } | undefined;
}) {
  if (!today.complete) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <MissionRow
            name={member.name}
            done={Boolean(myAnswer)}
            color={member.color}
          />
          <MissionRow
            name={partner?.name ?? "Your person"}
            done={Boolean(partnerAnswer)}
            color={partner?.color ?? null}
          />
        </div>
        {!myAnswer ? (
          <Link href="/answer" className="btn btn-primary w-full">
            START
          </Link>
        ) : partner ? (
          <NudgeButton partnerName={partner.name} />
        ) : null}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <span className="chip self-start border-gold bg-gold text-card">
        Mission complete
      </span>
      {myAnswer?.text ? (
        <PickBlock name={member.name} pick={myAnswer.text} avatar={myAnswer.avatar} color={myAnswer.color} mine />
      ) : null}
      {partnerAnswer?.text ? (
        <PickBlock name={partner?.name ?? "Your person"} pick={partnerAnswer.text} avatar={partnerAnswer.avatar} color={partnerAnswer.color} />
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
}: {
  today: DayView;
  member: Member;
  partner: Member | null;
  myAnswer: { text: string } | undefined;
  myGuess: { text: string } | undefined;
}) {
  const iAmAnswerer = today.answererId === member.id;
  const answererName = iAmAnswerer ? member.name : (partner?.name ?? "your person");
  const answererAnswered = today.answers.some(
    (a) => a.memberId === today.answererId,
  );

  if (!today.complete) {
    if (iAmAnswerer && !myAnswer) {
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink">
            Today starts with you. Answer about yourself, and{" "}
            <span className="font-semibold">{partner?.name ?? "your person"}</span> guesses.
          </p>
          <Link href="/answer" className="btn btn-primary w-full">
            START
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
          {partner ? <NudgeButton partnerName={partner.name} /> : null}
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
            START
          </Link>
        </div>
      );
    }
    return <Sealed text="Sealed. Waiting on your person." />;
  }

  const answerRow = today.answers.find(
    (a) => a.memberId === today.answererId,
  );
  const guessRow = today.guesses[0];
  const answerText = answerRow?.text;
  const guessText = guessRow?.text;
  return (
    <div className="flex flex-col gap-3">
      <PickBlock
        name={`${answererName} said`}
        pick={answerText ?? ""}
        avatar={answerRow?.avatar ?? null}
        color={answerRow?.color ?? null}
        mine={iAmAnswerer}
      />
      <PickBlock
        name={`${iAmAnswerer ? (partner?.name ?? "Your person") : member.name} guessed`}
        pick={guessText ?? ""}
        avatar={guessRow?.avatar ?? null}
        color={guessRow?.color ?? null}
        mine={!iAmAnswerer}
      />
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

function MissionRow({
  name,
  done,
  color,
}: {
  name: string;
  done: boolean;
  color: string | null;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-md border px-4 py-3 ${personTint(color)}`}
    >
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
  avatar,
  color,
}: {
  name: string;
  pick: string;
  avatar: string | null;
  color?: string | null;
  mine?: boolean;
}) {
  return (
    <div className={`rounded-md border p-4 ${personTint(color ?? null)}`}>
      <span className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-ink-soft">
        <Avatar avatar={avatar} name={name} color={color} size={24} />
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
  avatar,
  color,
}: {
  name: string;
  mood: number;
  text: string;
  avatar: string | null;
  color?: string | null;
  mine?: boolean;
}) {
  return (
    <div className={`rounded-md border p-4 ${personTint(color ?? null)}`}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-ink-soft">
          <Avatar avatar={avatar} name={name} color={color} size={24} />
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
