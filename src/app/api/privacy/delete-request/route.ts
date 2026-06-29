import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getClientKey, rateLimit, sanitizeText } from "@/lib/api-guards";

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(getClientKey(request, "privacy:delete-request"), 5, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const contact = sanitizeText(body?.contact, 120);
    const identifier = sanitizeText(body?.identifier, 160);
    const reason = sanitizeText(body?.reason, 1000);

    if (!contact || !identifier) {
      return NextResponse.json(
        { error: "Invalid request: contact and identifier are required" },
        { status: 400 }
      );
    }

    const requestRecord = await db.dataDeletionRequest.create({
      data: {
        contact,
        identifier,
        reason,
      },
    });

    return NextResponse.json({
      requestId: requestRecord.id,
      status: requestRecord.status,
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
