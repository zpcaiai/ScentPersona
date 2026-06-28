import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOrderAccessAuthorized, isPendingOrderExpired } from "@/lib/order-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let order = await db.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (isPendingOrderExpired(order)) {
      order = await db.order.update({
        where: { id: order.id },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
        },
      });
    }

    const accessToken =
      request.nextUrl.searchParams.get("accessToken") ||
      request.headers.get("x-order-access-token");

    if (!isOrderAccessAuthorized(order.accessToken, accessToken)) {
      return NextResponse.json(
        { error: "Unauthorized order access" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      orderNo: order.orderNo,
      sessionId: order.sessionId,
      productType: order.productType,
      productIds: JSON.parse(order.productIdsJson),
      amount: order.amount,
      status: order.status,
      platform: order.platform,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      trackingNumber: order.trackingNumber,
      note: order.note,
      transactionId: order.transactionId,
      paidAt: order.paidAt,
      shippedAt: order.shippedAt,
      completedAt: order.completedAt,
      cancelledAt: order.cancelledAt,
      refundedAt: order.refundedAt,
      createdAt: order.createdAt,
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
