export type EmberMood = "happy" | "sleepy" | "celebrate" | "worried";

// Ember, the Hearth mascot: the streak flame, alive. Original vector art,
// brand palette only. Moods mirror the ritual state.
export function Ember({
  mood = "happy",
  size = 96,
  className = "",
}: {
  mood?: EmberMood;
  size?: number;
  className?: string;
}) {
  const anim =
    mood === "celebrate"
      ? "ember-hop 900ms ease-in-out infinite"
      : mood === "sleepy"
        ? "ember-sway 4s ease-in-out infinite"
        : "ember-float 3.2s ease-in-out infinite";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Ember, ${mood}`}
      className={className}
      style={{ animation: anim }}
    >
      {mood === "celebrate" ? (
        <g stroke="var(--color-gold)" strokeWidth={3} strokeLinecap="round">
          <path d="M18 30 l-6 -8" />
          <path d="M102 30 l6 -8" />
          <path d="M60 10 l0 -8" />
        </g>
      ) : null}

      <path
        d="M60 14 C 70 36, 97 46, 97 76 A 37 37 0 1 1 23 76 C 23 54, 43 42, 60 14 Z"
        fill="var(--color-flame)"
      />
      <path
        d="M60 44 C 66 58, 82 64, 82 82 A 22 22 0 1 1 38 82 C 38 66, 50 58, 60 44 Z"
        fill="var(--color-gold-soft)"
      />

      <ellipse cx="43" cy="82" rx="6" ry="3.4" fill="var(--color-flame-soft)" opacity={0.85} />
      <ellipse cx="77" cy="82" rx="6" ry="3.4" fill="var(--color-flame-soft)" opacity={0.85} />

      {mood === "sleepy" ? (
        <g
          stroke="var(--color-ink)"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        >
          <path d="M46 72 q4 4 8 0" />
          <path d="M66 72 q4 4 8 0" />
          <path d="M55 86 h10" />
        </g>
      ) : mood === "worried" ? (
        <g>
          <circle cx="50" cy="72" r="4.4" fill="var(--color-ink)" />
          <circle cx="70" cy="72" r="4.4" fill="var(--color-ink)" />
          <circle cx="51.6" cy="70.4" r="1.4" fill="#fffdf9" />
          <circle cx="71.6" cy="70.4" r="1.4" fill="#fffdf9" />
          <path
            d="M52 88 q4 -3 8 0 q4 3 8 0"
            stroke="var(--color-ink)"
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M86 52 q5 8 0 12 q-5 -4 0 -12"
            fill="var(--color-gold-soft)"
            stroke="var(--color-flame)"
            strokeWidth={1.5}
          />
        </g>
      ) : mood === "celebrate" ? (
        <g>
          <path
            d="M45 72 q5 -6 10 0"
            stroke="var(--color-ink)"
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M65 72 q5 -6 10 0"
            stroke="var(--color-ink)"
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M50 82 q10 10 20 0"
            stroke="var(--color-ink)"
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      ) : (
        <g>
          <circle cx="50" cy="72" r="4.2" fill="var(--color-ink)" />
          <circle cx="70" cy="72" r="4.2" fill="var(--color-ink)" />
          <circle cx="51.5" cy="70.5" r="1.3" fill="#fffdf9" />
          <circle cx="71.5" cy="70.5" r="1.3" fill="#fffdf9" />
          <path
            d="M52 83 q8 7 16 0"
            stroke="var(--color-ink)"
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      )}
    </svg>
  );
}
