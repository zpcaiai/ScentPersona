/** Coupon validation + discount calc (Skill 51). Pure. */
export interface CouponLike {
  type: string;
  value: number;
  minOrderAmountCents?: number | null;
  maxDiscountCents?: number | null;
  scope: string;
  startsAt?: Date | string | null;
  expiresAt?: Date | string | null;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  usedCount: number;
  status: string;
}

export interface ValidateContext {
  orderAmountCents: number;
  scope: string; // sample | proxy_order | gift_box | full_size
  userRedemptionCount: number;
  now?: Date;
}

export interface CouponResult {
  valid: boolean;
  discountCents: number;
  freeShipping: boolean;
  reason?: string;
}

export function validateCoupon(c: CouponLike, ctx: ValidateContext): CouponResult {
  const now = ctx.now ?? new Date();
  const fail = (reason: string): CouponResult => ({ valid: false, discountCents: 0, freeShipping: false, reason });

  if (c.status !== "active") return fail("券不可用");
  if (c.startsAt && new Date(c.startsAt) > now) return fail("券未到使用时间");
  if (c.expiresAt && new Date(c.expiresAt) < now) return fail("券已过期");
  if (c.scope !== "all" && c.scope !== ctx.scope) return fail("券不适用于此商品类型");
  if (c.minOrderAmountCents != null && ctx.orderAmountCents < c.minOrderAmountCents) return fail("未达到使用门槛");
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return fail("券已被领完");
  if (c.perUserLimit != null && ctx.userRedemptionCount >= c.perUserLimit) return fail("已达到每人限用次数");

  let discountCents = 0;
  let freeShipping = false;
  switch (c.type) {
    case "fixed_amount":
    case "sample_credit":
      discountCents = Math.min(c.value, ctx.orderAmountCents);
      break;
    case "percentage": {
      let d = Math.round((ctx.orderAmountCents * c.value) / 100);
      if (c.maxDiscountCents != null) d = Math.min(d, c.maxDiscountCents);
      discountCents = Math.min(d, ctx.orderAmountCents);
      break;
    }
    case "free_shipping":
      freeShipping = true;
      break;
    default:
      return fail("未知券类型");
  }
  return { valid: true, discountCents, freeShipping };
}
