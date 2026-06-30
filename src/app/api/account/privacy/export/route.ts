import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth/session";
import { logDataAccess } from "@/lib/admin/auditLog";

export const runtime = "nodejs";

// Self-service data export of the user's own data.
export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true, scentProfile: true, addresses: true, favorites: true, consents: true },
  });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const orders = await db.order.findMany({
    where: { userId },
    select: { orderNo: true, orderType: true, status: true, amount: true, createdAt: true },
  });
  await logDataAccess({
    targetUserId: userId,
    resourceType: "user",
    resourceId: userId,
    action: "export",
    reason: "self_service_export",
  });
  return NextResponse.json({ exportedAt: new Date().toISOString(), user, orders });
}
