import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getClientKey,
  isKnownPersonaId,
  isKnownProductId,
  rateLimit,
  sanitizeText,
} from "@/lib/api-guards";
import { isOrderAccessAuthorized } from "@/lib/order-utils";

const REQUIRED_RATINGS = ["accuracy", "satisfaction", "packaging"];

function normalizeProductIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isKnownProductId);
}

function normalizeRatings(value: unknown): Record<string, number> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const ratings: Record<string, number> = {};

  for (const key of REQUIRED_RATINGS) {
    const rating = raw[key];
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return null;
    }
    ratings[key] = rating;
  }

  return ratings;
}

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(getClientKey(request, "feedback:submit"), 20, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const body = await request.json();

    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const ratings = normalizeRatings(body.ratings);
    if (!ratings) {
      return NextResponse.json(
        { error: "Invalid request: all ratings are required" },
        { status: 400 }
      );
    }

    const favoriteProductId = body.favoriteProductId;
    if (favoriteProductId && !isKnownProductId(favoriteProductId)) {
      return NextResponse.json(
        { error: "Invalid request: unknown favoriteProductId" },
        { status: 400 }
      );
    }

    const personaId = body.personaId;
    if (personaId && !isKnownPersonaId(personaId)) {
      return NextResponse.json(
        { error: "Invalid request: unknown personaId" },
        { status: 400 }
      );
    }

    if (body.orderId) {
      const order = await db.order.findUnique({
        where: { id: body.orderId },
      });

      if (!order || !isOrderAccessAuthorized(order.accessToken, body.orderAccessToken)) {
        return NextResponse.json(
          { error: "Unauthorized order feedback" },
          { status: 403 }
        );
      }

      if (order.status === "pending" || order.status === "cancelled" || order.status === "refunded") {
        return NextResponse.json(
          { error: "Feedback is available after a paid order" },
          { status: 403 }
        );
      }
    }

    const feedback = await db.feedback.create({
      data: {
        sessionId: body.sessionId ?? null,
        purchaseIntentId: body.purchaseIntentId ?? null,
        orderId: body.orderId ?? null,
        personaId: personaId ?? null,
        favoriteProductId: favoriteProductId ?? null,
        dislikedProductIdsJson: JSON.stringify(normalizeProductIds(body.dislikedProductIds)),
        ratingsJson: JSON.stringify(ratings),
        comment: sanitizeText(body.comment, 1000),
        boughtFullSize: body.boughtFullSize ?? false,
        fullSizeProductId: isKnownProductId(body.fullSizeProductId) ? body.fullSizeProductId : null,
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
