import Link from "next/link";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import {
  ensureDay,
  getStreak,
  unseenNudgesFor,
  weekStatus,
} from "@/lib/repo";
import { getPartner, getSessionMember } from "@/lib/session";
import { localDay } from "@/lib/time";
import { CountdownChip } from "@/components/countdown-chip";
import { StreakFlame } from "@/components/flame";
import { GearIcon, HeartIcon, SealIcon } from "@/components/icons";
import { MoodFace } from "@/components/mood-row";
import { NudgeButton } from "@/components/nudge-button";
import { NudgeCard } from "@/components/nudge-card";
import { TabBar } from "@/components/tab-bar";
import { WeekDots } from "@/components/week-dots";

export const dynamic = "force-dynamic";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function Home() {
  const member = await getSessionMember();
  if (!member) redirect("/onboarding");

  const partner = getPartner(member);
  const today = ensureDay(member.coupleId, localDay());
  const streak = getStreak(member.coupleId);
  const week = weekStatus(member.coupleId);
  const nudges = unseenNudgesFor(member.id, member.coupleId);

  const couple = db
    .prepare("SELECT code FROM couples WHERE id = ?")
    .get(member.coupleId) as { code: string };

  const myAnswer = today.answers.find((a) => a.memberId === member.id);
  const partnerAnswer = partner
    ? today.answers.find((a) => a.memberId === partner.id)
    : undefined;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 pt-6 pb-28">
      <header className="flex items-center justify-between">
        <span className="font-display text-2xl text-ink">Hearth</span>
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-cream hover:text-ink"
        >
          <GearIcon size={20} />
        </Link>
      </header>

      <div className="flex items-center gap-2">
        <span className="chip border-gold-soft bg-gold-soft/30 text-gold-deep">
          <StreakFlame size={14} lit={streak.current > 0} />
          <span className="font-mono text-xs">{streak.current}</span>
          day streak
        </span>
        <span className="chip">
          <HeartIcon size={12} />
          {streak.graceLeft ? "1 grace" : "grace used"}
        </span>
      </div>

      {nudges.map((n) => (
        <NudgeCard key={n.id} nudgeId={n.id} fromName={n.fromName} />
      ))}

      <section aria-labelledby="today-heading">
        <p className="text-sm text-ink-soft">
          {greeting()}, {member.name}.
        </p>
        <div className="card mt-2 flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <span className="chip">{today.category}</span>
            <span className="text-[10px] font-semibold tracking-widest uppercase text-ink-soft">
              Today&rsquo;s question
            </span>
          </div>
          <h1
            id="today-heading"
            className="font-display text-2xl leading-snug text-ink"
          >
            {today.prompt}
          </h1>

          {!partner ? (
            <div className="rounded-md border border-line bg-cream p-4 text-sm text-ink-soft">
              Your ritual is lit. Share the code{" "}
              <span className="font-mono font-semibold tracking-widest text-gold-deep">
                {couple.code}
              </span>{" "}
              so your person can join from her phone.
            </div>
          ) : !myAnswer ? (
            <div className="flex flex-col gap-3">
              {partnerAnswer ? (
                <>
                  <p className="text-sm text-ink">
                    <span className="font-semibold">{partner.name}</span> sealed
                    an answer. Yours unlocks it.
                  </p>
                  <CountdownChip />
                </>
              ) : (
                <p className="text-sm text-ink-soft">
                  Answer to see what {partner.name} wrote.
                </p>
              )}
              <Link href="/answer" className="btn btn-primary w-full">
                Answer today&rsquo;s question
              </Link>
            </div>
          ) : !partnerAnswer ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-md border border-line bg-cream p-4">
                <SealIcon size={18} className="shrink-0 text-gold-deep" />
                <p className="text-sm text-ink">
                  Sealed. Waiting on{" "}
                  <span className="font-semibold">{partner.name}</span> to
                  answer.
                </p>
              </div>
              <NudgeButton partnerName={partner.name} />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnswerBlock name={member.name} mood={myAnswer.mood} text={myAnswer.text} mine />
              <AnswerBlock name={partner.name} mood={partnerAnswer.mood} text={partnerAnswer.text} />
            </div>
          )}
        </div>
      </section>

      <section className="card p-4" aria-label="This week">
        <p className="mb-3 text-[10px] font-semibold tracking-widest uppercase text-ink-soft">
          This week
        </p>
        <WeekDots dots={week} />
      </section>

      {partner && !myAnswer ? null : partner ? (
        <Link href="/notes" className="btn btn-secondary w-full">
          Pass a note
        </Link>
      ) : null}

      <TabBar active="/" />
    </main>
  );
}

function AnswerBlock({
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
      className={`rounded-md border p-4 ${
        mine ? "border-gold-soft bg-gold-soft/15" : "border-line bg-cream"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest uppercase text-ink-soft">
          {name}
        </span>
        <MoodFace value={mood} size={18} className="text-gold-deep" />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink">{text}</p>
    </div>
  );
}
