import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function DELETE(request: Request, { params }: { params: { itemId: string } }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const w = await db.scentWardrobe.findUnique({ where: { userId } });
  const item = await db.scentWardrobeItem.findUnique({ where: { id: params.itemId } });
  if (!w || !item || item.wardrobeId !== w.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await db.scentWardrobeItem.delete({ where: { id: params.itemId } });
  return NextResponse.json({ ok: true });
}
