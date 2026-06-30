import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transitionOrderStatus, recordOrderEvent } from "@/lib/orders/transitionOrderStatus";
import { auditAdminAction } from "@/lib/admin/audit";
import { getAdminOperator } from "@/lib/admin/auth";
import { notifyOrderSafe } from "@/lib/notifications/notifyOrder";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { orderId: string } }) {
  const operator = getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const carrierName = sanitizeText(body.carrierName, 40);
  const carrierCode = sanitizeText(body.carrierCode, 40);
  const trackingNo = sanitizeText(body.trackingNo, 64);
  if (!carrierName || !trackingNo) {
    return NextResponse.json({ error: "carrier_and_tracking_required" }, { status: 400 });
  }

  const order = await db.order.findUnique({ where: { id: params.orderId } });
  if (!order || order.orderType !== "proxy") {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }

  await db.orderShipment.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      carrierName,
      carrierCode,
      trackingNo,
      shippingStatus: "shipped",
      shippedAt: new Date(),
    },
    update: { carrierName, carrierCode, trackingNo, shippingStatus: "shipped" },
  });
  await db.order.update({ where: { id: order.id }, data: { trackingNumber: trackingNo } });

  try {
    if (order.status === "awaiting_shipment") {
      await transitionOrderStatus({
        orderId: order.id,
        to: "shipped",
        expectedFrom: "awaiting_shipment",
        operatorId: operator,
        eventType: "shipment_created",
        message: `${carrierName} ${trackingNo}`,
        metadata: { carrierName, trackingNo },
      });
    } else {
      await recordOrderEvent({
        orderId: order.id,
        eventType: "shipment_updated",
        title: "更新物流单号",
        message: `${carrierName} ${trackingNo}`,
        operatorId: operator,
      });
    }
    notifyOrderSafe(order.id, "shipment_created", { carrier: carrierName, trackingNo });
    await auditAdminAction({ orderId: order.id, adminUserId: operator, action: "shipment_set", detail: trackingNo });
    return NextResponse.json({ ok: true, status: order.status === "awaiting_shipment" ? "shipped" : order.status });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "failed" }, { status: 409 });
  }
}
