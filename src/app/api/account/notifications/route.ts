import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const notifications = await db.notification.findMany({
    where: { userId, channel: "in_app" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unread = notifications.filter((n: { readAt: Date | null }) => !n.readAt).length;
  return NextResponse.json({ notifications, unread });
}
