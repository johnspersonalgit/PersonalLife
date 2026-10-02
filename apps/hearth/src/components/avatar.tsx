export const AVATARS = [
  { id: "ember", label: "Ember", src: "/avatars/ember.png" },
  { id: "bear", label: "Bear", src: "/avatars/bear.jpg" },
  { id: "rabbit", label: "Rabbit", src: "/avatars/rabbit.jpg" },
  { id: "fox", label: "Fox", src: "/avatars/fox.jpg" },
  { id: "deer", label: "Deer", src: "/avatars/deer.jpg" },
] as const;

export function personTint(color: string | null | undefined): string {
  if (color === "blue") return "border-blue-soft bg-blue-soft/40";
  if (color === "rose") return "border-rose-soft bg-rose-soft/40";
  return "border-line bg-cream";
}

function personRing(color: string | null | undefined): string {
  if (color === "blue") return "border-blue";
  if (color === "rose") return "border-rose";
  return "border-line";
}

export function Avatar({
  avatar,
  name,
  size = 28,
  color = null,
}: {
  avatar: string | null;
  name: string;
  size?: number;
  color?: string | null;
}) {
  const found = AVATARS.find((a) => a.id === avatar);
  const ring = personRing(color);
  if (found) {
    return (
      <span
        className={`inline-block shrink-0 overflow-hidden rounded-full border-2 ${ring}`}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={found.src}
          alt={`${name}'s avatar`}
          width={size}
          height={size}
          className="object-cover"
        />
      </span>
    );
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 ${ring} bg-gold-soft/40 font-semibold text-gold-deep`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      aria-hidden="true"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
