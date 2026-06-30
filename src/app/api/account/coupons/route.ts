import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const recs = await db.fullSizeRecommendation.findMany({ where: { userId, status: "recommended" }, orderBy: { createdAt: "desc" } });
  const couponIds = recs.map((r: { discountCouponId: string | null }) => r.discountCouponId).filter(Boolean) as string[];
  const coupons = couponIds.length ? await db.coupon.findMany({ where: { id: { in: couponIds } } }) : [];
  const couponMap = new Map(coupons.map((c: { id: string; code: string; type: string; value: number; expiresAt: Date | null }) => [c.id, c]));

  return NextResponse.json({
    recommendations: recs.map((r: { id: string; productId: string; reason: string; discountCouponId: string | null }) => ({
      id: r.id, productId: r.productId, reason: r.reason,
      coupon: r.discountCouponId ? couponMap.get(r.discountCouponId) ?? null : null,
    })),
  });
}
