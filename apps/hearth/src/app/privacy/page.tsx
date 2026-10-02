import Link from "next/link";
import { Ember } from "@/components/ember";

export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 pt-8 pb-12">
      <Ember mood="happy" size={88} />
      <h1 className="font-display text-4xl text-ink">Privacy</h1>
      <p className="text-sm leading-relaxed text-ink-soft">
        Hearth is a private ritual for two people. It is not a social network
        and it does not sell data.
      </p>
      <section className="card flex flex-col gap-3 p-5">
        <h2 className="font-display text-xl text-ink">What we store</h2>
        <p className="text-sm leading-relaxed text-ink">
          Your names, avatar picks, hashed PINs, answers, guesses, notes,
          nudges, reminder time, and (if you turn them on) a push subscription
          so the evening nudge can find your phone.
        </p>
      </section>
      <section className="card flex flex-col gap-3 p-5">
        <h2 className="font-display text-xl text-ink">Where it lives</h2>
        <p className="text-sm leading-relaxed text-ink">
          On the Hearth server we host for this household. Not in ads. Not in
          analytics. Not sold, rented, or shared with anyone else.
        </p>
      </section>
      <section className="card flex flex-col gap-3 p-5">
        <h2 className="font-display text-xl text-ink">Who can see it</h2>
        <p className="text-sm leading-relaxed text-ink">
          The two of you. Answers stay sealed until both of you have done the
          day. PINs keep seats from swapping on a shared phone.
        </p>
      </section>
      <section className="card flex flex-col gap-3 p-5">
        <h2 className="font-display text-xl text-ink">Deleting it</h2>
        <p className="text-sm leading-relaxed text-ink">
          Ask and the ritual can be wiped. There is no public profile and no
          account marketplace.
        </p>
      </section>
      <p className="text-xs text-ink-soft">Last updated October 2, 2026.</p>
      <Link href="/install" className="btn btn-secondary">
        Back to install
      </Link>
    </main>
  );
}
