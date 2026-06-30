import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const itemId = sanitizeText(body.itemId, 60);
  const missing = body.missing === true;
  if (!itemId) return NextResponse.json({ error: "itemId_required" }, { status: 400 });
  const item = await db.fulfillmentItem.findUnique({ where: { id: itemId } });
  if (!item || item.fulfillmentOrderId !== params.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await db.fulfillmentItem.update({
    where: { id: itemId },
    data: missing ? { status: "missing" } : { status: "picked", pickedQuantity: item.quantity },
  });
  await db.fulfillmentOrder.update({ where: { id: params.id }, data: { status: "picking" } });
  return NextResponse.json({ ok: true });
}
