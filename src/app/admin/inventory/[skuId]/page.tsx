import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import InventoryAdjust from "@/components/admin/InventoryAdjust";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";
export const dynamic = "force-dynamic";
export default async function SkuDetail({ params }: { params: { skuId: string } }) {
  const locale = getLocale();
  const dateLocale = locale === "en" ? "en-US" : "zh-CN";
  const sku = await db.inventorySku.findUnique({ where: { id: params.skuId }, include: { movements: { orderBy: { createdAt: "desc" }, take: 30 } } });
  if (!sku) notFound();
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/admin/inventory" className="text-sm text-sage-600 underline">← {pick(locale, "库存", "Inventory")}</Link>
      <h1 className="mt-2 font-serif text-2xl text-sage-600">{sku.name}</h1>
      <p className="text-sage-600">{sku.skuCode} · {pick(locale, "在库", "On hand")} {sku.stockQuantity} · {pick(locale, "预占", "Reserved")} {sku.reservedQuantity} · {pick(locale, "可用", "Available")} {sku.availableQuantity} · {sku.status}</p>
      <p className="text-xs text-clay-500">{pick(locale, "批号", "Batch")} {sku.batchNo ?? "—"} · {pick(locale, "有效期", "Expiry")} {sku.expirationDate ? new Date(sku.expirationDate).toLocaleDateString(dateLocale) : "—"} · {pick(locale, "成本", "Cost")} ¥{(sku.costCents / 100).toFixed(2)}</p>
      <InventoryAdjust skuId={sku.id} />
      <h2 className="mt-6 font-medium text-sage-600">{pick(locale, "库存流水", "Stock movements")}</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {sku.movements.map((m: { id: string; type: string; quantity: number; reason: string; createdAt: Date }) => (
          <li key={m.id} className="flex justify-between border-b border-cream-200 py-1">
            <span>{m.type} · {m.quantity} · {m.reason}</span>
            <span className="text-xs text-clay-500">{new Date(m.createdAt).toLocaleString(dateLocale)}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
