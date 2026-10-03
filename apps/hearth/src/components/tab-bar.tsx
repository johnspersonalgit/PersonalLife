import Link from "next/link";
import { FlameIcon, HeartIcon, HomeIcon } from "./icons";

const TABS = [
  { href: "/", label: "Path", icon: HomeIcon },
  { href: "/journal", label: "Us", icon: HeartIcon },
  { href: "/streak", label: "Flame", icon: FlameIcon },
];

export function TabBar({ active }: { active: string }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-card"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between px-10">
        {TABS.map((t) => {
          const isActive = active === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 text-[11px] font-bold transition-colors ${
                isActive ? "text-flame" : "text-ink-soft hover:text-ink"
              }`}
            >
              <t.icon size={22} />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}