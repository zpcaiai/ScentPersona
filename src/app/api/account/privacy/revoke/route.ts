import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth/session";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const consentType = sanitizeText(body.consentType, 40) ?? "marketing";
  await db.privacyConsent.updateMany({
    where: { userId, consentType, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
