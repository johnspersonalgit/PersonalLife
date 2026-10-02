export function JuiceStats({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <div className="mt-6 grid w-full max-w-xs grid-cols-3 gap-2">
      {items.map((item) => (
        <div key={item.label} className="card px-2 py-3">
          <p className="font-display text-xl leading-none text-ink">{item.value}</p>
          <p className="mt-1 text-[10px] font-extrabold tracking-[0.14em] text-ink-soft uppercase">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}