import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || !body.productType || typeof body.price !== "number") {
      return NextResponse.json(
        { error: "Invalid request: productType and price are required" },
        { status: 400 }
      );
    }

    if (!body.customerName || !body.customerPhone) {
      return NextResponse.json(
        { error: "Invalid request: customerName and customerPhone are required" },
        { status: 400 }
      );
    }

    const intent = await db.purchaseIntent.create({
      data: {
        sessionId: body.sessionId ?? null,
        productType: body.productType,
        productIdsJson: JSON.stringify(body.productIds ?? []),
        price: body.price,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerEmail: body.customerEmail ?? null,
        note: body.note ?? null,
        status: "created",
      },
    });

    // 说明：本接口仅记录“购买意向”（轻量线索捕获），不发起支付。
    // 真实下单与支付路径为：POST /api/order/create 创建订单，
    // 再调用 /api/payment/wechat（微信）或 /api/payment/xhs（小红书）发起支付，
    // 支付结果由 /api/payment/wechat/notify、/api/payment/xhs/notify 回调更新。

    return NextResponse.json({
      purchaseIntentId: intent.id,
      status: "created",
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
