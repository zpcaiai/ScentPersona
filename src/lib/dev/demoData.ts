import type { PrismaClient } from "@prisma/client";

/**
 * Demo dataset shared by the CLI seed (SEED_DEMO), the reset script, and the admin
 * "reset demo data" button. All rows are tagged (DEMO- order/ticket numbers,
 * @scentpersona.example users, demo- quiz source, {"demo":true} events) so
 * resetDemoData can remove them precisely without touching real business data.
 */

/** Seed demo users/orders/funnel. Idempotent via sentinel order DEMO-0001. */
export async function seedDemoData(db: PrismaClient): Promise<{ seeded: boolean; orders: number }> {
  const NOW = new Date();
  const sentinel = await db.order.findUnique({ where: { orderNo: "DEMO-0001" } }).catch(() => null);
  if (sentinel) return { seeded: false, orders: 0 };

  const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400000);
  const demoUsers: { id: string }[] = [];
  for (let i = 1; i <= 8; i++) {
    const u = await db.user.upsert({
      where: { email: `demo.user${i}@scentpersona.example` },
      create: { email: `demo.user${i}@scentpersona.example`, phone: `1380000${1000 + i}`, displayName: `演示用户${i}` },
      update: {},
    });
    demoUsers.push({ id: u.id });
  }
  const products = await db.product.findMany({ take: 20 });
  const offers = await db.productOffer.findMany({ take: 40 });
  const coupons = await db.coupon.findMany({ take: 10 });
  const sampleStatuses = ["pending", "paid", "shipped", "completed"];
  const proxyStatuses = ["quoted", "paid", "purchasing", "purchased", "shipped", "completed", "cancelled"];
  const demoOrders: { id: string; orderType: string; amount: number; paid: boolean; createdAt: Date }[] = [];

  for (let i = 1; i <= 24; i++) {
    const isProxy = i % 2 === 0;
    const orderType = isProxy ? "proxy" : "sample_kit";
    const created = daysAgo(Math.floor((i * 73) % 75));
    const user = demoUsers[i % demoUsers.length];
    const product = products[i % Math.max(1, products.length)];
    const offer = offers[i % Math.max(1, offers.length)];
    const base = offer?.priceCents ?? 29900;
    const serviceFee = isProxy ? Math.round(base * 0.1) : 0;
    const shipping = isProxy ? 1200 : 0;
    const amount = isProxy ? base + serviceFee + shipping : (product?.volumeMl && product.volumeMl <= 30 ? 9900 : 19900);
    const status = isProxy ? proxyStatuses[i % proxyStatuses.length] : sampleStatuses[i % sampleStatuses.length];
    const paid = !["pending", "quoted", "cancelled"].includes(status);
    const order = await db.order.create({
      data: {
        orderNo: `DEMO-${String(i).padStart(4, "0")}`, accessToken: `demo-token-${String(i).padStart(4, "0")}`,
        orderType, userId: user.id, productType: isProxy ? "proxy_fragrance" : "sample_kit",
        productIdsJson: JSON.stringify(product ? [product.id] : []),
        amount, status, platform: i % 3 === 0 ? "xhs" : "weapp",
        customerName: `演示用户${(i % 8) + 1}`, customerPhone: `1380000${1000 + (i % 8) + 1}`,
        shippingAddress: "（演示）某某市某某区某街道 1 号", createdAt: created,
        paidAt: paid ? new Date(created.getTime() + 3600000) : null,
        shippedAt: ["shipped", "completed"].includes(status) ? new Date(created.getTime() + 2 * 86400000) : null,
        completedAt: status === "completed" ? new Date(created.getTime() + 5 * 86400000) : null,
        cancelledAt: status === "cancelled" ? new Date(created.getTime() + 3600000) : null,
        ...(isProxy ? {
          sourcePlatform: offer?.platform ?? "tmall", sourceOfferId: offer?.id ?? null,
          productTitle: offer?.title ?? product?.normalizedName ?? "演示商品", productBrand: product?.brand ?? "ScentPersona",
          quantity: 1, productPriceCents: base, serviceFeeCents: serviceFee, domesticShippingFeeCents: shipping,
          estimatedTotalCents: amount, finalTotalCents: paid ? amount : null,
        } : {}),
      },
    });
    demoOrders.push({ id: order.id, orderType, amount, paid, createdAt: created });
    if (paid) {
      const revenue = amount;
      const productCost = isProxy ? base : Math.round(amount * 0.45);
      const paymentFee = Math.round(revenue * 0.006);
      const shippingCost = isProxy ? 900 : 800;
      const labor = 500;
      const gross = revenue - productCost - shippingCost;
      const net = gross - paymentFee - labor;
      await db.orderProfitSnapshot.create({
        data: {
          orderId: order.id, orderType, revenueCents: revenue, productCostCents: productCost,
          serviceFeeRevenueCents: serviceFee, shippingRevenueCents: shipping, shippingCostCents: shippingCost,
          paymentFeeCents: paymentFee, couponCostCents: 0, refundCostCents: 0, laborCostCents: labor,
          affiliateCommissionCents: 0, grossProfitCents: gross, netProfitCents: net,
          grossMargin: revenue ? gross / revenue : 0, netMargin: revenue ? net / revenue : 0,
          profitStatus: "complete", calculatedAt: new Date(created.getTime() + 6 * 86400000),
        },
      });
    }
  }
  for (let i = 0; i < 40; i++) {
    const created = daysAgo(Math.floor((i * 37) % 75));
    await db.quizSession.create({ data: { source: i % 3 === 0 ? "demo-xhs" : "demo-web", createdAt: created, completedAt: i % 10 < 7 ? new Date(created.getTime() + 300000) : null } });
  }
  const evTypes = ["view", "click", "compare", "add_wishlist"];
  for (let i = 0; i < 60; i++) {
    const created = daysAgo(Math.floor((i * 19) % 75));
    const product = products[i % Math.max(1, products.length)];
    await db.userProductEvent.create({ data: { eventType: evTypes[i % evTypes.length], productId: product?.id ?? null, eventValueJson: JSON.stringify({ demo: true }), createdAt: created } });
  }
  const nRedeem = Math.min(6, coupons.length, demoOrders.length);
  for (let i = 0; i < nRedeem; i++) {
    await db.couponRedemption.create({ data: { couponId: coupons[i % coupons.length].id, userId: demoUsers[i % demoUsers.length].id, orderId: demoOrders[i].id, discountCents: 1000, redeemedAt: demoOrders[i].createdAt } });
  }
  for (let i = 0; i < 5; i++) {
    await db.scentWardrobe.upsert({ where: { userId: demoUsers[i].id }, create: { userId: demoUsers[i].id }, update: {} });
  }
  const paidOrders = demoOrders.filter((o) => o.paid);
  for (let i = 0; i < Math.min(2, paidOrders.length); i++) {
    await db.orderRefund.create({ data: { orderId: paidOrders[i].id, status: "refunded", reason: "演示退款", amountCents: 5000, processedAt: NOW } });
  }
  for (let i = 0; i < 3; i++) {
    await db.supportTicket.create({ data: { ticketNo: `DEMO-T-${1000 + i}`, userId: demoUsers[i].id, orderId: demoOrders[i].id, category: "order", subject: "演示工单：物流进度咨询", status: i === 0 ? "open" : "closed" } });
  }
  for (let i = 0; i < Math.min(2, paidOrders.length); i++) {
    await db.afterSalesCase.create({ data: { caseNo: `DEMO-AS-${1000 + i}`, orderId: paidOrders[i].id, userId: demoUsers[i].id, type: i === 0 ? "missing" : "damaged", userDescription: "演示售后描述", status: "submitted" } });
  }
  const sampleOrders = demoOrders.filter((o) => o.orderType === "sample_kit").slice(0, 4);
  for (const o of sampleOrders) {
    await db.sampleFeedbackFlow.upsert({ where: { orderId: o.id }, create: { orderId: o.id, status: "completed" }, update: { status: "completed" } });
  }
  for (let i = 0; i < 3; i++) {
    await db.fullSizeRecommendation.create({ data: { sourceOrderId: sampleOrders[i % Math.max(1, sampleOrders.length)]?.id ?? demoOrders[i].id, productId: products[i % Math.max(1, products.length)].id, reason: "小样反馈偏好匹配", status: "recommended" } });
  }
  const fStatuses = ["pending", "picking", "packed", "shipped"];
  for (let i = 0; i < 6; i++) {
    await db.fulfillmentOrder.create({ data: { orderId: demoOrders[i].id, fulfillmentNo: `DEMO-F-${1000 + i}`, type: "self_op", status: fStatuses[i % fStatuses.length] } });
  }
  return { seeded: true, orders: demoOrders.length };
}

/** Delete every demo-tagged record (FK-safe order). Returns removed counts. */
export async function resetDemoData(db: PrismaClient): Promise<{ orders: number; users: number }> {
  const orderIds = (await db.order.findMany({ where: { orderNo: { startsWith: "DEMO-" } }, select: { id: true } })).map((o) => o.id);
  const userIds = (await db.user.findMany({ where: { email: { endsWith: "@scentpersona.example" } }, select: { id: true } })).map((u) => u.id);
  const removed = { orders: orderIds.length, users: userIds.length };

  await db.orderProfitSnapshot.deleteMany({ where: { orderId: { in: orderIds } } });
  await db.couponRedemption.deleteMany({ where: { orderId: { in: orderIds } } });
  await db.sampleFeedbackFlow.deleteMany({ where: { orderId: { in: orderIds } } });
  await db.fullSizeRecommendation.deleteMany({ where: { sourceOrderId: { in: orderIds } } });
  await db.afterSalesCase.deleteMany({ where: { caseNo: { startsWith: "DEMO-" } } });
  await db.supportTicket.deleteMany({ where: { ticketNo: { startsWith: "DEMO-" } } });
  await db.fulfillmentOrder.deleteMany({ where: { fulfillmentNo: { startsWith: "DEMO-" } } });
  await db.order.deleteMany({ where: { orderNo: { startsWith: "DEMO-" } } });
  await db.scentWardrobe.deleteMany({ where: { userId: { in: userIds } } });
  await db.user.deleteMany({ where: { email: { endsWith: "@scentpersona.example" } } });
  await db.quizSession.deleteMany({ where: { source: { startsWith: "demo-" } } });
  await db.userProductEvent.deleteMany({ where: { eventValueJson: { contains: '"demo":true' } } });
  return removed;
}
