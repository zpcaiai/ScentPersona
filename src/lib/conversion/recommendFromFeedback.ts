import { db } from "@/lib/db";

/**
 * Turn a loved sample into a full-size recommendation + a sample-credit coupon
 * (the sample amount applies toward the full size). Skill 52. Best-effort.
 */
export async function buildFullSizeRecommendation(params: {
  userId?: string | null;
  sourceOrderId: string;
  productId: string;
  sampleCreditCents: number;
}) {
  const code = `SC${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
  const coupon = await db.coupon.create({
    data: {
      code,
      type: "sample_credit",
      value: Math.max(0, params.sampleCreditCents),
      scope: "full_size",
      perUserLimit: 1,
      usageLimit: 1,
      status: "active",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  const rec = await db.fullSizeRecommendation.create({
    data: {
      userId: params.userId ?? null,
      sourceOrderId: params.sourceOrderId,
      productId: params.productId,
      reason: "这支被你标为喜欢，小样金额可抵扣正装。",
      discountCouponId: coupon.id,
      status: "recommended",
    },
  });
  return { coupon, recommendation: rec };
}
