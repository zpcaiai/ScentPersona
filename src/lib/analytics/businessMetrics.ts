import { db } from "@/lib/db";

type CountGroup<K extends string> = { _count: { _all: number } } & Record<K, string>;
interface SnapRow { orderId: string; revenueCents: number; grossProfitCents: number; netProfitCents: number; profitStatus: string }

/** Aggregate the operating funnel for the business dashboard (Skill 54). */
export async function getBusinessMetrics(rangeDays: number) {
  const since = new Date(Date.now() - rangeDays * 86400000);

  const [
    quizStarts, quizCompletions, productEventGroups, orderGroups, paidOrders, revenueAgg,
    refundCount, refundAgg, ticketCount, afterSalesCount, feedbackFlows, wardrobeCount,
    couponRedemptions, fullSizeRecs, fulfillmentGroups, proxyStatusGroups,
  ] = await Promise.all([
    db.quizSession.count({ where: { createdAt: { gte: since } } }),
    db.quizSession.count({ where: { completedAt: { not: null }, createdAt: { gte: since } } }),
    db.userProductEvent.groupBy({ by: ["eventType"], _count: { _all: true }, where: { createdAt: { gte: since } } }),
    db.order.groupBy({ by: ["orderType"], _count: { _all: true }, where: { createdAt: { gte: since } } }),
    db.order.count({ where: { paidAt: { not: null }, createdAt: { gte: since } } }),
    db.order.aggregate({ _sum: { amount: true }, where: { paidAt: { not: null }, createdAt: { gte: since } } }),
    db.orderRefund.count({ where: { status: "refunded", createdAt: { gte: since } } }),
    db.orderRefund.aggregate({ _sum: { amountCents: true }, where: { status: "refunded", createdAt: { gte: since } } }),
    db.supportTicket.count({ where: { createdAt: { gte: since } } }),
    db.afterSalesCase.count({ where: { createdAt: { gte: since } } }),
    db.sampleFeedbackFlow.count({ where: { status: "completed" } }),
    db.scentWardrobe.count(),
    db.couponRedemption.count({ where: { redeemedAt: { gte: since } } }),
    db.fullSizeRecommendation.count(),
    db.fulfillmentOrder.groupBy({ by: ["status"], _count: { _all: true } }),
    db.order.groupBy({ by: ["status"], _count: { _all: true }, where: { orderType: "proxy" } }),
  ]);

  const snaps = (await db.orderProfitSnapshot.findMany({ orderBy: { calculatedAt: "desc" }, take: 3000 })) as SnapRow[];
  const latest = new Map<string, SnapRow>();
  for (const s of snaps) if (!latest.has(s.orderId)) latest.set(s.orderId, s);
  const ps = [...latest.values()];
  const profit = {
    revenueCents: ps.reduce((a, s) => a + s.revenueCents, 0),
    grossCents: ps.reduce((a, s) => a + s.grossProfitCents, 0),
    netCents: ps.reduce((a, s) => a + s.netProfitCents, 0),
    lossOrders: ps.filter((s) => s.netProfitCents < 0).length,
    incomplete: ps.filter((s) => s.profitStatus === "incomplete").length,
  };

  const toMap = <K extends string>(groups: CountGroup<K>[], key: K) =>
    Object.fromEntries(groups.map((g) => [g[key], g._count._all])) as Record<string, number>;

  const revenueCents = revenueAgg._sum.amount ?? 0;
  return {
    rangeDays,
    traffic: { quizStarts, quizCompletions, completionRate: quizStarts ? quizCompletions / quizStarts : 0 },
    products: toMap(productEventGroups as CountGroup<"eventType">[], "eventType"),
    transactions: {
      byType: toMap(orderGroups as CountGroup<"orderType">[], "orderType"),
      paidOrders, revenueCents, aovCents: paidOrders ? Math.round(revenueCents / paidOrders) : 0,
    },
    profit,
    fulfillment: {
      proxy: toMap(proxyStatusGroups as CountGroup<"status">[], "status"),
      selfOp: toMap(fulfillmentGroups as CountGroup<"status">[], "status"),
    },
    afterSales: { tickets: ticketCount, cases: afterSalesCount, refundCount, refundCents: refundAgg._sum.amountCents ?? 0 },
    retention: { sampleConversions: feedbackFlows, wardrobes: wardrobeCount, couponRedemptions, fullSizeRecs },
  };
}
