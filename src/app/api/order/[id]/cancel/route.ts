import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOrderAccessAuthorized } from "@/lib/order-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const accessToken = body?.accessToken || request.headers.get("x-order-access-token");

    const order = await db.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!isOrderAccessAuthorized(order.accessToken, accessToken)) {
      return NextResponse.json(
        { error: "Unauthorized order access" },
        { status: 403 }
      );
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: `Order status is ${order.status}, cannot cancel` },
        { status: 400 }
      );
    }

    const updated = await db.order.update({
      where: { id: order.id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({
      orderId: updated.id,
      status: updated.status,
      cancelledAt: updated.cancelledAt,
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
