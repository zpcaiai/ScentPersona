import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth/session";
import { validateCoupon } from "@/lib/coupons/validateCoupon";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const code = sanitizeText(body.code, 40);
  const orderAmountCents = Number.isFinite(body.orderAmountCents) ? Number(body.orderAmountCents) : 0;
  const scope = sanitizeText(body.scope, 20) ?? "all";
  if (!code) return NextResponse.json({ error: "code_required" }, { status: 400 });

  const coupon = await db.coupon.findUnique({ where: { code } });
  if (!coupon) return NextResponse.json({ valid: false, reason: "券不存在" });

  const userRedemptionCount = userId
    ? await db.couponRedemption.count({ where: { couponId: coupon.id, userId } })
    : 0;

  const result = validateCoupon(coupon, { orderAmountCents, scope, userRedemptionCount });
  return NextResponse.json(result);
}
