import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordOrderEvent } from "@/lib/orders/transitionOrderStatus";
import { auditAdminAction } from "@/lib/admin/audit";
import { getAdminOperator } from "@/lib/admin/auth";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { orderId: string } }) {
  const operator = getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const reason = sanitizeText(body.reason, 200) ?? "不符合退款条件";

  const order = await db.order.findUnique({ where: { id: params.orderId } });
  if (!order || order.orderType !== "proxy") {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }
  const refund = await db.orderRefund.findFirst({
    where: { orderId: order.id, status: "requested" },
    orderBy: { createdAt: "desc" },
  });
  if (!refund) return NextResponse.json({ error: "no_pending_refund" }, { status: 404 });

  await db.orderRefund.update({ where: { id: refund.id }, data: { status: "rejected" } });
  await recordOrderEvent({
    orderId: order.id,
    eventType: "refund_rejected",
    title: "退款申请未通过",
    message: reason,
    operatorId: operator,
  });
  await auditAdminAction({ orderId: order.id, adminUserId: operator, action: "refund_reject", detail: reason });
  return NextResponse.json({ ok: true });
}
