import Link from "next/link";
import { Ember } from "@/components/ember";

export const dynamic = "force-dynamic";

export default function InstallPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 pt-8 pb-12">
      <Ember mood="celebrate" size={140} />
      <h1 className="font-display text-4xl text-ink">Put Hearth on both phones</h1>
      <p className="text-sm leading-relaxed text-ink-soft">
        This is the path for John and Ariana tonight. It is a real Home Screen
        app. The App Store / TestFlight build is packed and waiting on one
        Apple key.
      </p>

      <section className="card flex flex-col gap-3 p-5">
        <p className="chip self-start bg-flame text-card">Tonight</p>
        <h2 className="font-display text-2xl text-ink">Add to Home Screen</h2>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed text-ink">
          <li>Open this site in Safari on the iPhone, not Chrome.</li>
          <li>Tap the Share button at the bottom.</li>
          <li>Tap Add to Home Screen.</li>
          <li>Keep the name Hearth. Tap Add.</li>
        </ol>
        <p className="text-sm text-ink-soft">
          Ember becomes the icon. Open it from the Home Screen like any other
          app. Do this on both phones.
        </p>
        <Link href="/" className="btn btn-primary w-full">
          Open Hearth
        </Link>
      </section>

      <section className="card flex flex-col gap-3 p-5">
        <p className="chip self-start">App Store lane</p>
        <h2 className="font-display text-2xl text-ink">TestFlight next</h2>
        <p className="text-sm leading-relaxed text-ink">
          Bundle ID is <span className="font-mono">com.willette.hearth</span>.
          The iOS shell, Ember icon, privacy page, and upload workflow are in
          the repo. The leftover bind is an App Store Connect API key on the
          PersonalLife GitHub secrets. After that, TestFlight invites go to
          both of you.
        </p>
        <Link href="/privacy" className="btn btn-secondary w-full">
          Read privacy
        </Link>
      </section>
    </main>
  );
}
