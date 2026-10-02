"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-3xl text-ink">The flame flickered.</p>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
        Something went wrong on our side. Your answers are safe.
      </p>
      <button onClick={reset} className="btn btn-primary mt-8">
        Try again
      </button>
    </main>
  );
}
