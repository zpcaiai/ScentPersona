import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientKey } from "@/lib/api-guards";
import { getPaymentProvider, DEFAULT_PAYMENT_PROVIDER } from "@/lib/payments";
import { recordOrderEvent } from "@/lib/orders/transitionOrderStatus";
import { hasBlockingRisk } from "@/lib/risk/assess";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { orderId: string } }) {
  if (!rateLimit(getClientKey(request, "proxy-pay"), 30, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const order = await db.order.findUnique({
    where: { id: params.orderId },
    include: { address: true },
  });
  if (!order || order.orderType !== "proxy") {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }
  if (order.status !== "awaiting_payment") {
    return NextResponse.json({ error: "not_payable", status: order.status }, { status: 409 });
  }
  if (order.quoteExpiresAt && order.quoteExpiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "quote_expired" }, { status: 410 });
  }
  if (!order.address) {
    return NextResponse.json({ error: "address_required" }, { status: 400 });
  }
  if (await hasBlockingRisk(order.id)) {
    return NextResponse.json({ error: "risk_blocked", hint: "订单需人工审核后才能支付" }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    /* provider optional */
  }
  const providerName = typeof body.provider === "string" ? body.provider : DEFAULT_PAYMENT_PROVIDER;
  const provider = getPaymentProvider(providerName);
  if (!provider || !provider.isConfigured()) {
    return NextResponse.json({ error: "provider_unavailable", provider: providerName }, { status: 400 });
  }

  const payment = await db.orderPayment.create({
    data: {
      orderId: order.id,
      provider: provider.providerName,
      status: "created",
      purpose: "order",
      amountCents: order.amount,
      currency: order.currency,
    },
  });

  const appUrl = process.env.APP_URL || "";
  const session = await provider.createCheckoutSession({
    orderId: order.id,
    orderNo: order.orderNo,
    amountCents: order.amount,
    currency: order.currency,
    description: `代下单 · ${order.productTitle ?? order.orderNo}`,
    purpose: "order",
    customer: { name: order.customerName, phone: order.customerPhone },
    successUrl: `${appUrl}/orders/${order.orderNo}`,
    cancelUrl: `${appUrl}/proxy-order/${order.id}/confirm`,
    metadata: { orderId: order.id, paymentId: payment.id },
  });

  await db.orderPayment.update({
    where: { id: payment.id },
    data: {
      providerPaymentId: session.providerPaymentId,
      status: session.status,
      rawDataJson: JSON.stringify({ checkoutUrl: session.checkoutUrl, clientSecret: session.clientSecret ?? null }),
    },
  });

  await recordOrderEvent({
    orderId: order.id,
    eventType: "payment_created",
    title: "已创建支付",
    message: provider.providerName,
    metadata: { paymentId: payment.id, provider: provider.providerName },
  });

  return NextResponse.json({
    ok: true,
    provider: provider.providerName,
    paymentId: payment.id,
    providerPaymentId: session.providerPaymentId,
    checkoutUrl: session.checkoutUrl,
    clientSecret: session.clientSecret,
  });
}
