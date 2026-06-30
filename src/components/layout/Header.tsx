import Link from "next/link";
import { getLocale } from "@/lib/i18n/server";
import LanguageToggle from "@/lib/i18n/LanguageToggle";
import type { Locale } from "@/lib/scoring/types";

const navItems: { href: string; label: Record<Locale, string> }[] = [
  { href: "/", label: { zh: "首页", en: "Home" } },
  { href: "/quiz", label: { zh: "开始测试", en: "Take Quiz" } },
  { href: "/products", label: { zh: "小样套装", en: "Sample Kits" } },
  { href: "/search", label: { zh: "比价", en: "Compare" } },
  { href: "/feedback", label: { zh: "反馈", en: "Feedback" } },
];

export default function Header() {
  const locale = getLocale();
  return (
    <header className="border-b border-cream-200 bg-cream-50/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="font-serif text-lg text-sage-600 shrink-0">
          ScentPersona
        </Link>
        <nav className="flex gap-3 text-sm items-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-stone-600 hover:text-sage-600 transition-colors"
            >
              {item.label[locale]}
            </Link>
          ))}
          <LanguageToggle className="ml-1 pl-2 border-l border-cream-200" />
        </nav>
      </div>
    </header>
  );
}
