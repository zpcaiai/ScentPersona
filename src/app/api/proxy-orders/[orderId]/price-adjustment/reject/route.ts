import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientKey, sanitizeText } from "@/lib/api-guards";
import { verifyOrderLookup } from "@/lib/orders/orderLookup";
import { transitionOrderStatus, recordOrderEvent } from "@/lib/orders/transitionOrderStatus";
import { getRefundableCents } from "@/lib/proxy-order/refund";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { orderId: string } }) {
  if (!rateLimit(getClientKey(request, "price-reject"), 20, 60_000)) {
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
  if (adj) {
    await db.orderPriceAdjustment.update({ where: { id: adj.id }, data: { status: "rejected" } });
  }
  const reason = sanitizeText(body.reason, 200) ?? "用户拒绝差价，申请退款";

  await transitionOrderStatus({
    orderId: order.id,
    to: "refund_pending",
    expectedFrom: "price_changed",
    eventType: "price_rejected",
    message: reason,
  });
  const { remainingCents } = await getRefundableCents(order.id);
  await db.orderRefund.create({
    data: { orderId: order.id, status: "requested", reason, amountCents: remainingCents },
  });
  await recordOrderEvent({
    orderId: order.id,
    eventType: "refund_requested",
    title: "用户拒绝差价并申请退款",
    message: reason,
  });

  return NextResponse.json({ ok: true, refundRequested: true });
}
