import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transitionOrderStatus } from "@/lib/orders/transitionOrderStatus";
import { auditAdminAction } from "@/lib/admin/audit";
import { getAdminOperator } from "@/lib/admin/auth";
import { sanitizeText } from "@/lib/api-guards";
import { recalcOrderProfitSafe } from "@/lib/finance/calculateOrderProfit";
import { notifyOrderSafe } from "@/lib/notifications/notifyOrder";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { orderId: string } }) {
  const operator = getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const platformOrderNo = sanitizeText(body.platformOrderNo, 64);
  if (!platformOrderNo) {
    return NextResponse.json({ error: "platformOrderNo_required" }, { status: 400 });
  }
  const purchaseCostCents =
    typeof body.purchaseCostCents === "number" && body.purchaseCostCents >= 0
      ? Math.round(body.purchaseCostCents)
      : null;
  const purchaseAccountLabel = sanitizeText(body.purchaseAccountLabel, 60);
  const screenshotUrl = sanitizeText(body.screenshotUrl, 500);

  const order = await db.order.findUnique({ where: { id: params.orderId } });
  if (!order || order.orderType !== "proxy") {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }
  try {
    await db.orderPurchase.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        platform: order.sourcePlatform ?? "manual",
        platformOrderNo,
        purchaseCostCents,
        purchaseAccountLabel,
        screenshotUrl,
        purchaseStatus: "purchased",
        purchasedAt: new Date(),
      },
      update: {
        platformOrderNo,
        purchaseCostCents,
        purchaseAccountLabel,
        screenshotUrl,
        purchaseStatus: "purchased",
        purchasedAt: new Date(),
      },
    });
    await transitionOrderStatus({
      orderId: order.id,
      to: "purchased",
      expectedFrom: "purchasing",
      operatorId: operator,
      eventType: "purchase_completed",
      message: `已采购，平台订单号 ${platformOrderNo}`,
      metadata: { platformOrderNo },
    });
    await transitionOrderStatus({
      orderId: order.id,
      to: "awaiting_shipment",
      expectedFrom: "purchased",
      operatorId: operator,
      eventType: "awaiting_shipment",
      message: "等待商家发货",
    });
    await auditAdminAction({
      orderId: order.id,
      adminUserId: operator,
      action: "purchase_complete",
      detail: `platformOrderNo=${platformOrderNo}`,
    });
    recalcOrderProfitSafe(order.id);
    notifyOrderSafe(order.id, "purchase_success");
    return NextResponse.json({ ok: true, status: "awaiting_shipment" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "failed" }, { status: 409 });
  }
}
