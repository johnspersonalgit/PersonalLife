export const MOODS = [
  { value: 1, label: "Rough" },
  { value: 2, label: "Tough" },
  { value: 3, label: "Okay" },
  { value: 4, label: "Good" },
  { value: 5, label: "Golden" },
] as const;

export function MoodFace({
  value,
  size = 24,
  className = "",
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const mouths: Record<number, string> = {
    1: "M8 16.5c1-1.4 2.6-2 4-2s3 .6 4 2",
    2: "M8 15.8c1-.8 2.6-1.2 4-1.2s3 .4 4 1.2",
    3: "M8.5 15h7",
    4: "M8 14.2c1 .9 2.6 1.4 4 1.4s3-.5 4-1.4",
    5: "M8 13.6c1 1.3 2.6 2 4 2s3-.7 4-2",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="10" r="0.4" fill="currentColor" />
      <circle cx="15" cy="10" r="0.4" fill="currentColor" />
      <path d={mouths[value] ?? mouths[3]} />
    </svg>
  );
}
