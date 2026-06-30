import { db } from "@/lib/db";
import { scoreOrderRisk } from "./score";

const DAY_MS = 24 * 60 * 60 * 1000;
const HIGH_VALUE_CENTS = 50000;

/** Assess a proxy order's risk, persist a RiskAssessment, and raise blocking
 * flags / a manual review when needed (Skill 45). Best-effort; never throws. */
export async function assessOrderRisk(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { address: true, payments: true },
  });
  if (!order) return null;

  const samePhoneOrdersLastDay = order.customerPhone
    ? await db.order.count({
        where: { customerPhone: order.customerPhone, createdAt: { gte: new Date(Date.now() - DAY_MS) } },
      })
    : 0;

  const paid = (order.payments ?? []).filter(
    (p: { status: string; purpose: string }) => p.status === "paid" && p.purpose === "order"
  );
  const paidTotal = paid.reduce((s: number, p: { amountCents: number }) => s + p.amountCents, 0);
  const amountMismatch = paid.length > 0 && paidTotal !== order.amount;

  let offerRisk: string[] = [];
  try { offerRisk = JSON.parse(order.riskFlagsJson || "[]"); } catch { /* ignore */ }

  const result = scoreOrderRisk({
    samePhoneOrdersLastDay,
    amountMismatch,
    lowTrustSource: offerRisk.includes("suspicious_low_price"),
    incompleteAddress: !order.address,
    firstOrderHighValue: samePhoneOrdersLastDay <= 1 && order.amount > HIGH_VALUE_CENTS,
    abnormalLowPriceProduct: offerRisk.includes("suspicious_low_price"),
  });

  const assessment = await db.riskAssessment.create({
    data: {
      targetType: "order",
      targetId: orderId,
      score: result.score,
      level: result.level,
      riskFlagsJson: JSON.stringify(result.flags),
      reasonsJson: JSON.stringify(result.reasons),
    },
  });

  if (result.level === "blocked" || result.level === "high") {
    await db.orderRiskFlag.create({
      data: {
        orderId,
        riskType: result.flags[0] ?? "risk",
        reason: result.reasons.join("；") || "风控命中",
        severity: result.level === "blocked" ? "blocked" : "high",
      },
    });
    await db.manualRiskReview.create({ data: { assessmentId: assessment.id, status: "pending" } });
  }
  return result;
}

export function assessOrderRiskSafe(orderId: string): void {
  assessOrderRisk(orderId).catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[risk] assess failed", orderId, err);
  });
}

/** True if the order has an unresolved blocking risk flag — used to gate payment. */
export async function hasBlockingRisk(orderId: string): Promise<boolean> {
  const flag = await db.orderRiskFlag.findFirst({
    where: { orderId, severity: "blocked", resolved: false },
  });
  return Boolean(flag);
}
