import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments";
import { transitionOrderStatus, recordOrderEvent } from "@/lib/orders/transitionOrderStatus";
import { canTransition, type OrderStatus } from "@/lib/orders/orderStatus";
import { getRefundableCents } from "@/lib/proxy-order/refund";
import { auditAdminAction } from "@/lib/admin/audit";
import { getAdminOperator, adminCan } from "@/lib/admin/auth";
import { recalcOrderProfitSafe } from "@/lib/finance/calculateOrderProfit";
import { notifyOrderSafe } from "@/lib/notifications/notifyOrder";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { orderId: string } }) {
  const operator = getAdminOperator(request);
  if (!adminCan(request, "refund:process")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const order = await db.order.findUnique({ where: { id: params.orderId } });
  if (!order || order.orderType !== "proxy") {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }
  const refund = await db.orderRefund.findFirst({
    where: { orderId: order.id, status: "requested", ...(typeof body.refundId === "string" ? { id: body.refundId } : {}) },
    orderBy: { createdAt: "desc" },
  });
  if (!refund) return NextResponse.json({ error: "no_pending_refund" }, { status: 404 });

  const payment = await db.orderPayment.findFirst({
    where: { orderId: order.id, purpose: "order", status: "paid" },
    orderBy: { createdAt: "desc" },
  });
  if (!payment?.providerPaymentId) {
    return NextResponse.json({ error: "no_captured_payment" }, { status: 400 });
  }

  const { remainingCents } = await getRefundableCents(order.id);
  const refundAmount = Math.min(refund.amountCents, remainingCents);
  if (refundAmount <= 0) return NextResponse.json({ error: "nothing_to_refund" }, { status: 400 });

  const provider = getPaymentProvider(payment.provider);
  if (!provider) return NextResponse.json({ error: "provider_unavailable" }, { status: 400 });

  let providerRefundId = "";
  try {
    const res = await provider.refund({
      providerPaymentId: payment.providerPaymentId,
      amountCents: refundAmount,
      originalAmountCents: order.amount,
      reason: refund.reason,
    });
    providerRefundId = res.providerRefundId;
  } catch (err) {
    await db.orderRefund.update({ where: { id: refund.id }, data: { status: "failed" } });
    return NextResponse.json({ error: err instanceof Error ? err.message : "refund_failed" }, { status: 502 });
  }

  await db.orderRefund.update({
    where: { id: refund.id },
    data: { status: "refunded", providerRefundId, processedAt: new Date() },
  });
  await db.orderPayment.update({
    where: { id: payment.id },
    data: { refundedAmountCents: payment.refundedAmountCents + refundAmount },
  });

  const isFull = refundAmount >= remainingCents;
  if (isFull) {
    if (canTransition(order.status as OrderStatus, "refund_pending")) {
      await transitionOrderStatus({
        orderId: order.id,
        to: "refund_pending",
        operatorId: operator,
        eventType: "refund_processing",
        message: "退款处理中",
      });
    }
    await transitionOrderStatus({
      orderId: order.id,
      to: "refunded",
      expectedFrom: "refund_pending",
      operatorId: operator,
      eventType: "refund_success",
      message: `已退款 ¥${(refundAmount / 100).toFixed(2)}`,
    });
  } else {
    await recordOrderEvent({
      orderId: order.id,
      eventType: "partial_refund",
      title: "部分退款已处理",
      message: `¥${(refundAmount / 100).toFixed(2)}`,
      operatorId: operator,
    });
  }
  await auditAdminAction({
    orderId: order.id,
    adminUserId: operator,
    action: "refund_approve",
    detail: `amount=${refundAmount} full=${isFull}`,
  });

  recalcOrderProfitSafe(order.id);
  notifyOrderSafe(order.id, "refund_success", { amount: (refundAmount / 100).toFixed(2) });
  return NextResponse.json({ ok: true, refundedCents: refundAmount, full: isFull });
}
