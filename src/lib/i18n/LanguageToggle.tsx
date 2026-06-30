"use client";

import { useLang } from "./LangProvider";

/**
 * 中文 | EN language switch. Default locale is zh.
 */
export default function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLang();

  return (
    <div
      className={`inline-flex items-center gap-1 text-xs ${className}`}
      role="group"
      aria-label="Language / 语言"
    >
      <button
        type="button"
        onClick={() => setLocale("zh")}
        aria-pressed={locale === "zh"}
        className={
          locale === "zh"
            ? "text-sage-600 font-medium"
            : "text-stone-400 hover:text-sage-600 transition-colors"
        }
      >
        中文
      </button>
      <span className="text-stone-300" aria-hidden="true">
        |
      </span>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={
          locale === "en"
            ? "text-sage-600 font-medium"
            : "text-stone-400 hover:text-sage-600 transition-colors"
        }
      >
        EN
      </button>
    </div>
  );
}
