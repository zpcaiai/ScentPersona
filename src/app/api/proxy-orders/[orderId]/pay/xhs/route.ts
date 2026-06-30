import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientKey } from "@/lib/api-guards";
import { hasBlockingRisk } from "@/lib/risk/assess";
import { recordOrderEvent } from "@/lib/orders/transitionOrderStatus";
import { createXhsOrder, isXhsConfigured } from "@/lib/xhs-pay";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { orderId: string } }) {
  if (!rateLimit(getClientKey(request, "proxy-pay-xhs"), 30, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const order = await db.order.findUnique({ where: { id: params.orderId }, include: { address: true } });
  if (!order || order.orderType !== "proxy") return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  if (order.status !== "awaiting_payment") return NextResponse.json({ error: "not_payable", status: order.status }, { status: 409 });
  if (order.quoteExpiresAt && order.quoteExpiresAt.getTime() < Date.now()) return NextResponse.json({ error: "quote_expired" }, { status: 410 });
  if (!order.address) return NextResponse.json({ error: "address_required" }, { status: 400 });
  if (await hasBlockingRisk(order.id)) return NextResponse.json({ error: "risk_blocked" }, { status: 403 });
  if (!isXhsConfigured()) return NextResponse.json({ error: "provider_unavailable" }, { status: 400 });

  const payment = await db.orderPayment.create({
    data: { orderId: order.id, provider: "xhs", status: "created", purpose: "order", amountCents: order.amount, currency: order.currency },
  });
  try {
    const result = await createXhsOrder({ orderNo: payment.id, amount: order.amount, description: `代下单 · ${order.productTitle ?? order.orderNo}` });
    await db.orderPayment.update({ where: { id: payment.id }, data: { providerPaymentId: payment.id, status: "pending" } });
    await recordOrderEvent({ orderId: order.id, eventType: "payment_created", title: "已创建小红书支付", metadata: { paymentId: payment.id } });
    return NextResponse.json({ ok: true, params: result });
  } catch (err) {
    await db.orderPayment.update({ where: { id: payment.id }, data: { status: "failed" } }).catch(() => undefined);
    return NextResponse.json({ error: err instanceof Error ? err.message : "xhs_pay_failed" }, { status: 502 });
  }
}
