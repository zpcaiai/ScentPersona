import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOrderAccessAuthorized } from "@/lib/order-utils";
import { createXhsOrder, isXhsConfigured } from "@/lib/xhs-pay";

export async function POST(request: NextRequest) {
  try {
    if (!isXhsConfigured()) {
      return NextResponse.json(
        { error: "XHS Pay is not configured. Set XHS_APP_ID, XHS_APP_SECRET, XHS_MERCHANT_ID env vars." },
        { status: 503 }
      );
    }

    const body = await request.json();

    if (!body || !body.orderId || !body.accessToken) {
      return NextResponse.json(
        { error: "Invalid request: orderId and accessToken are required" },
        { status: 400 }
      );
    }

    const order = await db.order.findUnique({
      where: { id: body.orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (!isOrderAccessAuthorized(order.accessToken, body.accessToken)) {
      return NextResponse.json(
        { error: "Unauthorized order access" },
        { status: 403 }
      );
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: `Order status is ${order.status}, cannot initiate payment` },
        { status: 400 }
      );
    }

    const description = `ScentPersona ${order.productType}`;
    const prepayResult = await createXhsOrder({
      orderNo: order.orderNo,
      amount: order.amount,
      description,
    });

    await db.order.update({
      where: { id: order.id },
      data: { prepayId: prepayResult.tradeNo },
    });

    return NextResponse.json({
      tradeNo: prepayResult.tradeNo,
      timeStamp: prepayResult.timeStamp,
      nonceStr: prepayResult.nonceStr,
      signType: prepayResult.signType,
      paySign: prepayResult.paySign,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `XHS Pay error: ${message}` },
      { status: 500 }
    );
  }
}
