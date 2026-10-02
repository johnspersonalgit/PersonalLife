import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureDay } from "@/lib/repo";
import { getPartner, getSessionMember } from "@/lib/session";
import { localDay } from "@/lib/today";
import { BackIcon } from "@/components/icons";
import { QuestLesson } from "@/components/quest-lesson";
import { KIND_CHIP } from "@/components/today-card";

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
  const iAmAnswerer = today.answererId === member.id;
  const answererAnswered = today.answers.some(
    (a) => a.memberId === today.answererId,
  );

  const alreadyDone =
    today.kind === "guess"
      ? iAmAnswerer
        ? Boolean(myAnswer)
        : Boolean(myGuess) || !answererAnswered
      : Boolean(myAnswer);

  const role =
    today.kind === "guess"
      ? iAmAnswerer
        ? "answerer"
        : "guesser"
      : "solo";

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
        <span className={`chip ${KIND_CHIP[today.kind]}`}>
          {KIND_LABELS[today.kind]}
        </span>
      </header>

      {alreadyDone ? (
        <p className="card p-4 text-sm text-ink">
          {today.kind === "guess" && !iAmAnswerer && !answererAnswered
            ? `This one starts with ${partner?.name ?? "your person"}. They go first.`
            : "This step is sealed. Head back to the path."}
        </p>
      ) : (
        <QuestLesson
          kind={today.kind}
          prompt={today.prompt}
          category={today.category}
          options={today.options}
          role={role}
          personName={partner?.name ?? "your person"}
        />
      )}
    </main>
  );
}
