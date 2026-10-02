import { redirect } from "next/navigation";
import {
  getStreak,
  weekStatus,
  MILESTONES,
  MILESTONE_NAMES,
} from "@/lib/repo";
import { getSessionMember } from "@/lib/session";
import { Ember } from "@/components/ember";
import { CheckIcon, LockIcon } from "@/components/icons";
import { TabBar } from "@/components/tab-bar";
import { WeekDots } from "@/components/week-dots";

export const dynamic = "force-dynamic";

export default async function StreakPage() {
  const member = await getSessionMember();
  if (!member) redirect("/onboarding");
  const streak = getStreak(member.coupleId);
  const week = weekStatus(member.coupleId);

  const nextMilestone =
    MILESTONES.find((m) => m > streak.current) ?? MILESTONES[MILESTONES.length - 1];
  const prevMilestone =
    [...MILESTONES].reverse().find((m) => m <= streak.current) ?? 0;
  const span = nextMilestone - prevMilestone;
  const progress = Math.min(
    1,
    span > 0 ? (streak.current - prevMilestone) / span : 1,
  );

  const R = 84;
  const C = 2 * Math.PI * R;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 pt-6 pb-28">
      <section className="card flex flex-col items-center px-5 py-8 text-center">
        <div className="relative flex items-center justify-center">
          <svg width={200} height={200} viewBox="0 0 200 200" aria-hidden="true">
            <circle
              cx="100"
              cy="100"
              r={R}
              fill="none"
              stroke="var(--color-line)"
              strokeWidth="6"
            />
            <circle
              cx="100"
              cy="100"
              r={R}
              fill="none"
              stroke="var(--color-gold)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
              transform="rotate(-90 100 100)"
            />
          </svg>
          <div className="absolute">
            <Ember mood={streak.current > 0 ? "happy" : "sleepy"} size={132} />
          </div>
        </div>

        <p className="mt-4 font-display text-6xl leading-none text-ink">
          {streak.current}
        </p>
        <h1 className="mt-1 font-display text-2xl text-ink">Day Streak</h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
          {streak.current === 0
            ? "Both of you answer today, and the flame lights."
            : `Keep it lit. Both answer, every day. Best so far: ${streak.best}.`}
        </p>
        <p className="mt-3 text-xs font-medium text-gold-deep">
          {streak.graceLeft
            ? "One grace day rests in the hearth if life happens."
            : streak.todayComplete
              ? "Grace is spent, and you both showed up today. The flame is safe."
              : "Grace is spent. Both answers today keep the flame alive."}
        </p>
      </section>

      <section className="card p-4" aria-label="This week">
        <p className="mb-3 text-[10px] font-semibold tracking-widest uppercase text-ink-soft">
          This week
        </p>
        <WeekDots dots={week} />
      </section>

      <section aria-labelledby="milestones-heading">
        <h2
          id="milestones-heading"
          className="mb-3 text-[10px] font-semibold tracking-widest uppercase text-ink-soft"
        >
          Milestones
        </h2>
        <div className="flex flex-col gap-2.5">
          {MILESTONES.map((m) => {
            const reached = streak.current >= m || streak.best >= m;
            return (
              <div
                key={m}
                className={`card flex items-center gap-4 px-4 py-3.5 ${
                  reached ? "border-gold-soft" : ""
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                    reached
                      ? "border-gold bg-gold text-card"
                      : "border-line bg-cream text-ink-soft"
                  }`}
                >
                  {reached ? <CheckIcon size={16} /> : <LockIcon size={15} />}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {MILESTONE_NAMES[m]}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {reached ? `${m} days, reached` : `Unlocks at ${m} days`}
                  </p>
                </div>
                <span className="font-mono text-sm text-gold-deep">{m}</span>
              </div>
            );
          })}
        </div>
      </section>

      <TabBar active="/streak" />
    </main>
  );
}
