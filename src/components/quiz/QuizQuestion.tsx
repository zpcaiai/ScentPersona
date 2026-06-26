"use client";

import type { QuizQuestion, QuizOption } from "@/data/quizQuestions";
import { SITE_COPY } from "@/data/copy";

interface QuizQuestionProps {
  question: QuizQuestion;
  selectedOptionId: string | null;
  onSelect: (optionId: string) => void;
}

export default function QuizQuestion({
  question,
  selectedOptionId,
  onSelect,
}: QuizQuestionProps) {
  return (
    <div>
      <h2 className="text-xl font-serif text-stone-800 leading-tight">
        {question.question}
      </h2>
      {question.subtitle && (
        <p className="mt-2 text-sm text-stone-500">{question.subtitle}</p>
      )}
      <p className="mt-1 text-xs text-sage-500">{SITE_COPY.quiz.microcopy}</p>

      <div className="mt-6 grid gap-3">
        {question.options.map((option: QuizOption) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`option-card text-left ${
              selectedOptionId === option.id ? "option-card-selected" : ""
            }`}
          >
            <div className="font-medium text-stone-800">{option.label}</div>
            {option.description && (
              <div className="text-sm text-stone-500 mt-1">
                {option.description}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
