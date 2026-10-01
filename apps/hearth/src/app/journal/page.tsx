import { redirect } from "next/navigation";
import { getRecentDays } from "@/lib/repo";
import { getPartner, getSessionMember } from "@/lib/session";
import { prettyDay } from "@/lib/time";
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
        <div className="card p-5 text-sm text-ink-soft">
          No entries yet. Answer today&rsquo;s question and the journal begins.
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
                  {theirs ? (
                    <Entry name={theirs.memberName} mood={theirs.mood} text={theirs.text} />
                  ) : null}
                  {mine ? (
                    <Entry name={mine.memberName} mood={mine.mood} text={mine.text} mine />
                  ) : null}
                </div>
              ) : d.answers.length ? (
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
        <MoodFace value={mood} size={16} className="text-gold-deep" />
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-ink">{text}</p>
    </div>
  );
}
