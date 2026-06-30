import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reserveStock } from "@/lib/inventory/stock";
import { getAdminOperator } from "@/lib/admin/auth";
import { auditAdminAction } from "@/lib/admin/audit";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";
const no = () => `F${new Date().toISOString().slice(0, 10).replace(/-/g, "")}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

export async function POST(request: Request) {
  const operator = getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const orderId = sanitizeText(body.orderId, 60);
  const type = sanitizeText(body.type, 20) ?? "sample_kit";
  const items = Array.isArray(body.items) ? (body.items as Record<string, unknown>[]) : [];
  if (!orderId || items.length === 0) return NextResponse.json({ error: "order_and_items_required" }, { status: 400 });

  const ff = await db.fulfillmentOrder.create({
    data: {
      orderId,
      fulfillmentNo: no(),
      type,
      warehouse: sanitizeText(body.warehouse, 60),
      items: {
        create: items.slice(0, 50).map((i) => ({
          skuId: sanitizeText(i.skuId, 60),
          skuName: sanitizeText(i.skuName, 120) ?? "未命名",
          quantity: Number.isFinite(i.quantity) ? Math.max(1, Math.floor(Number(i.quantity))) : 1,
        })),
      },
    },
    include: { items: true },
  });

  // Best-effort reservation for items linked to a SKU.
  for (const it of ff.items) {
    if (it.skuId) await reserveStock(it.skuId, it.quantity, orderId).catch(() => undefined);
  }
  await auditAdminAction({ orderId, adminUserId: operator, action: "fulfillment_create", detail: ff.fulfillmentNo });
  return NextResponse.json({ ok: true, id: ff.id, fulfillmentNo: ff.fulfillmentNo });
}
