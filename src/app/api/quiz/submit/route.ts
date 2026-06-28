import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { QUIZ_QUESTIONS } from "@/data/quizQuestions";
import { getClientKey, rateLimit } from "@/lib/api-guards";
import { scoreQuizAnswers } from "@/lib/scoring/scoreQuiz";
import { matchPersona } from "@/lib/scoring/matchPersona";
import { recommendProducts } from "@/lib/scoring/recommendProducts";
import type { QuizAnswerInput } from "@/lib/scoring/types";

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(getClientKey(request, "quiz:submit"), 30, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const body = await request.json();

    if (!body || !Array.isArray(body.answers) || body.answers.length !== QUIZ_QUESTIONS.length) {
      return NextResponse.json(
        { error: "Invalid request: answers must include every quiz question" },
        { status: 400 }
      );
    }

    const answers: QuizAnswerInput[] = body.answers;
    const questionIds = new Set(QUIZ_QUESTIONS.map((q) => q.id));
    const answerQuestionIds = new Set(answers.map((answer) => answer.questionId));
    if (
      answerQuestionIds.size !== QUIZ_QUESTIONS.length ||
      answers.some((answer) => !questionIds.has(answer.questionId))
    ) {
      return NextResponse.json(
        { error: "Invalid request: duplicate or unknown questionId" },
        { status: 400 }
      );
    }
    const source: string | undefined = body.source;
    const questionMap = new Map(QUIZ_QUESTIONS.map((q) => [q.id, q]));

    const scored = scoreQuizAnswers({ answers });
    const matched = matchPersona({
      tagScores: scored.tagScores,
      personaScores: scored.personaScores,
    });
    const recommended = recommendProducts({
      personaId: matched.personaId,
      tagScores: scored.tagScores,
    });

    const recommendedProductIds = recommended.recommendations.map(
      (r) => r.productId
    );

    const userAgent = request.headers.get("user-agent") ?? undefined;

    const session = await db.quizSession.create({
      data: {
        source: source ?? null,
        userAgent: userAgent,
        personaId: matched.personaId,
        tagScoresJson: JSON.stringify(scored.normalizedTagScores),
        recommendedProductIdsJson: JSON.stringify(recommendedProductIds),
        completedAt: new Date(),
        answers: {
          create: answers.map((a) => ({
            questionId: a.questionId,
            optionId: a.optionId,
            tagScoresJson: JSON.stringify(getAnswerContribution(a, questionMap)),
          })),
        },
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      personaId: matched.personaId,
      tagScores: scored.normalizedTagScores,
      recommendedProductIds,
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

function getAnswerContribution(
  answer: QuizAnswerInput,
  questionMap: Map<string, (typeof QUIZ_QUESTIONS)[number]>
) {
  const question = questionMap.get(answer.questionId);
  const option = question?.options.find((o) => o.id === answer.optionId);

  if (!option) {
    return {
      tagScores: {},
      personaScores: {},
      valid: false,
    };
  }

  return {
    tagScores: option.tagScores,
    personaScores: option.personaScores ?? {},
    valid: true,
  };
}
