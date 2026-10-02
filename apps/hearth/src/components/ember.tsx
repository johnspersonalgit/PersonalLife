export type EmberMood = "happy" | "sleepy" | "celebrate" | "worried";

const MOOD_ANIM: Record<EmberMood, string> = {
  happy: "ember-float 2.8s ease-in-out infinite",
  sleepy: "ember-sway 4s ease-in-out infinite",
  celebrate: "ember-hop 800ms ease-in-out infinite",
  worried: "ember-wiggle 700ms ease-in-out infinite",
};

export function Ember({
  mood = "happy",
  size = 96,
  className = "",
}: {
  mood?: EmberMood;
  size?: number;
  className?: string;
}) {
  const face = size < 80;
  switch (mood) {
    case "happy":
    case "sleepy":
    case "celebrate":
    case "worried":
      break;
    default: {
      const _exhaustive: never = mood;
      return _exhaustive;
    }
  }

  return (
    <span
      className={`inline-flex shrink-0 items-end justify-center ${className}`}
      style={{ width: size, height: size, animation: MOOD_ANIM[mood] }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ember.png"
        alt={`Ember, ${mood}`}
        width={size}
        height={size}
        className={face ? "h-full w-full object-cover object-[50%_22%]" : "h-full w-full object-contain"}
      />
    </span>
  );
}
