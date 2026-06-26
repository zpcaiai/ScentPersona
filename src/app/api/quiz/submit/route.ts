import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scoreQuizAnswers } from "@/lib/scoring/scoreQuiz";
import { matchPersona } from "@/lib/scoring/matchPersona";
import { recommendProducts } from "@/lib/scoring/recommendProducts";
import type { QuizAnswerInput } from "@/lib/scoring/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || !Array.isArray(body.answers) || body.answers.length < 1) {
      return NextResponse.json(
        { error: "Invalid request: answers must be a non-empty array" },
        { status: 400 }
      );
    }

    const answers: QuizAnswerInput[] = body.answers;
    const source: string | undefined = body.source;

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
            tagScoresJson: JSON.stringify(
              scored.warnings.includes(`Unknown questionId: ${a.questionId}`)
                ? {}
                : {}
            ),
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
