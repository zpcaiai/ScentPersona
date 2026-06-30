import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminOperator } from "@/lib/admin/auth";
import { maskName, maskPhone } from "@/lib/privacy/masking";

export const runtime = "nodejs";
const slipNo = () => `PS${Date.now().toString(36).toUpperCase()}`;

export async function POST(request: Request, { params }: { params: { id: string } }) {
  getAdminOperator(request);
  const ff = await db.fulfillmentOrder.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!ff) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const pending = ff.items.filter((i: { status: string }) => i.status === "pending");
  if (pending.length > 0) return NextResponse.json({ error: "items_not_all_picked" }, { status: 409 });

  const order = await db.order.findUnique({ where: { id: ff.orderId } });
  const content = {
    orderNo: order?.orderNo,
    recipient: order ? `${maskName(order.customerName)} ${maskPhone(order.customerPhone)}` : "",
    items: ff.items.map((i: { skuName: string; quantity: number }) => ({ name: i.skuName, qty: i.quantity })),
    note: "气味人格卡随包装附赠；如有缺货请联系客服。",
  };
  await db.packingSlip.upsert({
    where: { fulfillmentOrderId: ff.id },
    create: { fulfillmentOrderId: ff.id, slipNo: slipNo(), contentJson: JSON.stringify(content), printedAt: new Date() },
    update: { contentJson: JSON.stringify(content), printedAt: new Date() },
  });
  await db.fulfillmentOrder.update({ where: { id: ff.id }, data: { status: "packed" } });
  return NextResponse.json({ ok: true });
}
