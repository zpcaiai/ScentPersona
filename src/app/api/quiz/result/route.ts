import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonArray, parseJsonRecord } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const session = await db.quizSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      personaId: session.personaId,
      tagScores: parseJsonRecord<number>(session.tagScoresJson),
      recommendedProductIds: parseJsonArray<string>(session.recommendedProductIdsJson),
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
