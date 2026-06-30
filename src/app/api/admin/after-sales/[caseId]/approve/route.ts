import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordOrderEvent } from "@/lib/orders/transitionOrderStatus";
import { getRefundableCents } from "@/lib/proxy-order/refund";
import { auditAdminAction } from "@/lib/admin/audit";
import { getAdminOperator } from "@/lib/admin/auth";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { caseId: string } }) {
  const operator = getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const conclusion = sanitizeText(body.conclusion, 400) ?? "售后通过";
  const withRefund = body.refund === true;

  const c = await db.afterSalesCase.findUnique({ where: { id: params.caseId } });
  if (!c) return NextResponse.json({ error: "case_not_found" }, { status: 404 });

  await db.afterSalesCase.update({
    where: { id: c.id },
    data: { status: withRefund ? "refunded" : "approved", adminConclusion: conclusion, closedAt: withRefund ? null : new Date() },
  });

  if (withRefund) {
    const { remainingCents } = await getRefundableCents(c.orderId);
    if (remainingCents > 0) {
      await db.orderRefund.create({ data: { orderId: c.orderId, status: "requested", reason: `售后退款：${conclusion}`, amountCents: remainingCents } });
    }
  }
  await recordOrderEvent({ orderId: c.orderId, eventType: "after_sales_approved", title: "售后已通过", message: conclusion, operatorId: operator });
  await auditAdminAction({ orderId: c.orderId, adminUserId: operator, action: "after_sales_approve", detail: `case=${c.caseNo} refund=${withRefund}` });
  return NextResponse.json({ ok: true, refundRequested: withRefund });
}
