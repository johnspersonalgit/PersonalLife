import { redirect } from "next/navigation";
import { getRecentDays } from "@/lib/repo";
import { getPartner, getSessionMember } from "@/lib/session";
import { prettyDay } from "@/lib/time";
import { Ember } from "@/components/ember";
import { MoodFace } from "@/components/mood-row";
import { TabBar } from "@/components/tab-bar";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const member = await getSessionMember();
  if (!member) redirect("/onboarding");
  const partner = getPartner(member);
  const days = getRecentDays(member.coupleId, 90);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 pt-6 pb-28">
      <header>
        <h1 className="font-display text-3xl text-ink">Journal</h1>
        <p className="mt-1 text-sm text-ink-soft">
          The record that writes itself, one day at a time.
        </p>
      </header>

      {days.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-6 text-center">
          <Ember mood="sleepy" size={64} />
          <p className="text-sm text-ink-soft">
            No entries yet. Answer today&rsquo;s question and the journal
            begins.
          </p>
        </div>
      ) : (
        days.map((d) => {
          const mine = d.answers.find((a) => a.memberId === member.id);
          const theirs = partner
            ? d.answers.find((a) => a.memberId === partner.id)
            : undefined;
          return (
            <article key={d.id} className="card flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold tracking-widest uppercase text-ink-soft">
                  {prettyDay(d.day)}
                </span>
                <span className="chip">{d.category}</span>
              </div>
              <p className="font-display text-lg leading-snug text-ink italic">
                {d.prompt}
              </p>
              {d.complete ? (
                <div className="flex flex-col gap-2">
                  {d.kind === "rapid" && mine && theirs ? (
                    <span
                      className={`chip self-start ${
                        mine.text === theirs.text
                          ? "border-gold bg-gold text-card"
                          : "border-flame-soft bg-flame-soft/40 text-flame-deep"
                      }`}
                    >
                      {mine.text === theirs.text
                        ? "You matched"
                        : "Opposite ends"}
                    </span>
                  ) : null}
                  {d.kind === "mission" ? (
                    <span className="chip self-start border-gold bg-gold text-card">
                      Mission complete
                    </span>
                  ) : null}
                  {theirs && theirs.text ? (
                    <Entry name={theirs.memberName} mood={theirs.mood} text={theirs.text} />
                  ) : null}
                  {mine && mine.text ? (
                    <Entry name={mine.memberName} mood={mine.mood} text={mine.text} mine />
                  ) : null}
                  {d.guesses.map((g) => (
                    <Entry
                      key={g.memberId}
                      name={`${g.memberName} guessed`}
                      mood={0}
                      text={g.text}
                    />
                  ))}
                </div>
              ) : d.answers.length || d.guesses.length ? (
                <p className="text-sm text-ink-soft">
                  One of you answered. The day stayed half open.
                </p>
              ) : (
                <p className="text-sm text-ink-soft">The flame rested this day.</p>
              )}
            </article>
          );
        })
      )}

      <TabBar active="/journal" />
    </main>
  );
}

function Entry({
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
      className={`rounded-md border p-3.5 ${
        mine ? "border-gold-soft bg-gold-soft/15" : "border-line bg-cream"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-ink-soft">
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
