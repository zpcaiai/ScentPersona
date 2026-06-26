"use client";

interface QuizProgressProps {
  current: number;
  total: number;
}

export default function QuizProgress({ current, total }: QuizProgressProps) {
  const percent = Math.round((current / total) * 100);
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-stone-500 mb-2">
        <span>{current} / {total}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-sage-500 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
