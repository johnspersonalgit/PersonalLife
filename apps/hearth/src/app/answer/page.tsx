import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureDay } from "@/lib/repo";
import { getPartner, getSessionMember } from "@/lib/session";
import { localDay } from "@/lib/today";
import { AnswerForm } from "@/components/answer-form";
import { GuessFlow } from "@/components/guess-flow";
import { BackIcon } from "@/components/icons";
import { MissionForm } from "@/components/mission-form";
import { NudgeButton } from "@/components/nudge-button";
import { RapidForm } from "@/components/rapid-form";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  question: "Question",
  rapid: "Rapid fire",
  mission: "Mission",
  guess: "Guess day",
};

export default async function AnswerPage() {
  const member = await getSessionMember();
  if (!member) redirect("/onboarding");
  const partner = getPartner(member);
  const today = ensureDay(member.coupleId, localDay());

  if (today.complete) redirect("/");

  const myAnswer = today.answers.find((a) => a.memberId === member.id);
  const myGuess = today.guesses.find((g) => g.memberId === member.id);

  let body: React.ReactNode;
  const prompt = today.prompt;

  if (today.kind === "rapid") {
    body = myAnswer ? (
      <SealedNote text="Your pick is sealed. Waiting on your person." />
    ) : (
      <RapidForm options={today.options} />
    );
  } else if (today.kind === "mission") {
    body = myAnswer ? (
      <SealedNote text="Marked done. Waiting on your person." />
    ) : (
      <MissionForm />
    );
  } else if (today.kind === "guess") {
    const iAmAnswerer = today.answererId === member.id;
    const answererName = iAmAnswerer
      ? member.name
      : (partner?.name ?? "Your person");
    if (iAmAnswerer) {
      body = myAnswer ? (
        <SealedNote text="Your answer is sealed. Your person is guessing now." />
      ) : (
        <GuessFlow role="answerer" answererName={answererName} />
      );
    } else {
      const answererAnswered = today.answers.some(
        (a) => a.memberId === today.answererId,
      );
      if (myGuess) {
        body = <SealedNote text="Your guess is sealed. Reveal lands on Today." />;
      } else if (answererAnswered) {
        body = <GuessFlow role="guesser" answererName={answererName} />;
      } else {
        body = (
          <div className="flex flex-col gap-4">
            <SealedNote
              text={`This one starts with ${answererName}. They answer about themselves, then you guess.`}
            />
            {partner ? <NudgeButton partnerName={partner.name} /> : null}
          </div>
        );
      }
    }
  } else {
    body = myAnswer ? (
      <SealedNote text="Your answer is sealed. Waiting on your person." />
    ) : (
      <AnswerForm />
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 pt-6 pb-10">
      <header className="flex items-center gap-2">
        <Link
          href="/"
          aria-label="Back to today"
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-cream hover:text-ink"
        >
          <BackIcon size={20} />
        </Link>
        <span className="chip">{today.category}</span>
        <span className="chip border-gold-soft bg-gold-soft/30 text-gold-deep">
          {KIND_LABELS[today.kind]}
        </span>
      </header>

      <h1 className="font-display text-3xl leading-snug text-ink">{prompt}</h1>

      {body}
    </main>
  );
}

function SealedNote({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-line bg-cream p-4 text-sm text-ink">
      {text}
    </div>
  );
}
