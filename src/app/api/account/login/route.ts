import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientKey, normalizePhone, sanitizeText } from "@/lib/api-guards";
import { buildSessionCookie, signSession } from "@/lib/auth/session";
import { mergeAnonymous } from "@/lib/account/mergeAnonymous";
import { maskPhone } from "@/lib/privacy/masking";

export const runtime = "nodejs";

// MVP phone "login" (no password). TODO(production): OTP / WeChat / OAuth.
export async function POST(request: Request) {
  if (!rateLimit(getClientKey(request, "login"), 20, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const phone = normalizePhone(body.phone);
  if (!phone) return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
  const displayName = sanitizeText(body.displayName, 40);

  const user = await db.user.upsert({
    where: { phone },
    create: { phone, displayName },
    update: displayName ? { displayName } : {},
  });
  await mergeAnonymous(user.id, { sessionId, phone });
  await db.privacyConsent
    .create({
      data: {
        userId: user.id,
        sessionId,
        consentType: "privacy_policy",
        version: "v1",
        ip: getClientKey(request, "ip"),
        userAgent: (request.headers.get("user-agent") || "").slice(0, 200),
      },
    })
    .catch(() => undefined);

  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, phone: maskPhone(user.phone), displayName: user.displayName },
  });
  res.headers.set("Set-Cookie", buildSessionCookie(user.id));
  return res;
}
