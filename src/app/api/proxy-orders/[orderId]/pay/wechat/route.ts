import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientKey, sanitizeText } from "@/lib/api-guards";
import { hasBlockingRisk } from "@/lib/risk/assess";
import { recordOrderEvent } from "@/lib/orders/transitionOrderStatus";
import { wechatConfigured, createJsapiPrepay, buildJsapiParams, createH5 } from "@/lib/payments/wechatPayApi";
import { wechatPayProvider } from "@/lib/payments/wechatPayProvider";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { orderId: string } }) {
  if (!rateLimit(getClientKey(request, "proxy-pay-wx"), 30, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const order = await db.order.findUnique({ where: { id: params.orderId }, include: { address: true } });
  if (!order || order.orderType !== "proxy") return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  if (order.status !== "awaiting_payment") return NextResponse.json({ error: "not_payable", status: order.status }, { status: 409 });
  if (order.quoteExpiresAt && order.quoteExpiresAt.getTime() < Date.now()) return NextResponse.json({ error: "quote_expired" }, { status: 410 });
  if (!order.address) return NextResponse.json({ error: "address_required" }, { status: 400 });
  if (await hasBlockingRisk(order.id)) return NextResponse.json({ error: "risk_blocked" }, { status: 403 });
  if (!wechatConfigured()) return NextResponse.json({ error: "provider_unavailable" }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const mode = body.mode === "h5" || body.mode === "native" ? body.mode : "jsapi";

  const payment = await db.orderPayment.create({
    data: { orderId: order.id, provider: "wechat", status: "created", purpose: "order", amountCents: order.amount, currency: order.currency },
  });
  const description = `代下单 · ${order.productTitle ?? order.orderNo}`;

  try {
    if (mode === "jsapi") {
      const openid = sanitizeText(body.openid, 64);
      if (!openid) return NextResponse.json({ error: "openid_required" }, { status: 400 });
      const { prepayId } = await createJsapiPrepay({ outTradeNo: payment.id, amountCents: order.amount, description, openid });
      const payParams = buildJsapiParams(prepayId);
      await db.orderPayment.update({ where: { id: payment.id }, data: { providerPaymentId: payment.id, status: "pending" } });
      await recordOrderEvent({ orderId: order.id, eventType: "payment_created", title: "已创建微信支付(JSAPI)", metadata: { paymentId: payment.id } });
      return NextResponse.json({ mode: "jsapi", params: payParams });
    }
    if (mode === "h5") {
      const clientIp = (request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1").trim();
      const { h5Url } = await createH5({ outTradeNo: payment.id, amountCents: order.amount, description, clientIp });
      await db.orderPayment.update({ where: { id: payment.id }, data: { providerPaymentId: payment.id, status: "pending" } });
      return NextResponse.json({ mode: "h5", h5Url });
    }
    // native
    const session = await wechatPayProvider.createCheckoutSession({
      orderId: order.id, orderNo: order.orderNo, amountCents: order.amount, currency: order.currency,
      description, metadata: { orderId: order.id, paymentId: payment.id },
    });
    await db.orderPayment.update({ where: { id: payment.id }, data: { providerPaymentId: session.providerPaymentId, status: session.status, rawDataJson: JSON.stringify({ checkoutUrl: session.checkoutUrl, clientSecret: session.clientSecret ?? null }) } });
    return NextResponse.json({ mode: "native", checkoutUrl: session.checkoutUrl, codeUrl: session.clientSecret });
  } catch (err) {
    await db.orderPayment.update({ where: { id: payment.id }, data: { status: "failed" } }).catch(() => undefined);
    return NextResponse.json({ error: err instanceof Error ? err.message : "wechat_pay_failed" }, { status: 502 });
  }
}
