"use client";

import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

interface QuizNavigationProps {
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  isLast: boolean;
  loading: boolean;
}

export default function QuizNavigation({
  onBack,
  onNext,
  onSubmit,
  canGoBack,
  canGoNext,
  isLast,
  loading,
}: QuizNavigationProps) {
  const { locale } = useLang();
  return (
    <div className="mt-8 flex items-center justify-between">
      <button
        onClick={onBack}
        disabled={!canGoBack}
        className="text-sm text-stone-500 hover:text-sage-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {pick(locale, "← 上一题", "← Previous")}
      </button>

      {isLast ? (
        <button
          onClick={onSubmit}
          disabled={!canGoNext || loading}
          className="btn-primary"
        >
          {loading
            ? pick(locale, "生成中...", "Generating...")
            : pick(locale, "查看结果 →", "See results →")}
        </button>
      ) : (
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="btn-primary"
        >
          {pick(locale, "下一题 →", "Next →")}
        </button>
      )}
    </div>
  );
}
