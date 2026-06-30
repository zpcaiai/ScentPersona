import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeAvailable, stockStatus } from "@/lib/inventory/stock";
import { getAdminOperator } from "@/lib/admin/auth";
import { auditAdminAction } from "@/lib/admin/audit";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";
const TYPES = ["sample", "full_size", "gift_box", "packaging", "accessory"];

export async function POST(request: Request) {
  const operator = getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const skuCode = sanitizeText(body.skuCode, 40);
  const name = sanitizeText(body.name, 120);
  const type = sanitizeText(body.type, 20) ?? "sample";
  if (!skuCode || !name || !TYPES.includes(type)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const stock = Number.isFinite(body.stockQuantity) ? Math.max(0, Math.floor(Number(body.stockQuantity))) : 0;
  const costCents = Number.isFinite(body.costCents) ? Math.max(0, Math.round(Number(body.costCents))) : 0;
  const available = computeAvailable(stock, 0);

  const sku = await db.inventorySku.create({
    data: {
      skuCode, name, type,
      productId: sanitizeText(body.productId, 60),
      volumeMl: Number.isFinite(body.volumeMl) ? Number(body.volumeMl) : null,
      batchNo: sanitizeText(body.batchNo, 60),
      expirationDate: body.expirationDate ? new Date(String(body.expirationDate)) : null,
      stockQuantity: stock,
      reservedQuantity: 0,
      availableQuantity: available,
      costCents,
      status: stockStatus(available),
    },
  });
  if (stock > 0) {
    await db.stockMovement.create({ data: { skuId: sku.id, type: "inbound", quantity: stock, reason: "初始入库", createdBy: operator } });
  }
  await auditAdminAction({ adminUserId: operator, action: "inventory_create", detail: skuCode });
  return NextResponse.json({ ok: true, id: sku.id });
}
