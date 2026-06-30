import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { consumeStock } from "@/lib/inventory/stock";
import { getAdminOperator } from "@/lib/admin/auth";
import { auditAdminAction } from "@/lib/admin/audit";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const operator = getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const carrierName = sanitizeText(body.carrierName, 40);
  const trackingNo = sanitizeText(body.trackingNo, 64);
  if (!carrierName || !trackingNo) return NextResponse.json({ error: "carrier_and_tracking_required" }, { status: 400 });

  const ff = await db.fulfillmentOrder.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!ff) return NextResponse.json({ error: "not_found" }, { status: 404 });

  for (const it of ff.items) {
    if (it.skuId && it.status !== "missing") await consumeStock(it.skuId, it.quantity, ff.orderId).catch(() => undefined);
  }
  await db.fulfillmentOrder.update({ where: { id: ff.id }, data: { status: "shipped" } });
  // Update the underlying (sample-kit) order's shipping info.
  await db.order.update({
    where: { id: ff.orderId },
    data: { status: "shipped", trackingNumber: trackingNo, shippedAt: new Date() },
  }).catch(() => undefined);
  await auditAdminAction({ orderId: ff.orderId, adminUserId: operator, action: "fulfillment_ship", detail: trackingNo });
  return NextResponse.json({ ok: true });
}
