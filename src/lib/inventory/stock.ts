import { db } from "@/lib/db";

/** available = stock - reserved (never negative). Pure. */
export function computeAvailable(stockQuantity: number, reservedQuantity: number): number {
  return Math.max(0, stockQuantity - reservedQuantity);
}

export function stockStatus(available: number, threshold = 5): "active" | "low_stock" | "out_of_stock" {
  if (available <= 0) return "out_of_stock";
  if (available <= threshold) return "low_stock";
  return "active";
}

export class OversellError extends Error {
  constructor(message: string) { super(message); this.name = "OversellError"; }
}

type Movement = "inbound" | "outbound" | "reserve" | "release" | "adjust" | "damaged" | "expired";

async function recordAndUpdate(
  skuId: string,
  movement: Movement,
  quantity: number,
  reason: string,
  next: { stockQuantity: number; reservedQuantity: number },
  relatedOrderId?: string,
  createdBy?: string
) {
  const available = computeAvailable(next.stockQuantity, next.reservedQuantity);
  await db.$transaction([
    db.inventorySku.update({
      where: { id: skuId },
      data: { stockQuantity: next.stockQuantity, reservedQuantity: next.reservedQuantity, availableQuantity: available, status: stockStatus(available) },
    }),
    db.stockMovement.create({ data: { skuId, type: movement, quantity, reason, relatedOrderId: relatedOrderId ?? null, createdBy: createdBy ?? null } }),
  ]);
}

/** Reserve stock at order creation. Throws OversellError if insufficient. */
export async function reserveStock(skuId: string, qty: number, relatedOrderId?: string) {
  const sku = await db.inventorySku.findUnique({ where: { id: skuId } });
  if (!sku) throw new OversellError("sku_not_found");
  if (computeAvailable(sku.stockQuantity, sku.reservedQuantity) < qty) {
    throw new OversellError(`insufficient_stock:${sku.skuCode}`);
  }
  await recordAndUpdate(skuId, "reserve", qty, "订单预占", { stockQuantity: sku.stockQuantity, reservedQuantity: sku.reservedQuantity + qty }, relatedOrderId);
}

/** Release a reservation (cancel / refund). */
export async function releaseStock(skuId: string, qty: number, relatedOrderId?: string) {
  const sku = await db.inventorySku.findUnique({ where: { id: skuId } });
  if (!sku) return;
  await recordAndUpdate(skuId, "release", qty, "释放预占", { stockQuantity: sku.stockQuantity, reservedQuantity: Math.max(0, sku.reservedQuantity - qty) }, relatedOrderId);
}

/** Consume reserved stock at fulfillment (deduct from both stock and reserved). */
export async function consumeStock(skuId: string, qty: number, relatedOrderId?: string) {
  const sku = await db.inventorySku.findUnique({ where: { id: skuId } });
  if (!sku) return;
  await recordAndUpdate(skuId, "outbound", qty, "发货出库", { stockQuantity: Math.max(0, sku.stockQuantity - qty), reservedQuantity: Math.max(0, sku.reservedQuantity - qty) }, relatedOrderId);
}

/** Manual adjustment: inbound (+) / adjust (±) / damaged (-) / expired (-). */
export async function adjustStock(skuId: string, movement: Extract<Movement, "inbound" | "adjust" | "damaged" | "expired">, qty: number, reason: string, createdBy?: string) {
  const sku = await db.inventorySku.findUnique({ where: { id: skuId } });
  if (!sku) throw new OversellError("sku_not_found");
  const delta = movement === "inbound" ? qty : movement === "adjust" ? qty : -Math.abs(qty);
  await recordAndUpdate(skuId, movement, qty, reason, { stockQuantity: Math.max(0, sku.stockQuantity + delta), reservedQuantity: sku.reservedQuantity }, undefined, createdBy);
}
