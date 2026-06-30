import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth/session";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

// Records a deletion request (does NOT physically delete orders — transaction
// records must be retained for audit; Skill 41).
export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  await db.dataDeletionRequest.create({
    data: {
      userId,
      contact: user.phone ?? user.email ?? userId,
      identifier: userId,
      reason: sanitizeText(body.reason, 200),
      status: "requested",
    },
  });
  return NextResponse.json({ ok: true });
}
