"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import QuizIntro from "@/components/quiz/QuizIntro";
import QuizQuestion from "@/components/quiz/QuizQuestion";
import QuizProgress from "@/components/quiz/QuizProgress";
import QuizNavigation from "@/components/quiz/QuizNavigation";
import { QUIZ_QUESTIONS } from "@/data/quizQuestions";
import { SITE_COPY } from "@/data/copy";
import type { QuizAnswerInput } from "@/lib/scoring/types";

const QUIZ_DRAFT_KEY = "scentpersona:quiz-draft";

export default function QuizPage() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = QUIZ_QUESTIONS.length;
  const currentQuestion = QUIZ_QUESTIONS[currentIndex];
  const selectedOptionId = answers[currentQuestion?.id] ?? null;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(QUIZ_DRAFT_KEY);
      if (!raw) return;

      const draft = JSON.parse(raw) as {
        started?: boolean;
        currentIndex?: number;
        answers?: Record<string, string>;
      };

      if (draft.answers && Object.keys(draft.answers).length > 0) {
        setAnswers(draft.answers);
        setCurrentIndex(Math.min(Math.max(draft.currentIndex ?? 0, 0), total - 1));
        setStarted(draft.started ?? true);
      }
    } catch {
      window.localStorage.removeItem(QUIZ_DRAFT_KEY);
    }
  }, [total]);

  useEffect(() => {
    if (!started) return;
    window.localStorage.setItem(
      QUIZ_DRAFT_KEY,
      JSON.stringify({ started, currentIndex, answers })
    );
  }, [answers, currentIndex, started]);

  const handleStart = () => {
    setStarted(true);
    setCurrentIndex(0);
  };

  const handleSelect = (optionId: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const answerList: QuizAnswerInput[] = Object.entries(answers).map(
      ([questionId, optionId]) => ({ questionId, optionId })
    );

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answerList }),
      });

      if (!res.ok) {
        throw new Error("submit failed");
      }

      const data = await res.json();
      window.localStorage.removeItem(QUIZ_DRAFT_KEY);
      router.push(`/result/${data.sessionId}`);
    } catch {
      setError(SITE_COPY.quiz.errorText);
      setLoading(false);
    }
  };

  if (!started) {
    return (
      <PageShell>
        <QuizIntro onStart={handleStart} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <QuizProgress current={currentIndex + 1} total={total} />

      <QuizQuestion
        question={currentQuestion}
        selectedOptionId={selectedOptionId}
        onSelect={handleSelect}
      />

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <QuizNavigation
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={handleSubmit}
        canGoBack={currentIndex > 0}
        canGoNext={selectedOptionId !== null}
        isLast={currentIndex === total - 1}
        loading={loading}
      />

      {loading && (
        <div className="mt-8 text-center text-sm text-stone-500">
          {SITE_COPY.quiz.loadingText}
        </div>
      )}
    </PageShell>
  );
}
