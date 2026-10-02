import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-3xl text-ink">Nothing here.</p>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
        This page does not exist. The ritual is one tap away.
      </p>
      <Link href="/" className="btn btn-primary mt-8">
        Back to today
      </Link>
    </main>
  );
}
