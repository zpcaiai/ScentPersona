import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getClientKey,
  isKnownPersonaId,
  rateLimit,
  sanitizeText,
} from "@/lib/api-guards";

const EVENT_NAMES = new Set([
  "page_view",
  "quiz_start",
  "quiz_complete",
  "result_view",
  "checkout_view",
  "checkout_submit",
  "feedback_view",
]);

function normalizeMetadata(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "{}";
  const safeEntries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) =>
      typeof entryValue === "string" ||
      typeof entryValue === "number" ||
      typeof entryValue === "boolean" ||
      entryValue === null
    )
    .slice(0, 20);

  return JSON.stringify(Object.fromEntries(safeEntries));
}

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(getClientKey(request, "analytics:event"), 120, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const eventName = typeof body?.eventName === "string" ? body.eventName : "";

    if (!EVENT_NAMES.has(eventName)) {
      return NextResponse.json(
        { error: "Invalid request: unsupported eventName" },
        { status: 400 }
      );
    }

    const personaId = isKnownPersonaId(body.personaId) ? body.personaId : null;

    await db.analyticsEvent.create({
      data: {
        eventName,
        source: sanitizeText(body.source, 30),
        path: sanitizeText(body.path, 200),
        sessionId: sanitizeText(body.sessionId, 80),
        orderId: sanitizeText(body.orderId, 80),
        personaId,
        metadataJson: normalizeMetadata(body.metadata),
      },
    });

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
