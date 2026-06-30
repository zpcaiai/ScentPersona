import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transitionOrderStatus } from "@/lib/orders/transitionOrderStatus";
import { auditAdminAction } from "@/lib/admin/audit";
import { getAdminOperator } from "@/lib/admin/auth";
import { notifyOrderSafe } from "@/lib/notifications/notifyOrder";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { orderId: string } }) {
  const operator = getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const reason = sanitizeText(body.reason, 200) ?? "采购时发现缺货";

  const order = await db.order.findUnique({ where: { id: params.orderId } });
  if (!order || order.orderType !== "proxy") {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }
  try {
    await transitionOrderStatus({
      orderId: order.id,
      to: "out_of_stock",
      expectedFrom: "purchasing",
      operatorId: operator,
      eventType: "out_of_stock",
      message: reason,
    });
    await db.orderPurchase.updateMany({
      where: { orderId: order.id },
      data: { purchaseStatus: "out_of_stock", adminNote: reason },
    });
    await auditAdminAction({ orderId: order.id, adminUserId: operator, action: "mark_out_of_stock", detail: reason });
    notifyOrderSafe(order.id, "out_of_stock");
    return NextResponse.json({ ok: true, status: "out_of_stock" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "failed" }, { status: 409 });
  }
}
