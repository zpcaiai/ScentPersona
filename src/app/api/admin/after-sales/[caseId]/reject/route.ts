import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordOrderEvent } from "@/lib/orders/transitionOrderStatus";
import { auditAdminAction } from "@/lib/admin/audit";
import { getAdminOperator } from "@/lib/admin/auth";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { caseId: string } }) {
  const operator = getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const conclusion = sanitizeText(body.conclusion, 400) ?? "未达到售后条件";
  const c = await db.afterSalesCase.findUnique({ where: { id: params.caseId } });
  if (!c) return NextResponse.json({ error: "case_not_found" }, { status: 404 });
  await db.afterSalesCase.update({ where: { id: c.id }, data: { status: "rejected", adminConclusion: conclusion, closedAt: new Date() } });
  await recordOrderEvent({ orderId: c.orderId, eventType: "after_sales_rejected", title: "售后未通过", message: conclusion, operatorId: operator });
  await auditAdminAction({ orderId: c.orderId, adminUserId: operator, action: "after_sales_reject", detail: c.caseNo });
  return NextResponse.json({ ok: true });
}
