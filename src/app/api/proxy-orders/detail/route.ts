import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyOrderLookup } from "@/lib/orders/orderLookup";
import { getUserIdFromRequest } from "@/lib/auth/session";
import { isOrderStatus, type OrderStatus } from "@/lib/orders/orderStatus";
import { proxyStatusCopy } from "@/data/proxyOrderCopy";
import { maskName, maskPhone, maskAddressLine } from "@/lib/privacy/masking";

export const runtime = "nodejs";

const USER_HIDDEN_EVENTS = new Set(["admin_action", "payment_amount_mismatch"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const orderNo = url.searchParams.get("orderNo");
  const token = url.searchParams.get("token") ?? undefined;
  const phoneLast4 = url.searchParams.get("phoneLast4") ?? undefined;
  if (!id && !orderNo) {
    return NextResponse.json({ error: "id_or_orderNo_required" }, { status: 400 });
  }

  const order = await db.order.findFirst({
    where: id ? { id } : { orderNo: orderNo as string },
    include: {
      address: true,
      shipment: true,
      payments: { orderBy: { createdAt: "desc" } },
      refunds: { orderBy: { createdAt: "desc" } },
      priceAdjustments: { where: { status: "pending" }, orderBy: { createdAt: "desc" }, take: 1 },
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order || order.orderType !== "proxy") {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }
  const reqUserId = getUserIdFromRequest(request);
  const authorized = verifyOrderLookup(order, { token, phoneLast4 }) || (!!reqUserId && order.userId === reqUserId);
  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  const status = (isOrderStatus(order.status) ? order.status : "draft") as OrderStatus;
  let riskFlags: string[] = [];
  try {
    riskFlags = JSON.parse(order.riskFlagsJson || "[]");
  } catch {
    /* ignore */
  }
  const adj = order.priceAdjustments[0];
  let trackingEvents: unknown[] = [];
  if (order.shipment?.trackingRawJson) {
    try {
      const raw = JSON.parse(order.shipment.trackingRawJson) as { events?: unknown[] };
      trackingEvents = raw.events ?? [];
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({
    orderId: order.id,
    orderNo: order.orderNo,
    status,
    statusLabel: proxyStatusCopy[status].label,
    statusDesc: proxyStatusCopy[status].desc,
    product: {
      title: order.productTitle,
      imageUrl: order.productImageUrl,
      brand: order.productBrand,
      spec: order.productSpec,
      quantity: order.quantity,
      sourcePlatform: order.sourcePlatform,
      sourceProductUrl: order.sourceProductUrl,
    },
    breakdown: {
      productPriceCents: order.productPriceCents,
      serviceFeeCents: order.serviceFeeCents,
      domesticShippingFeeCents: order.domesticShippingFeeCents,
      estimatedTotalCents: order.estimatedTotalCents,
      finalTotalCents: order.finalTotalCents,
      amountCents: order.amount,
      currency: order.currency,
    },
    quoteExpiresAt: order.quoteExpiresAt,
    riskFlags,
    address: order.address
      ? {
          recipientName: maskName(order.address.recipientName),
          phone: maskPhone(order.address.phone),
          region: [order.address.province, order.address.city, order.address.district]
            .filter(Boolean)
            .join(""),
          line: maskAddressLine(order.address.addressLine1),
        }
      : null,
    payment: order.payments[0] ? { status: order.payments[0].status } : null,
    shipment: order.shipment
      ? {
          carrierName: order.shipment.carrierName,
          trackingNo: order.shipment.trackingNo,
          status: order.shipment.shippingStatus,
          latestText: order.shipment.latestTrackingText,
          events: trackingEvents,
        }
      : null,
    pendingAdjustment: adj
      ? {
          oldTotalCents: adj.oldTotalCents,
          newTotalCents: adj.newTotalCents,
          diffCents: adj.diffCents,
          reason: adj.reason,
          expiresAt: adj.expiresAt,
        }
      : null,
    refunds: order.refunds.map((r: { status: string; amountCents: number }) => ({ status: r.status, amountCents: r.amountCents })),
    timeline: order.events
      .filter((e: { eventType: string }) => !USER_HIDDEN_EVENTS.has(e.eventType))
      .map((e: { title: string; eventType: string; createdAt: Date }) => ({ title: e.title, eventType: e.eventType, createdAt: e.createdAt })),
  });
}
