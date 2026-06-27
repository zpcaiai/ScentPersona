import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOrderAccessAuthorized } from "@/lib/order-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await db.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
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
      note: order.note,
      transactionId: order.transactionId,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
