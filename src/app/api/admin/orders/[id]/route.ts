import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const ORDER_STATUSES = new Set([
  "pending",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const status = typeof body.status === "string" ? body.status : undefined;
    const trackingNumber =
      typeof body.trackingNumber === "string" ? body.trackingNumber.trim() : undefined;

    if (!status || !ORDER_STATUSES.has(status)) {
      return NextResponse.json(
        { error: "Invalid request: unsupported order status" },
        { status: 400 }
      );
    }

    const now = new Date();
    const data: {
      status: string;
      trackingNumber?: string | null;
      paidAt?: Date;
      shippedAt?: Date;
      completedAt?: Date;
      cancelledAt?: Date;
      refundedAt?: Date;
    } = { status };

    if (trackingNumber !== undefined) {
      data.trackingNumber = trackingNumber || null;
    }

    if (status === "paid") data.paidAt = now;
    if (status === "shipped") data.shippedAt = now;
    if (status === "completed") data.completedAt = now;
    if (status === "cancelled") data.cancelledAt = now;
    if (status === "refunded") data.refundedAt = now;

    const order = await db.order.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      trackingNumber: order.trackingNumber,
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
