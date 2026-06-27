import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const phone = request.nextUrl.searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        { error: "phone parameter is required" },
        { status: 400 }
      );
    }

    const orders = await db.order.findMany({
      where: { customerPhone: phone },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      orders: orders.map((o) => ({
        orderId: o.id,
        orderNo: o.orderNo,
        orderAccessToken: o.accessToken,
        productType: o.productType,
        productIds: JSON.parse(o.productIdsJson),
        amount: o.amount,
        status: o.status,
        platform: o.platform,
        createdAt: o.createdAt,
        paidAt: o.paidAt,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
