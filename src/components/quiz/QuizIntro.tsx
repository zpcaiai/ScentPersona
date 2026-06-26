"use client";

import { SITE_COPY } from "@/data/copy";

interface QuizIntroProps {
  onStart: () => void;
}

export default function QuizIntro({ onStart }: QuizIntroProps) {
  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-serif text-stone-800 leading-tight">
        {SITE_COPY.quiz.introTitle}
      </h1>
      <p className="mt-4 text-stone-600 leading-relaxed">
        {SITE_COPY.quiz.introSubtitle}
      </p>
      <button onClick={onStart} className="btn-primary mt-8">
        {SITE_COPY.quiz.introCta}
      </button>
    </div>
  );
}
