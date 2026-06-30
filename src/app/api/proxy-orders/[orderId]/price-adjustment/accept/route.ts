import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientKey } from "@/lib/api-guards";
import { verifyOrderLookup } from "@/lib/orders/orderLookup";
import { transitionOrderStatus, recordOrderEvent } from "@/lib/orders/transitionOrderStatus";
import { getPaymentProvider, DEFAULT_PAYMENT_PROVIDER } from "@/lib/payments";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { orderId: string } }) {
  if (!rateLimit(getClientKey(request, "price-accept"), 20, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const order = await db.order.findUnique({ where: { id: params.orderId } });
  if (!order || order.orderType !== "proxy") {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }
  if (!verifyOrderLookup(order, { token: body.token, phoneLast4: body.phoneLast4 })) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }
  if (order.status !== "price_changed") {
    return NextResponse.json({ error: "no_price_change", status: order.status }, { status: 409 });
  }
  const adj = await db.orderPriceAdjustment.findFirst({
    where: { orderId: order.id, status: "pending" },
    orderBy: { createdAt: "desc" },
  });
  if (!adj) return NextResponse.json({ error: "no_adjustment" }, { status: 404 });
  if (adj.expiresAt && adj.expiresAt.getTime() < Date.now()) {
    await db.orderPriceAdjustment.update({ where: { id: adj.id }, data: { status: "expired" } });
    return NextResponse.json({ error: "adjustment_expired" }, { status: 410 });
  }

  // Cheaper or same price → resume immediately, no extra payment.
  if (adj.diffCents <= 0) {
    await db.orderPriceAdjustment.update({ where: { id: adj.id }, data: { status: "accepted" } });
    await db.order.update({
      where: { id: order.id },
      data: { finalTotalCents: adj.newTotalCents, amount: adj.newTotalCents },
    });
    await transitionOrderStatus({
      orderId: order.id,
      to: "purchasing",
      expectedFrom: "price_changed",
      eventType: "price_accepted",
      message: "用户已确认新价格，继续采购",
    });
    return NextResponse.json({ ok: true, resumed: true });
  }

  // Surcharge → collect the difference through the payment provider.
  await db.orderPriceAdjustment.update({ where: { id: adj.id }, data: { status: "accepted" } });
  await db.order.update({ where: { id: order.id }, data: { finalTotalCents: adj.newTotalCents } });

  const provider = getPaymentProvider(DEFAULT_PAYMENT_PROVIDER);
  if (!provider || !provider.isConfigured()) {
    return NextResponse.json({ error: "provider_unavailable" }, { status: 400 });
  }
  const payment = await db.orderPayment.create({
    data: {
      orderId: order.id,
      provider: provider.providerName,
      status: "created",
      purpose: "price_adjustment",
      amountCents: adj.diffCents,
      currency: order.currency,
    },
  });
  const appUrl = process.env.APP_URL || "";
  const session = await provider.createCheckoutSession({
    orderId: order.id,
    orderNo: order.orderNo,
    amountCents: adj.diffCents,
    currency: order.currency,
    description: `差价补缴 · ${order.orderNo}`,
    purpose: "price_adjustment",
    successUrl: `${appUrl}/orders/${order.orderNo}`,
    cancelUrl: `${appUrl}/orders/${order.orderNo}`,
    metadata: { orderId: order.id, paymentId: payment.id, purpose: "price_adjustment" },
  });
  await db.orderPayment.update({
    where: { id: payment.id },
    data: { providerPaymentId: session.providerPaymentId, status: session.status },
  });
  await recordOrderEvent({
    orderId: order.id,
    eventType: "price_diff_payment_created",
    title: "已创建差价支付",
    metadata: { diffCents: adj.diffCents },
  });

  return NextResponse.json({ ok: true, requiresPayment: true, checkoutUrl: session.checkoutUrl });
}
