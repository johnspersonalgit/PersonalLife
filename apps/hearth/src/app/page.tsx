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
import { localDay } from "@/lib/today";
import { Avatar } from "@/components/avatar";
import { StreakFlame } from "@/components/flame";
import { GearIcon, HeartIcon } from "@/components/icons";
import { NudgeCard } from "@/components/nudge-card";
import { PushOptIn } from "@/components/push-opt-in";
import { TabBar } from "@/components/tab-bar";
import { TodayCard } from "@/components/today-card";
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

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 pt-6 pb-28">
      <header className="flex items-center justify-between">
        <span className="font-display text-2xl text-ink">Hearth</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center -space-x-2">
            <Avatar
              avatar={member.avatar}
              name={member.name}
              color={member.color}
              size={36}
            />
            {partner ? (
              <Avatar
                avatar={partner.avatar}
                name={partner.name}
                color={partner.color}
                size={36}
              />
            ) : null}
          </div>
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-cream hover:text-ink"
          >
            <GearIcon size={20} />
          </Link>
        </div>
      </header>

      <div className="flex items-center gap-2">
        <span className="chip border-ink bg-flame text-card">
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

      <PushOptIn vapidKey={process.env.HEARTH_VAPID_PUBLIC ?? null} />

      <section aria-labelledby="today-heading">
        <p className="font-display text-lg text-ink">
          {greeting()}, {member.name}.
        </p>
        <TodayCard
          today={today}
          member={member}
          partner={partner}
          coupleCode={couple.code}
        />
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
