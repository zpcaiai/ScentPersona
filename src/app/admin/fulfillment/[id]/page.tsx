import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import FulfillmentActions from "@/components/admin/FulfillmentActions";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";
export const dynamic = "force-dynamic";
export default async function FulfillmentDetail({ params }: { params: { id: string } }) {
  const locale = getLocale();
  const ff = await db.fulfillmentOrder.findUnique({ where: { id: params.id }, include: { items: true, packingSlip: true } });
  if (!ff) notFound();
  const order = await db.order.findUnique({ where: { id: ff.orderId } });
  let slip: { recipient?: string; items?: { name: string; qty: number }[]; note?: string } | null = null;
  if (ff.packingSlip) { try { slip = JSON.parse(ff.packingSlip.contentJson); } catch { /* */ } }
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/admin/fulfillment" className="text-sm text-sage-600 underline">← {pick(locale, "履约", "Fulfillment")}</Link>
      <h1 className="mt-2 font-serif text-2xl text-sage-600">{ff.fulfillmentNo}</h1>
      <p className="text-sage-600">{pick(locale, "状态", "Status")} {ff.status} · {pick(locale, "关联订单", "Order")} {order?.orderNo ?? ff.orderId}</p>
      <FulfillmentActions id={ff.id} status={ff.status} items={ff.items.map((i: { id: string; skuName: string; status: string; quantity: number }) => ({ id: i.id, skuName: i.skuName, status: i.status, quantity: i.quantity }))} />
      {ff.packingSlip && slip && (
        <section className="mt-6 rounded-xl border border-cream-200 p-3 text-sm">
          <p className="font-medium text-sage-600">{pick(locale, "打包单", "Packing slip")} {ff.packingSlip.slipNo}</p>
          <p className="text-clay-500">{slip.recipient}</p>
          <ul className="mt-1">{(slip.items ?? []).map((i, n) => <li key={n}>· {i.name} ×{i.qty}</li>)}</ul>
          <p className="mt-1 text-xs text-clay-500">{slip.note}</p>
        </section>
      )}
    </main>
  );
}
