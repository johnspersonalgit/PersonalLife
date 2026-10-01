import Link from "next/link";
import { BookIcon, FlameIcon, HomeIcon, NoteIcon } from "./icons";

const TABS = [
  { href: "/", label: "Today", icon: HomeIcon },
  { href: "/journal", label: "Journal", icon: BookIcon },
  { href: "/notes", label: "Notes", icon: NoteIcon },
  { href: "/streak", label: "Streak", icon: FlameIcon },
];

export function TabBar({ active }: { active: string }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between px-6">
        {TABS.map((t) => {
          const isActive = active === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center gap-1 px-3 py-2.5 text-[10px] font-semibold tracking-widest uppercase transition-colors ${
                isActive ? "text-gold-deep" : "text-ink-soft hover:text-ink"
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
