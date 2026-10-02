import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureDay } from "@/lib/repo";
import { getSessionMember } from "@/lib/session";
import { localDay } from "@/lib/today";
import { AnswerForm } from "@/components/answer-form";
import { BackIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AnswerPage() {
  const member = await getSessionMember();
  if (!member) redirect("/onboarding");
  const today = ensureDay(member.coupleId, localDay());

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
      </header>

      <h1 className="font-display text-3xl leading-snug text-ink">
        {today.prompt}
      </h1>

      <AnswerForm />
    </main>
  );
}
