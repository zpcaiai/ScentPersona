import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getClientKey, rateLimit, sanitizeText } from "@/lib/api-guards";

const EVENT_TYPES = new Set([
  "view",
  "click_offer",
  "favorite",
  "dislike",
  "hide",
  "outbound_click",
  "feedback_like",
  "feedback_dislike",
]);

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(getClientKey(request, "product:event"), 120, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const body = await request.json();
    const eventType = typeof body?.eventType === "string" ? body.eventType : "";
    if (!EVENT_TYPES.has(eventType)) {
      return NextResponse.json({ error: "Invalid eventType" }, { status: 400 });
    }

    await db.userProductEvent.create({
      data: {
        sessionId: sanitizeText(body.sessionId, 80),
        productId: sanitizeText(body.productId, 80),
        productOfferId: sanitizeText(body.productOfferId, 80),
        eventType,
        eventValueJson: JSON.stringify(body.eventValue || {}),
      },
    });

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
