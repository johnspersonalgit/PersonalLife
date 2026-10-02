import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureOpenLesson, getLessonById } from "@/lib/repo";
import { getPartner, getSessionMember } from "@/lib/session";
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
  const lesson = await ensureOpenLesson(member.coupleId, member.id);
  const parent = lesson.parentId
    ? getLessonById(member.coupleId, lesson.parentId)
    : null;

  const myAnswer = lesson.answers.find((a) => a.memberId === member.id);
  const myGuess = lesson.guesses.find((g) => g.memberId === member.id);
  const iAmAnswerer = lesson.answererId === member.id;
  const answererAnswered = lesson.answers.some(
    (a) => a.memberId === lesson.answererId,
  );

  const alreadyDone =
    lesson.kind === "guess"
      ? iAmAnswerer
        ? Boolean(myAnswer)
        : Boolean(myGuess) || !answererAnswered
      : Boolean(myAnswer);

  const role =
    lesson.kind === "guess"
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
        <span className="chip">{lesson.category}</span>
        <span className={`chip ${KIND_CHIP[lesson.kind]}`}>
          {KIND_LABELS[lesson.kind]}
        </span>
      </header>

      {alreadyDone ? (
        <p className="card p-4 text-sm text-ink">
          {lesson.kind === "guess" && !iAmAnswerer && !answererAnswered
            ? `This one starts with ${partner?.name ?? "your person"}. They go first.`
            : "This step is sealed. Head back to the path."}
        </p>
      ) : (
        <QuestLesson
          kind={lesson.kind}
          prompt={lesson.prompt}
          category={lesson.category}
          options={lesson.options}
          role={role}
          personName={partner?.name ?? "your person"}
          depth={lesson.depth}
          fromPrompt={parent?.prompt ?? null}
        />
      )}
    </main>
  );
}
