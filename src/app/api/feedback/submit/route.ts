import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const feedback = await db.feedback.create({
      data: {
        sessionId: body.sessionId ?? null,
        purchaseIntentId: body.purchaseIntentId ?? null,
        personaId: body.personaId ?? null,
        favoriteProductId: body.favoriteProductId ?? null,
        dislikedProductIdsJson: JSON.stringify(body.dislikedProductIds ?? []),
        ratingsJson: JSON.stringify(body.ratings ?? {}),
        comment: body.comment ?? null,
        boughtFullSize: body.boughtFullSize ?? false,
        fullSizeProductId: body.fullSizeProductId ?? null,
      },
    });

    return NextResponse.json({
      feedbackId: feedback.id,
      status: "created",
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
