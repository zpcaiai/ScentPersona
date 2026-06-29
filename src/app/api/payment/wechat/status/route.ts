import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isOrderAccessAuthorized } from "@/lib/order-utils";
import {
  getWechatMerchantId,
  isWechatConfigured,
  queryWechatOrderByOutTradeNo,
} from "@/lib/wechat-pay";

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

    const order = await db.order.findUnique({ where: { id: body.orderId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!isOrderAccessAuthorized(order.accessToken, body.accessToken)) {
      return NextResponse.json(
        { error: "Unauthorized order access" },
        { status: 403 }
      );
    }

    if (order.status !== "pending") {
      return NextResponse.json({ status: order.status });
    }

    const result = await queryWechatOrderByOutTradeNo(order.orderNo);

    if (result.mchid && result.mchid !== getWechatMerchantId()) {
      return NextResponse.json(
        { error: "Merchant mismatch" },
        { status: 400 }
      );
    }

    if (typeof result.amount === "number" && result.amount !== order.amount) {
      return NextResponse.json(
        { error: "Amount mismatch" },
        { status: 400 }
      );
    }

    if (result.tradeState === "SUCCESS") {
      const updated = await db.order.update({
        where: { id: order.id },
        data: {
          status: "paid",
          transactionId: result.transactionId || order.transactionId,
          paidAt: result.successTime ? new Date(result.successTime) : new Date(),
        },
      });

      return NextResponse.json({ status: updated.status });
    }

    return NextResponse.json({ status: order.status, tradeState: result.tradeState });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `WeChat Pay status error: ${message}` },
      { status: 500 }
    );
  }
}
