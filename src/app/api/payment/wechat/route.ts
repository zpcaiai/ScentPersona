import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOrderAccessAuthorized, isPendingOrderExpired } from "@/lib/order-utils";
import { createWechatJsapiOrder, isWechatConfigured } from "@/lib/wechat-pay";

export async function POST(request: NextRequest) {
  try {
    if (!isWechatConfigured()) {
      return NextResponse.json(
        { error: "WeChat Pay is not configured. Set WECHAT_APPID, WECHAT_MCHID, WECHAT_PRIVATE_KEY, WECHAT_APIV3_KEY env vars." },
        { status: 503 }
      );
    }

    const body = await request.json();

    if (!body || !body.orderId || !body.openid || !body.accessToken) {
      return NextResponse.json(
        { error: "Invalid request: orderId, accessToken and openid are required" },
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

    const description = `ScentPersona ${order.productType}`;
    const prepayResult = await createWechatJsapiOrder({
      orderNo: order.orderNo,
      amount: order.amount,
      description,
      openid: body.openid,
    });

    await db.order.update({
      where: { id: order.id },
      data: { prepayId: prepayResult.prepayId },
    });

    return NextResponse.json({
      timeStamp: prepayResult.timeStamp,
      nonceStr: prepayResult.nonceStr,
      package: prepayResult.package,
      signType: prepayResult.signType,
      paySign: prepayResult.paySign,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `WeChat Pay error: ${message}` },
      { status: 500 }
    );
  }
}
