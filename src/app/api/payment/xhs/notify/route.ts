import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyXhsCallback } from "@/lib/xhs-pay";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sign = (body.sign || "") as string;
    const { sign: _sign, ...params } = body as Record<string, string>;

    if (!verifyXhsCallback(params, sign)) {
      return NextResponse.json(
        { code: "FAIL", message: "Signature verification failed" },
        { status: 400 }
      );
    }

    const orderNo = params.out_trade_no;
    const tradeStatus = params.trade_status;

    const order = await db.order.findUnique({
      where: { orderNo },
    });

    if (!order) {
      return NextResponse.json(
        { code: "FAIL", message: "Order not found" },
        { status: 404 }
      );
    }

    if (order.status === "paid") {
      return NextResponse.json({ code: "SUCCESS", message: "OK" });
    }

    const callbackAmount = params.total_amount ? Number(params.total_amount) : null;
    if (callbackAmount !== null && callbackAmount !== order.amount) {
      return NextResponse.json(
        { code: "FAIL", message: "Amount mismatch" },
        { status: 400 }
      );
    }

    if (tradeStatus === "SUCCESS") {
      await db.order.update({
        where: { id: order.id },
        data: {
          status: "paid",
          transactionId: params.trade_no || null,
          paidAt: new Date(),
        },
      });
    }

    return NextResponse.json({ code: "SUCCESS", message: "OK" });
  } catch {
    return NextResponse.json(
      { code: "FAIL", message: "Internal error" },
      { status: 500 }
    );
  }
}
