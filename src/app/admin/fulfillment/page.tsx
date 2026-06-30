import Link from "next/link";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";
export const dynamic = "force-dynamic";
export default async function FulfillmentPage({ searchParams }: { searchParams: { status?: string } }) {
  const locale = getLocale();
  const status = searchParams.status;
  const list = await db.fulfillmentOrder.findMany({ where: status ? { status } : {}, orderBy: { createdAt: "desc" }, take: 100, include: { items: true } });
  const filters: { value: string; label: string }[] = [
    { value: "all", label: pick(locale, "全部", "All") },
    { value: "pending", label: pick(locale, "待处理", "Pending") },
    { value: "picking", label: pick(locale, "拣货中", "Picking") },
    { value: "packed", label: pick(locale, "已打包", "Packed") },
    { value: "shipped", label: pick(locale, "已发货", "Shipped") },
  ];
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "自营履约（拣货 / 打包 / 发货）", "Self-fulfillment (pick / pack / ship)")}</h1>
      <div className="mt-3 flex gap-2 text-sm">
        {filters.map((f) => (
          <Link key={f.value} href={`/admin/fulfillment${f.value === "all" ? "" : `?status=${f.value}`}`} className="rounded-full border border-cream-300 px-3 py-1 text-sage-600">{f.label}</Link>
        ))}
      </div>
      <table className="mt-4 w-full text-sm">
        <thead className="text-left text-clay-500"><tr><th className="py-2">{pick(locale, "履约单", "Fulfillment")}</th><th>{pick(locale, "类型", "Type")}</th><th>{pick(locale, "商品数", "Items")}</th><th>{pick(locale, "状态", "Status")}</th><th></th></tr></thead>
        <tbody>
          {list.map((f: { id: string; fulfillmentNo: string; type: string; status: string; items: { id: string }[] }) => (
            <tr key={f.id} className="border-t border-cream-200">
              <td className="py-2 font-mono text-xs">{f.fulfillmentNo}</td>
              <td>{f.type}</td>
              <td>{f.items.length}</td>
              <td>{f.status}</td>
              <td><Link href={`/admin/fulfillment/${f.id}`} className="text-sage-600 underline">{pick(locale, "处理", "Process")}</Link></td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-clay-500">{pick(locale, "暂无履约单（可由自营小样订单生成）", "No fulfillment orders yet (generated from self-fulfilled sample orders)")}</td></tr>}
        </tbody>
      </table>
    </main>
  );
}
