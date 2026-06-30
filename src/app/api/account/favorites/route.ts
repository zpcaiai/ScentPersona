import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth/session";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const favorites = await db.userFavoriteProduct.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ favorites });
}

// Toggle a favorite product.
export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const productId = sanitizeText(body.productId, 60);
  if (!productId) return NextResponse.json({ error: "productId_required" }, { status: 400 });
  const existing = await db.userFavoriteProduct.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) {
    await db.userFavoriteProduct.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, favorited: false });
  }
  await db.userFavoriteProduct.create({
    data: { userId, productId, productOfferId: sanitizeText(body.productOfferId, 60) },
  });
  return NextResponse.json({ ok: true, favorited: true });
}
