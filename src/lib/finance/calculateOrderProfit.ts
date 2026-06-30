import { db } from "@/lib/db";

/**
 * Order profit accounting (Skill 39). Creates a NEW snapshot each run so the
 * history is preserved (e.g. before vs after a refund). Marks incomplete when
 * the proxy purchase cost is still unknown.
 */
const DEFAULT_PAYMENT_FEE_RATE = 0.006; // 0.6% — override via CostRule(type="payment_fee")

interface ProfitInput {
  amountCents: number;
  refundedAmountCents: number;
}

async function getRate(type: string, fallback: number): Promise<number> {
  const rule = await db.costRule.findFirst({ where: { type, isActive: true } });
  if (!rule) return fallback;
  try {
    const parsed = JSON.parse(rule.ruleJson) as { rate?: number };
    return typeof parsed.rate === "number" ? parsed.rate : fallback;
  } catch {
    return fallback;
  }
}

async function getFlatCents(type: string): Promise<number> {
  const rule = await db.costRule.findFirst({ where: { type, isActive: true } });
  if (!rule) return 0;
  try {
    const parsed = JSON.parse(rule.ruleJson) as { flatCents?: number };
    return typeof parsed.flatCents === "number" ? parsed.flatCents : 0;
  } catch {
    return 0;
  }
}

export async function recalcOrderProfit(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { payments: true, purchase: true },
  });
  if (!order) return null;

  const payments = (order.payments ?? []) as ProfitInput[];
  const revenueCents = payments
    .filter((p) => (p as unknown as { status: string }).status === "paid")
    .reduce((s, p) => s + p.amountCents, 0);
  const refundCostCents = payments.reduce((s, p) => s + p.refundedAmountCents, 0);

  const serviceFeeRevenueCents = order.serviceFeeCents ?? 0;
  const shippingRevenueCents = order.domesticShippingFeeCents ?? 0;

  const isProxy = order.orderType === "proxy";
  const purchaseCost = order.purchase?.purchaseCostCents ?? null;
  const productCostCents = purchaseCost ?? 0;
  const shippingCostCents = await getFlatCents("shipping");
  const laborCostCents = await getFlatCents("labor");
  const couponCostCents = 0; // Skill 51
  const affiliateCommissionCents = 0;

  const paymentFeeRate = await getRate("payment_fee", DEFAULT_PAYMENT_FEE_RATE);
  const paymentFeeCents = Math.round(revenueCents * paymentFeeRate);

  const grossProfitCents = revenueCents - productCostCents - shippingCostCents - refundCostCents;
  const netProfitCents =
    grossProfitCents - paymentFeeCents - couponCostCents - laborCostCents - affiliateCommissionCents;

  const grossMargin = revenueCents > 0 ? grossProfitCents / revenueCents : 0;
  const netMargin = revenueCents > 0 ? netProfitCents / revenueCents : 0;
  const profitStatus = isProxy && purchaseCost == null ? "incomplete" : "complete";

  return db.orderProfitSnapshot.create({
    data: {
      orderId,
      orderType: order.orderType,
      revenueCents,
      productCostCents,
      serviceFeeRevenueCents,
      shippingRevenueCents,
      shippingCostCents,
      paymentFeeCents,
      couponCostCents,
      refundCostCents,
      laborCostCents,
      affiliateCommissionCents,
      grossProfitCents,
      netProfitCents,
      grossMargin,
      netMargin,
      profitStatus,
      metadataJson: JSON.stringify({ paymentFeeRate }),
    },
  });
}

/** Fire-and-forget recompute — never breaks the calling flow. */
export function recalcOrderProfitSafe(orderId: string): void {
  recalcOrderProfit(orderId).catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[profit] recalc failed", orderId, err);
  });
}
