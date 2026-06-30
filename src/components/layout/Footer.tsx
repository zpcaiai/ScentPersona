import Link from "next/link";
import { getLocale } from "@/lib/i18n/server";

const COPY = {
  zh: {
    tagline: "ScentPersona · 先测，再闻，找到你的本命香。",
    disclaimer: "本测试仅供参考娱乐，不构成医疗或心理建议。",
    privacy: "隐私政策",
    dataDeletion: "数据删除",
  },
  en: {
    tagline: "ScentPersona · Test first, then smell — find your signature scent.",
    disclaimer:
      "This quiz is for reference and entertainment only and is not medical or psychological advice.",
    privacy: "Privacy Policy",
    dataDeletion: "Data Deletion",
  },
} as const;

export default function Footer() {
  const t = COPY[getLocale()];
  return (
    <footer className="border-t border-cream-200 mt-auto">
      <div className="mx-auto max-w-2xl px-4 py-6 text-center text-xs text-stone-400">
        <p>{t.tagline}</p>
        <p className="mt-1">{t.disclaimer}</p>
        <div className="mt-3 flex justify-center gap-4">
          <Link href="/privacy" className="hover:text-sage-600">
            {t.privacy}
          </Link>
          <Link href="/data-deletion" className="hover:text-sage-600">
            {t.dataDeletion}
          </Link>
        </div>
      </div>
    </footer>
  );
}
