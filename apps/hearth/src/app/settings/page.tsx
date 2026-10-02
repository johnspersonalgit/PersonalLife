import Link from "next/link";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { signOut, switchProfile, updateProfile } from "@/lib/actions";
import { getPartner, getSessionMember } from "@/lib/session";
import { Avatar } from "@/components/avatar";
import { BackIcon } from "@/components/icons";
import {
  AvatarPanel,
  CategoryPanel,
  PinPanel,
} from "@/components/settings-panels";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const member = await getSessionMember();
  if (!member) redirect("/onboarding");
  const partner = getPartner(member);
  const couple = db
    .prepare("SELECT code, categories FROM couples WHERE id = ?")
    .get(member.coupleId) as { code: string; categories: string };
  const categories = JSON.parse(couple.categories) as string[];

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 pt-6 pb-10">
      <header className="flex items-center gap-2">
        <Link
          href="/"
          aria-label="Back to today"
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-cream hover:text-ink"
        >
          <BackIcon size={20} />
        </Link>
        <h1 className="font-display text-3xl text-ink">Settings</h1>
      </header>

      <section className="card flex flex-col gap-4 p-5" aria-labelledby="you-heading">
        <h2
          id="you-heading"
          className="text-[10px] font-semibold tracking-widest uppercase text-ink-soft"
        >
          You
        </h2>
        <div className="flex items-center gap-3">
          <Avatar
            avatar={member.avatar}
            name={member.name}
            color={member.color}
            size={48}
          />
          <p className="text-sm text-ink-soft">
            {member.color === "rose" ? "Rose seat" : "Blue seat"}
          </p>
        </div>
        <form action={updateProfile} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink-soft">Your name</span>
            <input
              className="input"
              name="name"
              defaultValue={member.name}
              maxLength={40}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink-soft">
              Daily reminder
            </span>
            <input
              className="input"
              name="reminder"
              type="time"
              defaultValue={member.reminderTime}
            />
          </label>
          <button type="submit" className="btn btn-primary self-start">
            Save
          </button>
        </form>
      </section>

      <section className="card flex flex-col gap-3 p-5" aria-labelledby="us-heading">
        <h2
          id="us-heading"
          className="text-[10px] font-semibold tracking-widest uppercase text-ink-soft"
        >
          The two of you
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-soft">Partner</span>
          {partner ? (
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Avatar
                avatar={partner.avatar}
                name={partner.name}
                color={partner.color}
                size={28}
              />
              {partner.name}
            </span>
          ) : (
            <span className="text-sm font-semibold text-ink">Not joined yet</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-soft">Invite code</span>
          <span className="font-mono text-lg tracking-[0.25em] text-gold-deep">
            {couple.code}
          </span>
        </div>
      </section>

      <section className="card flex flex-col gap-3 p-5" aria-labelledby="avatar-heading">
        <h2
          id="avatar-heading"
          className="text-[10px] font-semibold tracking-widest uppercase text-ink-soft"
        >
          Your avatar
        </h2>
        <AvatarPanel current={member.avatar} />
      </section>

      <section className="card flex flex-col gap-3 p-5" aria-labelledby="pin-heading">
        <h2
          id="pin-heading"
          className="text-[10px] font-semibold tracking-widest uppercase text-ink-soft"
        >
          Your PIN
        </h2>
        <PinPanel />
      </section>

      <section className="card flex flex-col gap-3 p-5" aria-labelledby="ritual-heading">
        <h2
          id="ritual-heading"
          className="text-[10px] font-semibold tracking-widest uppercase text-ink-soft"
        >
          Ritual topics
        </h2>
        <CategoryPanel initial={categories} />
      </section>

      <section className="card flex flex-col gap-3 p-5" aria-labelledby="device-heading">
        <h2
          id="device-heading"
          className="text-[10px] font-semibold tracking-widest uppercase text-ink-soft"
        >
          This device
        </h2>
        {partner ? (
          <form action={switchProfile}>
            <button type="submit" className="btn btn-secondary w-full">
              Switch to {partner.name} (same device)
            </button>
          </form>
        ) : null}
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-md px-4 py-2 text-sm font-medium text-crit transition-colors hover:bg-cream"
          >
            Sign out of this device
          </button>
        </form>
      </section>
    </main>
  );
}
