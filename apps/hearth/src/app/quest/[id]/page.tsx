import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EchoForm } from "@/components/echo-form";
import { QuestReplay } from "@/components/quest-replay";
import { Avatar, personTint } from "@/components/avatar";
import { BackIcon } from "@/components/icons";
import { MoodFace } from "@/components/mood-row";
import { TabBar } from "@/components/tab-bar";
import { KIND_CHIP } from "@/components/today-card";
import { getEchoes, getLessonById, getThread } from "@/lib/repo";
import { getPartner, getSessionMember } from "@/lib/session";
import { prettyDay } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function QuestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const member = await getSessionMember();
  if (!member) redirect("/onboarding");
  const partner = getPartner(member);
  const { id } = await params;
  const dayId = Number(id);
  if (!Number.isInteger(dayId)) notFound();
  const lesson = getLessonById(member.coupleId, dayId);
  if (!lesson) notFound();
  const echoes = getEchoes(lesson.id);
  const thread = getThread(member.coupleId, lesson);
  const parent = thread.length > 1 ? thread[thread.length - 2] : null;
  const mine = lesson.answers.find((a) => a.memberId === member.id);
  const theirs = partner
    ? lesson.answers.find((a) => a.memberId === partner.id)
    : undefined;
  const canInteract = Boolean(mine || lesson.complete);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 pt-6 pb-28">
      <header className="flex items-center gap-2">
        <Link
          href="/"
          aria-label="Back to today"
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-cream hover:text-ink"
        >
          <BackIcon size={20} />
        </Link>
        <span className="text-[10px] font-semibold tracking-widest uppercase text-ink-soft">
          {prettyDay(lesson.day)}
        </span>
        <span className="chip">{lesson.category}</span>
        <span className={`chip ${KIND_CHIP[lesson.kind]}`}>{lesson.kind}</span>
      </header>

      {parent ? (
        <Link
          href={`/quest/${parent.id}`}
          className="card px-4 py-3 text-sm leading-snug text-ink-soft"
          data-thread-parent=""
        >
          <span className="text-[10px] font-extrabold tracking-[0.16em] uppercase text-ink-soft">
            Deeper than
          </span>
          <span className="mt-1 block text-ink">{parent.prompt}</span>
        </Link>
      ) : null}

      <section className="card flex flex-col gap-3 p-5" data-quest-review="">
        <h1 className="font-display text-2xl leading-snug text-ink">
          {lesson.prompt}
        </h1>
        {lesson.complete || (mine && theirs) ? (
          <div className="flex flex-col gap-2">
            {theirs ? (
              <Entry
                name={theirs.memberName}
                mood={theirs.mood}
                text={theirs.text}
                avatar={theirs.avatar}
                color={theirs.color}
              />
            ) : null}
            {mine ? (
              <Entry
                name={mine.memberName}
                mood={mine.mood}
                text={mine.text}
                avatar={mine.avatar}
                color={mine.color}
              />
            ) : null}
            {lesson.guesses.map((g) => (
              <Entry
                key={g.memberId}
                name={`${g.memberName} guessed`}
                mood={0}
                text={g.text}
                avatar={g.avatar}
                color={g.color}
              />
            ))}
          </div>
        ) : mine ? (
          <p className="text-sm text-ink-soft">
            Sealed. {partner?.name ?? "Your person"} still has this one.
          </p>
        ) : (
          <p className="text-sm text-ink-soft">This quest is still waiting.</p>
        )}
      </section>

      {echoes.length ? (
        <section className="flex flex-col gap-2" aria-label="Lines on this quest">
          {echoes.map((e) => (
            <div
              key={e.id}
              className={`rounded-md border p-3.5 ${personTint(e.color)}`}
            >
              <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase text-ink-soft">
                <Avatar
                  avatar={e.avatar}
                  name={e.memberName}
                  color={e.color}
                  size={20}
                />
                {e.memberName}
              </span>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">{e.text}</p>
            </div>
          ))}
        </section>
      ) : null}

      {canInteract ? (
        <>
          <EchoForm dayId={lesson.id} />
          <QuestReplay dayId={lesson.id} />
        </>
      ) : (
        <Link href="/answer" className="btn btn-primary w-full">
          START
        </Link>
      )}

      <TabBar active="/journal" />
    </main>
  );
}

function Entry({
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
}) {
  return (
    <div className={`rounded-md border p-3.5 ${personTint(color ?? null)}`}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase text-ink-soft">
          <Avatar avatar={avatar} name={name} color={color} size={20} />
          {name}
        </span>
        {mood > 0 ? (
          <MoodFace value={mood} size={16} className="text-gold-deep" />
        ) : null}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-ink">{text}</p>
    </div>
  );
}
