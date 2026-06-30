import { NextResponse } from "next/server";
import { createQuote } from "@/lib/proxy-order/createQuote";
import { rateLimit, getClientKey, sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!rateLimit(getClientKey(request, "proxy-quote"), 20, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const offerId = typeof body.offerId === "string" ? body.offerId : null;
  if (!offerId) {
    return NextResponse.json({ error: "offerId_required" }, { status: 400 });
  }
  const quantity = Number.isFinite(body.quantity) ? Number(body.quantity) : 1;
  const serviceLevel = body.serviceLevel === "priority" ? "priority" : "standard";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
  const userNote = sanitizeText(body.userNote, 500);

  try {
    const result = await createQuote({ offerId, quantity, serviceLevel, sessionId, userNote });
    return NextResponse.json(result);
  } catch (err) {
    const code = err instanceof Error ? err.message : "quote_failed";
    const status = code === "OFFER_NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: code }, { status });
  }
}
