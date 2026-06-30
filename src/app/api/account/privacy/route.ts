import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const consents = await db.privacyConsent.findMany({
    where: { userId },
    orderBy: { acceptedAt: "desc" },
  });
  const marketing = consents.find(
    (c: { consentType: string; revokedAt: Date | null }) => c.consentType === "marketing" && !c.revokedAt
  );
  return NextResponse.json({
    consents: consents.map((c: { consentType: string; version: string; acceptedAt: Date; revokedAt: Date | null }) => ({
      consentType: c.consentType,
      version: c.version,
      acceptedAt: c.acceptedAt,
      revokedAt: c.revokedAt,
    })),
    marketingEnabled: Boolean(marketing),
  });
}
