export function StreakFlame({
  size = 28,
  lit = true,
  className = "",
}: {
  size?: number;
  lit?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
        fill={lit ? "var(--color-flame)" : "var(--color-line)"}
      />
      <path
        d="M12 21a4.5 4.5 0 0 1-4.5-4.5c0-1.8.9-2.9 1.7-3.9.5 1 1.3 1.6 1.3 1.6-.3-2.2.3-4.4 1.5-6.2 2 1.5 4.5 4.2 4.5 8A4.5 4.5 0 0 1 12 21z"
        fill={lit ? "var(--color-gold-soft)" : "var(--color-cream)"}
        opacity={lit ? 0.95 : 0.6}
      />
    </svg>
  );
}

export function HeroFlame({ size = 160 }: { size?: number }) {
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, var(--color-flame-soft) 0%, transparent 65%)",
        }}
      />
      <div style={{ animation: "flame-pulse 2.4s ease-in-out infinite" }}>
        <StreakFlame size={size * 0.72} lit />
      </div>
    </div>
  );
}
