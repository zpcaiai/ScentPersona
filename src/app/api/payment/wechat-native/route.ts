import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOrderAccessAuthorized, isPendingOrderExpired } from "@/lib/order-utils";
import { createWechatNativeOrder, isWechatConfigured } from "@/lib/wechat-pay";

export async function POST(request: NextRequest) {
  try {
    if (!isWechatConfigured()) {
      return NextResponse.json(
        { error: "WeChat Pay is not configured" },
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
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!isOrderAccessAuthorized(order.accessToken, body.accessToken)) {
      return NextResponse.json(
        { error: "Unauthorized order access" },
        { status: 403 }
      );
    }

    if (isPendingOrderExpired(order)) {
      await db.order.update({
        where: { id: order.id },
        data: { status: "cancelled", cancelledAt: new Date() },
      });
      return NextResponse.json(
        { error: "Order has expired" },
        { status: 400 }
      );
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: `Order status is ${order.status}, cannot initiate payment` },
        { status: 400 }
      );
    }

    const result = await createWechatNativeOrder({
      orderNo: order.orderNo,
      amount: order.amount,
      description: `ScentPersona ${order.productType}`,
    });

    return NextResponse.json({
      codeUrl: result.codeUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `WeChat Native Pay error: ${message}` },
      { status: 500 }
    );
  }
}
