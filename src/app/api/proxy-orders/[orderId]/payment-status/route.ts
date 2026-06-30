import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyOrderLookup } from "@/lib/orders/orderLookup";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: { orderId: string } }) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? undefined;
  const phoneLast4 = url.searchParams.get("phoneLast4") ?? undefined;

  const order = await db.order.findUnique({
    where: { id: params.orderId },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!order || order.orderType !== "proxy") {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }
  if (!verifyOrderLookup(order, { token, phoneLast4 })) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  const payment = order.payments[0];
  return NextResponse.json({
    orderStatus: order.status,
    payment: payment
      ? { status: payment.status, amountCents: payment.amountCents, provider: payment.provider }
      : null,
  });
}
