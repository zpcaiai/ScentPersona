import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientKey, sanitizeText } from "@/lib/api-guards";
import { verifyOrderLookup } from "@/lib/orders/orderLookup";
import { canTransition, type OrderStatus } from "@/lib/orders/orderStatus";
import { recordOrderEvent } from "@/lib/orders/transitionOrderStatus";
import { getRefundableCents } from "@/lib/proxy-order/refund";
import { notifyOrderSafe } from "@/lib/notifications/notifyOrder";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { orderId: string } }) {
  if (!rateLimit(getClientKey(request, "refund-req"), 20, 60_000)) {
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
  if (!canTransition(order.status as OrderStatus, "refund_pending")) {
    return NextResponse.json(
      { error: "not_refundable", hint: "已发货/已签收订单请通过售后流程申请" },
      { status: 409 }
    );
  }
  const { remainingCents } = await getRefundableCents(order.id);
  if (remainingCents <= 0) {
    return NextResponse.json({ error: "nothing_to_refund" }, { status: 400 });
  }
  const reason = sanitizeText(body.reason, 200) ?? "用户申请退款";
  const refund = await db.orderRefund.create({
    data: { orderId: order.id, status: "requested", reason, amountCents: remainingCents },
  });
  await recordOrderEvent({
    orderId: order.id,
    eventType: "refund_requested",
    title: "用户申请退款",
    message: reason,
    metadata: { refundId: refund.id, amountCents: remainingCents },
  });
  notifyOrderSafe(order.id, "refund_requested");
  return NextResponse.json({ ok: true, refundId: refund.id, amountCents: remainingCents });
}
