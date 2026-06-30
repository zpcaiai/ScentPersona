import Link from "next/link";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";
export const dynamic = "force-dynamic";
export default async function InventoryPage() {
  const locale = getLocale();
  const dateLocale = locale === "en" ? "en-US" : "zh-CN";
  const skus = await db.inventorySku.findMany({ orderBy: { updatedAt: "desc" }, take: 200 });
  const low = skus.filter((s: { availableQuantity: number }) => s.availableQuantity <= 5);
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "自营库存", "Inventory")}</h1>
      {low.length > 0 && <p className="mt-1 text-sm text-clay-600">⚠️ {pick(locale, `${low.length} 个 SKU 低库存/缺货`, `${low.length} SKU${low.length > 1 ? "s" : ""} low / out of stock`)}</p>}
      <table className="mt-4 w-full text-sm">
        <thead className="text-left text-clay-500"><tr><th className="py-2">SKU</th><th>{pick(locale, "名称", "Name")}</th><th>{pick(locale, "类型", "Type")}</th><th>{pick(locale, "可用", "Available")}</th><th>{pick(locale, "预占", "Reserved")}</th><th>{pick(locale, "批号/有效期", "Batch / expiry")}</th><th></th></tr></thead>
        <tbody>
          {skus.map((s: { id: string; skuCode: string; name: string; type: string; availableQuantity: number; reservedQuantity: number; batchNo: string | null; expirationDate: Date | null; status: string }) => (
            <tr key={s.id} className="border-t border-cream-200">
              <td className="py-2 font-mono text-xs">{s.skuCode}</td>
              <td>{s.name}</td>
              <td>{s.type}</td>
              <td className={s.availableQuantity <= 5 ? "text-red-600" : ""}>{s.availableQuantity}</td>
              <td>{s.reservedQuantity}</td>
              <td className="text-xs text-clay-500">{s.batchNo ?? "—"} {s.expirationDate ? new Date(s.expirationDate).toLocaleDateString(dateLocale) : ""}</td>
              <td><Link href={`/admin/inventory/${s.id}`} className="text-sage-600 underline">{pick(locale, "管理", "Manage")}</Link></td>
            </tr>
          ))}
          {skus.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-clay-500">{pick(locale, "暂无 SKU", "No SKUs yet")}</td></tr>}
        </tbody>
      </table>
    </main>
  );
}
