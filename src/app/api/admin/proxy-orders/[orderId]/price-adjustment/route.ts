import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transitionOrderStatus } from "@/lib/orders/transitionOrderStatus";
import { auditAdminAction } from "@/lib/admin/audit";
import { getAdminOperator } from "@/lib/admin/auth";
import { notifyOrderSafe } from "@/lib/notifications/notifyOrder";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

const ADJUSTMENT_TTL_MS = 48 * 60 * 60 * 1000;

export async function POST(request: Request, { params }: { params: { orderId: string } }) {
  const operator = getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const newProductPriceCents =
    typeof body.newProductPriceCents === "number" && body.newProductPriceCents > 0
      ? Math.round(body.newProductPriceCents)
      : null;
  const reason = sanitizeText(body.reason, 200);
  if (!newProductPriceCents || !reason) {
    return NextResponse.json({ error: "price_and_reason_required" }, { status: 400 });
  }

  const order = await db.order.findUnique({ where: { id: params.orderId } });
  if (!order || order.orderType !== "proxy") {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }

  const oldTotal = order.amount;
  const newTotal =
    newProductPriceCents + (order.serviceFeeCents ?? 0) + (order.domesticShippingFeeCents ?? 0);
  const diff = newTotal - oldTotal;

  const adjustment = await db.orderPriceAdjustment.create({
    data: {
      orderId: order.id,
      oldTotalCents: oldTotal,
      newTotalCents: newTotal,
      diffCents: diff,
      reason,
      status: "pending",
      expiresAt: new Date(Date.now() + ADJUSTMENT_TTL_MS),
    },
  });

  try {
    await transitionOrderStatus({
      orderId: order.id,
      to: "price_changed",
      expectedFrom: "purchasing",
      operatorId: operator,
      eventType: "price_changed",
      message: reason,
      metadata: { adjustmentId: adjustment.id, oldTotal, newTotal, diff },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "failed" }, { status: 409 });
  }
  await auditAdminAction({
    orderId: order.id,
    adminUserId: operator,
    action: "price_adjustment_create",
    detail: `diff=${diff}`,
  });

  notifyOrderSafe(order.id, "price_changed");
  return NextResponse.json({ ok: true, adjustmentId: adjustment.id, diffCents: diff, newTotalCents: newTotal });
}
