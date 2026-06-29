import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createWechatRefund, isWechatConfigured } from "@/lib/wechat-pay";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim()
      : "用户退款";

    const order = await db.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!["paid", "processing", "shipped", "completed"].includes(order.status)) {
      return NextResponse.json(
        { error: `Order status is ${order.status}, cannot refund` },
        { status: 400 }
      );
    }

    if (order.platform === "weapp" || order.platform === "web") {
      if (!isWechatConfigured()) {
        return NextResponse.json(
          { error: "WeChat Pay is not configured" },
          { status: 503 }
        );
      }

      await createWechatRefund({
        orderNo: order.orderNo,
        outRefundNo: `RF${order.orderNo}${Date.now()}`,
        amount: order.amount,
        reason,
      });
    }

    const updated = await db.order.update({
      where: { id: order.id },
      data: {
        status: "refunded",
        refundedAt: new Date(),
      },
    });

    return NextResponse.json({
      orderId: updated.id,
      status: updated.status,
      refundedAt: updated.refundedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Refund failed: ${message}` },
      { status: 500 }
    );
  }
}
