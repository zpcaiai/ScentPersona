import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getShippingProvider } from "@/lib/shipping";
import { transitionOrderStatus, recordOrderEvent } from "@/lib/orders/transitionOrderStatus";
import { getAdminOperator } from "@/lib/admin/auth";
import { notifyOrderSafe } from "@/lib/notifications/notifyOrder";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { orderId: string } }) {
  const operator = getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const order = await db.order.findUnique({
    where: { id: params.orderId },
    include: { shipment: true },
  });
  if (!order || order.orderType !== "proxy") {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }
  if (!order.shipment?.trackingNo) {
    return NextResponse.json({ error: "no_tracking_no" }, { status: 400 });
  }

  const provider = getShippingProvider(typeof body.provider === "string" ? body.provider : null);
  if (!provider || !provider.isConfigured()) {
    return NextResponse.json({ error: "provider_unavailable" }, { status: 400 });
  }

  let result;
  try {
    result = await provider.track({
      carrierCode: order.shipment.carrierCode,
      carrierName: order.shipment.carrierName,
      trackingNo: order.shipment.trackingNo,
    });
  } catch (err) {
    // Logistics failures never break the order flow.
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "track_failed" },
      { status: 200 }
    );
  }

  await db.orderShipment.update({
    where: { orderId: order.id },
    data: {
      shippingStatus: result.status,
      latestTrackingText: result.latestText ?? null,
      trackingRawJson: JSON.stringify(result),
      lastSyncedAt: new Date(),
      deliveredAt: result.status === "delivered" ? new Date() : order.shipment.deliveredAt,
    },
  });

  if (result.status === "delivered" && order.status === "shipped") {
    await transitionOrderStatus({
      orderId: order.id,
      to: "delivered",
      expectedFrom: "shipped",
      operatorId: operator,
      eventType: "delivered",
      message: "物流显示已签收",
    });
    notifyOrderSafe(order.id, "delivered");
    await db.sampleFeedbackFlow.upsert({ where: { orderId: order.id }, create: { orderId: order.id, userId: order.userId, status: "day1_sent" }, update: {} }).catch(() => undefined);
    notifyOrderSafe(order.id, "sample_feedback_reminder");
  } else if (result.status === "exception") {
    await recordOrderEvent({
      orderId: order.id,
      eventType: "shipment_exception",
      title: "物流异常",
      message: result.latestText ?? "",
      operatorId: operator,
    });
  }

  return NextResponse.json({ ok: true, status: result.status, latestText: result.latestText });
}
