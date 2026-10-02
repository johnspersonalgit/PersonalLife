import Link from "next/link";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import {
  ensureDay,
  ensureOpenLesson,
  getLessons,
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
import { QuestPath } from "@/components/quest-path";
import { TodayCard } from "@/components/today-card";

export const dynamic = "force-dynamic";

export default async function Home() {
  const member = await getSessionMember();
  if (!member) redirect("/onboarding");

  const partner = getPartner(member);
  const today = ensureDay(member.coupleId, localDay());
  const current = await ensureOpenLesson(member.coupleId, member.id);
  const lessons = getLessons(member.coupleId);
  const streak = getStreak(member.coupleId);
  const week = weekStatus(member.coupleId);
  const nudges = unseenNudgesFor(member.id, member.coupleId);

  const couple = db
    .prepare("SELECT code FROM couples WHERE id = ?")
    .get(member.coupleId) as { code: string };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col pb-28">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b-[3px] border-ink bg-paper/95 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="chip border-ink bg-flame text-card">
            <StreakFlame size={14} lit={streak.current > 0} />
            <span className="font-mono text-xs">{streak.current}</span>
          </span>
          <span className="chip">
            <HeartIcon size={12} />
            {streak.graceLeft ? 1 : 0}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center -space-x-2">
            <Avatar
              avatar={member.avatar}
              name={member.name}
              color={member.color}
              size={32}
            />
            {partner ? (
              <Avatar
                avatar={partner.avatar}
                name={partner.name}
                color={partner.color}
                size={32}
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

      {nudges.map((n) => (
        <div key={n.id} className="px-4 pt-3">
          <NudgeCard nudgeId={n.id} fromName={n.fromName} />
        </div>
      ))}

      <QuestPath
        today={today}
        current={current}
        lessons={lessons}
        week={week}
        member={member}
        partner={partner}
        coupleCode={couple.code}
      />

      {today.complete ? (
        <div className="px-5">
          <TodayCard
            today={today}
            member={member}
            partner={partner}
            coupleCode={couple.code}
          />
        </div>
      ) : null}

      <div className="px-5 pt-4">
        <PushOptIn vapidKey={process.env.HEARTH_VAPID_PUBLIC ?? null} />
      </div>

      <TabBar active="/" />
    </main>
  );
}
