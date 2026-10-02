"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  claimSeat,
  createRitual,
  joinRitual,
  lookupRitual,
} from "@/lib/actions";
import { CheckIcon, CopyIcon } from "./icons";

const CATEGORIES = [
  { id: "us", name: "Us", blurb: "Closeness, appreciation, the two of you." },
  { id: "heard", name: "Heard", blurb: "What landed, what did not, small repairs." },
  { id: "load", name: "Load", blurb: "Who is carrying what, and noticing." },
  { id: "gratitude", name: "Gratitude", blurb: "Small ordinary things worth saying." },
  { id: "dreams", name: "Dreams", blurb: "Trips, traditions, the someday list." },
  { id: "play", name: "Play", blurb: "Light questions for heavy weeks." },
];

type Step = "welcome" | "name" | "categories" | "code" | "join";

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("");
  const [categories, setCategories] = useState<string[]>(
    CATEGORIES.map((c) => c.id),
  );
  const [code, setCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinPhase, setJoinPhase] = useState<"code" | "name" | "seat">("code");
  const [seats, setSeats] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const stepIndex = { welcome: 0, name: 1, categories: 2, code: 3, join: 1 }[
    step
  ];

  return (
    <main className="flex min-h-dvh flex-col px-6 py-8">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i <= stepIndex ? "w-6 bg-gold" : "w-1.5 bg-line"
              }`}
            />
          ))}
        </div>

        {step === "welcome" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="font-display text-5xl text-ink">Hearth</p>
            <p className="mt-3 font-display text-xl text-gold-deep italic">
              Two people. One small ritual.
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
              One question a day, sealed until you both answer. A shared streak
              that keeps the flame lit through the busiest weeks.
            </p>
            <button
              className="btn btn-primary mt-10 w-full max-w-xs"
              onClick={() => setStep("name")}
            >
              Get started
            </button>
            <button
              className="btn btn-secondary mt-3 w-full max-w-xs"
              onClick={() => setStep("join")}
            >
              I have a code
            </button>
          </div>
        )}

        {step === "name" && (
          <div className="flex flex-1 flex-col justify-center">
            <h1 className="font-display text-3xl text-ink">First, you.</h1>
            <p className="mt-2 text-sm text-ink-soft">
              The name your person will see beside your answers.
            </p>
            <input
              className="input mt-6"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={40}
              autoFocus
            />
            <button
              className="btn btn-primary mt-6"
              disabled={!name.trim() || pending}
              onClick={() => setStep("categories")}
            >
              Continue
            </button>
          </div>
        )}

        {step === "categories" && (
          <div className="flex flex-1 flex-col justify-center">
            <h1 className="font-display text-3xl text-ink">
              What should your ritual touch on?
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              Choose one or more. You can change this later.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              {CATEGORIES.map((c) => {
                const on = categories.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setCategories((prev) =>
                        on
                          ? prev.filter((x) => x !== c.id)
                          : [...prev, c.id],
                      )
                    }
                    className={`card flex items-center justify-between px-4 py-3 text-left transition-colors ${
                      on ? "border-gold bg-gold-soft/20" : ""
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-ink">
                        {c.name}
                      </span>
                      <span className="block text-xs text-ink-soft">
                        {c.blurb}
                      </span>
                    </span>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                        on
                          ? "border-gold bg-gold text-card"
                          : "border-line bg-card text-transparent"
                      }`}
                    >
                      <CheckIcon size={13} />
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              className="btn btn-primary mt-6"
              disabled={!categories.length || pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await createRitual(name, categories);
                  setCode(res.code);
                  setStep("code");
                })
              }
            >
              {pending ? "Lighting..." : "Light the flame"}
            </button>
          </div>
        )}

        {step === "code" && code && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <h1 className="font-display text-3xl text-ink">
              Invite your person.
            </h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
              She opens Hearth, taps &ldquo;I have a code&rdquo;, and enters
              this. Then the ritual begins.
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(code);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
              className="card mt-8 flex items-center gap-3 px-8 py-5"
              aria-label="Copy invite code"
            >
              <span className="font-mono text-4xl tracking-[0.3em] text-gold-deep">
                {code}
              </span>
              <CopyIcon size={18} className="text-ink-soft" />
            </button>
            <p className="mt-2 h-4 text-xs font-medium text-sage">
              {copied ? "Copied." : ""}
            </p>
            <button
              className="btn btn-primary mt-8 w-full max-w-xs"
              onClick={() => router.push("/")}
            >
              Enter Hearth
            </button>
          </div>
        )}

        {step === "join" && (
          <div className="flex flex-1 flex-col justify-center">
            <h1 className="font-display text-3xl text-ink">Join the ritual.</h1>

            {joinPhase === "code" && (
              <>
                <p className="mt-2 text-sm text-ink-soft">
                  Enter the six-letter code your person sent you.
                </p>
                <input
                  className="input mt-6 font-mono text-2xl tracking-[0.3em] uppercase"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder="CODE"
                  maxLength={6}
                  autoFocus
                />
                {error ? (
                  <p role="alert" className="mt-3 text-sm font-medium text-crit">
                    {error}
                  </p>
                ) : null}
                <button
                  className="btn btn-primary mt-6"
                  disabled={joinCode.trim().length !== 6 || pending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await lookupRitual(joinCode);
                      if ("error" in res) {
                        setError(res.error);
                      } else if (res.status === "full") {
                        setSeats(res.members);
                        setJoinPhase("seat");
                      } else {
                        setJoinPhase("name");
                      }
                    })
                  }
                >
                  {pending ? "Checking..." : "Continue"}
                </button>
              </>
            )}

            {joinPhase === "name" && (
              <>
                <p className="mt-2 text-sm text-ink-soft">
                  One seat left. Claim it with your name.
                </p>
                <input
                  className="input mt-6"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={40}
                  autoFocus
                />
                {error ? (
                  <p role="alert" className="mt-3 text-sm font-medium text-crit">
                    {error}
                  </p>
                ) : null}
                <button
                  className="btn btn-primary mt-6"
                  disabled={!name.trim() || pending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await joinRitual(joinCode, name);
                      if ("error" in res) {
                        setError(res.error);
                      } else {
                        router.push("/");
                      }
                    })
                  }
                >
                  {pending ? "Joining..." : "Join"}
                </button>
              </>
            )}

            {joinPhase === "seat" && (
              <>
                <p className="mt-2 text-sm text-ink-soft">
                  This ritual has its two people. Reconnect this device as one
                  of them.
                </p>
                <div className="mt-6 flex flex-col gap-2.5">
                  {seats.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const res = await claimSeat(joinCode, s.id);
                          if ("error" in res) {
                            setError(res.error);
                          } else {
                            router.push("/");
                          }
                        })
                      }
                      className="card flex items-center justify-between px-4 py-4 text-left transition-colors hover:border-gold"
                    >
                      <span className="text-sm font-semibold text-ink">
                        {s.name}
                      </span>
                      <span className="text-xs font-medium text-gold-deep">
                        This is me
                      </span>
                    </button>
                  ))}
                </div>
                {error ? (
                  <p role="alert" className="mt-3 text-sm font-medium text-crit">
                    {error}
                  </p>
                ) : null}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
