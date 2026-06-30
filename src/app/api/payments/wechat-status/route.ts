import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// Minimal, non-sensitive: is the latest WeChat payment for this order paid?
export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ paid: false });
  const payment = await db.orderPayment.findFirst({
    where: { orderId, provider: "wechat" },
    orderBy: { createdAt: "desc" },
    select: { status: true },
  });
  return NextResponse.json({ paid: payment?.status === "paid" });
}
