import Link from "next/link";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/quiz", label: "开始测试" },
  { href: "/products", label: "小样套装" },
  { href: "/feedback", label: "反馈" },
];

export default function Header() {
  return (
    <header className="border-b border-cream-200 bg-cream-50/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-serif text-lg text-sage-600">
          ScentPersona
        </Link>
        <nav className="flex gap-3 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-stone-600 hover:text-sage-600 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
