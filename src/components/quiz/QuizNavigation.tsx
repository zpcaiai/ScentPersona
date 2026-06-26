"use client";

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
  return (
    <div className="mt-8 flex items-center justify-between">
      <button
        onClick={onBack}
        disabled={!canGoBack}
        className="text-sm text-stone-500 hover:text-sage-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ← 上一题
      </button>

      {isLast ? (
        <button
          onClick={onSubmit}
          disabled={!canGoNext || loading}
          className="btn-primary"
        >
          {loading ? "生成中..." : "查看结果 →"}
        </button>
      ) : (
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="btn-primary"
        >
          下一题 →
        </button>
      )}
    </div>
  );
}
