import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transitionOrderStatus } from "@/lib/orders/transitionOrderStatus";
import { auditAdminAction } from "@/lib/admin/audit";
import { getAdminOperator } from "@/lib/admin/auth";
import { notifyOrderSafe } from "@/lib/notifications/notifyOrder";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { orderId: string } }) {
  const operator = getAdminOperator(request);
  const order = await db.order.findUnique({ where: { id: params.orderId } });
  if (!order || order.orderType !== "proxy") {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }
  try {
    await transitionOrderStatus({
      orderId: order.id,
      to: "purchasing",
      expectedFrom: "paid",
      operatorId: operator,
      eventType: "purchase_started",
      message: "后台开始代采购",
    });
    await db.orderPurchase.upsert({
      where: { orderId: order.id },
      create: { orderId: order.id, platform: order.sourcePlatform ?? "manual", purchaseStatus: "purchasing" },
      update: { purchaseStatus: "purchasing" },
    });
    await auditAdminAction({ orderId: order.id, adminUserId: operator, action: "purchase_start" });
    notifyOrderSafe(order.id, "purchase_started");
    return NextResponse.json({ ok: true, status: "purchasing" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "failed" }, { status: 409 });
  }
}
