import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (params.id === "all") {
    await db.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date(), status: "read" } });
    return NextResponse.json({ ok: true });
  }
  await db.notification.updateMany({ where: { id: params.id, userId }, data: { readAt: new Date(), status: "read" } });
  return NextResponse.json({ ok: true });
}
