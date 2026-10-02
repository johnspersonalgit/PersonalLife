import { redirect } from "next/navigation";
import { getNotes } from "@/lib/repo";
import { getPartner, getSessionMember } from "@/lib/session";
import { prettyTime } from "@/lib/time";
import { Avatar, personTint } from "@/components/avatar";
import { Ember } from "@/components/ember";
import { NoteComposer } from "@/components/note-composer";
import { TabBar } from "@/components/tab-bar";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const member = await getSessionMember();
  if (!member) redirect("/onboarding");
  const partner = getPartner(member);
  const notes = getNotes(member.coupleId);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-6 pb-28">
      <header className="mb-4">
        <h1 className="font-display text-3xl text-ink">Notes</h1>
        <p className="mt-1 text-sm text-ink-soft">
          For everything that does not fit a question. No reply needed.
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-3">
        {notes.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 p-6 text-center">
            <Ember mood="sleepy" size={112} />
            <p className="text-sm text-ink-soft">
              Nothing passed yet. The first note is the hardest.
            </p>
          </div>
        ) : (
          notes.map((n) => {
            const mine = n.memberId === member.id;
            return (
              <div
                key={n.id}
                className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
              >
                <div className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                  <Avatar avatar={n.avatar} name={n.memberName} color={n.color} size={28} />
                  <div
                    className={`max-w-[75%] rounded-lg border px-4 py-3 ${personTint(n.color)}`}
                  >
                    <p className="text-sm leading-relaxed text-ink">{n.text}</p>
                  </div>
                </div>
                <span className="mt-1 px-1 text-[10px] tracking-wide text-ink-soft">
                  {n.memberName} · {prettyTime(n.createdAt)}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="sticky bottom-20 mt-6">
        {partner ? (
          <NoteComposer partnerName={partner.name} />
        ) : (
          <div className="card p-4 text-sm text-ink-soft">
            Notes open once your person joins with your code.
          </div>
        )}
      </div>

      <TabBar active="/notes" />
    </main>
  );
}
