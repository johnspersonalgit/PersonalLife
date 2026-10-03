import Link from "next/link";
import { redirect } from "next/navigation";
import { getNotes, getRecentDays } from "@/lib/repo";
import { journalThreads } from "@/lib/journal";
import { getPartner, getSessionMember } from "@/lib/session";
import { prettyDay } from "@/lib/time";
import { Avatar, personTint } from "@/components/avatar";
import { Ember } from "@/components/ember";
import { MoodFace } from "@/components/mood-row";
import { NoteComposer } from "@/components/note-composer";
import { TabBar } from "@/components/tab-bar";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const member = await getSessionMember();
  if (!member) redirect("/onboarding");
  const partner = getPartner(member);
  const threads = journalThreads(getRecentDays(member.coupleId, 90));
  const notes = getNotes(member.coupleId, 6);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 pt-6 pb-28">
      <header>
        <h1 className="font-display text-3xl text-ink">Us</h1>
        <p className="mt-1 text-sm text-ink-soft">What you two have said.</p>
      </header>

      {threads.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-6 text-center">
          <Ember mood="sleepy" size={112} />
          <p className="text-sm text-ink-soft">
            Nothing here yet. Answer today&rsquo;s question first.
          </p>
        </div>
      ) : (
        threads.map((thread) => {
          const root = thread.root;
          const mine = root?.answers.find((a) => a.memberId === member.id);
          const theirs = partner
            ? root?.answers.find((a) => a.memberId === partner.id)
            : undefined;
          return (
            <article key={thread.day} className="card flex flex-col gap-3 p-5">
              {root ? (
                <Link
                  href={`/quest/${root.id}`}
                  className="contents"
                  data-quest-link={root.complete ? "done" : "open"}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-ink-soft">
                      {prettyDay(root.day)}
                    </span>
                  </div>
                  <p className="font-display text-xl leading-snug text-ink">
                    {root.prompt}
                  </p>
                  {root.complete ? (
                    <div className="flex flex-col gap-2">
                      {theirs && theirs.text ? (
                        <Entry
                          name={theirs.memberName}
                          mood={theirs.mood}
                          text={theirs.text}
                          avatar={theirs.avatar}
                          color={theirs.color}
                        />
                      ) : null}
                      {mine && mine.text ? (
                        <Entry
                          name={mine.memberName}
                          mood={mine.mood}
                          text={mine.text}
                          avatar={mine.avatar}
                          color={mine.color}
                        />
                      ) : null}
                    </div>
                  ) : root.answers.length ? (
                    <p className="text-sm text-ink-soft">
                      Sealed. Waiting on {partner?.name ?? "your person"}.
                    </p>
                  ) : (
                    <p className="text-sm text-ink-soft">No answers this day.</p>
                  )}
                </Link>
              ) : (
                <p className="text-[10px] font-semibold tracking-widest uppercase text-ink-soft">
                  {prettyDay(thread.day)}
                </p>
              )}

              {thread.layers.length ? (
                <div className="flex flex-col gap-2 border-t border-ink/15 pt-3">
                  {thread.layers.map((layer) => (
                    <Link
                      key={layer.id}
                      href={`/quest/${layer.id}`}
                      className="rounded-md border border-ink/20 px-3 py-2"
                      data-quest-link={layer.complete ? "done" : "open"}
                      data-thread-layer={layer.depth}
                    >
                      <p className="text-sm leading-snug text-ink">
                        {layer.prompt}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })
      )}

      <section className="flex flex-col gap-3 pt-2" id="line" aria-label="Leave a line">
        <h2 className="text-[10px] font-semibold tracking-widest uppercase text-ink-soft">
          Leave a line
        </h2>
        {notes.map((n) => {
          const mine = n.memberId === member.id;
          return (
            <div
              key={n.id}
              className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
            >
              <div
                className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}
              >
                <Avatar
                  avatar={n.avatar}
                  name={n.memberName}
                  color={n.color}
                  size={28}
                />
                <div
                  className={`max-w-[75%] rounded-lg border px-4 py-3 ${personTint(n.color)}`}
                >
                  <p className="text-sm leading-relaxed text-ink">{n.text}</p>
                </div>
              </div>
            </div>
          );
        })}
        {partner ? (
          <NoteComposer partnerName={partner.name} />
        ) : (
          <p className="text-sm text-ink-soft">
            A line opens once your person joins with your code.
          </p>
        )}
      </section>

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