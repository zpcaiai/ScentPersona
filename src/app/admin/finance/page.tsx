import Link from "next/link";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin/session";
import { hasPermission } from "@/lib/admin/permissions";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";
const yuan = (c: number) => `¥${(c / 100).toFixed(2)}`;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

interface Snap {
  id: string; orderId: string; orderType: string; revenueCents: number;
  grossProfitCents: number; netProfitCents: number; profitStatus: string; calculatedAt: Date;
}

export default async function FinanceDashboard() {
  const locale = getLocale();
  if (!hasPermission(getAdminSession()?.role, "finance:view")) {
    return <main className="mx-auto max-w-2xl px-4 py-8"><p className="text-clay-600">{pick(locale, "无权查看财务。", "You do not have permission to view finance.")}</p></main>;
  }
  // Latest snapshot per order (dedupe newest-first).
  const raw = (await db.orderProfitSnapshot.findMany({
    orderBy: { calculatedAt: "desc" },
    take: 3000,
  })) as Snap[];
  const latest = new Map<string, Snap>();
  for (const s of raw) if (!latest.has(s.orderId)) latest.set(s.orderId, s);
  const snaps = [...latest.values()];

  const orderIds = snaps.map((s) => s.orderId);
  const orders = (await db.order.findMany({
    where: { id: { in: orderIds } },
    select: { id: true, createdAt: true, orderNo: true },
  })) as { id: string; createdAt: Date; orderNo: string }[];
  const createdAt = new Map(orders.map((o) => [o.id, o.createdAt]));
  const orderNo = new Map(orders.map((o) => [o.id, o.orderNo]));

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  function sum(filter: (s: Snap) => boolean) {
    const f = snaps.filter(filter);
    return {
      count: f.length,
      revenue: f.reduce((a, s) => a + s.revenueCents, 0),
      gross: f.reduce((a, s) => a + s.grossProfitCents, 0),
      net: f.reduce((a, s) => a + s.netProfitCents, 0),
    };
  }
  const inDay = (s: Snap) => (createdAt.get(s.orderId) ?? new Date(0)) >= startToday;
  const inMonth = (s: Snap) => (createdAt.get(s.orderId) ?? new Date(0)) >= startMonth;

  const today = sum(inDay);
  const month = sum(inMonth);
  const lossOrders = snaps.filter((s) => s.netProfitCents < 0);
  const incomplete = snaps.filter((s) => s.profitStatus === "incomplete");

  const byType = ["proxy", "sample_kit"].map((t) => ({ type: t, ...sum((s) => s.orderType === t) }));

  const Card = ({ title, b }: { title: string; b: { count: number; revenue: number; gross: number; net: number } }) => (
    <div className="rounded-xl border border-cream-200 p-4">
      <p className="text-sm text-clay-500">{title}{pick(locale, `（${b.count} 单）`, ` (${b.count} orders)`)}</p>
      <p className="mt-1 text-2xl font-serif text-sage-600">{yuan(b.revenue)}</p>
      <p className="text-sm text-sage-600">{pick(locale, "毛利", "Gross")} {yuan(b.gross)} · {pick(locale, "净利", "Net")} {yuan(b.net)}</p>
      <p className="text-xs text-clay-500">{pick(locale, "毛利率", "Gross margin")} {b.revenue > 0 ? pct(b.gross / b.revenue) : "—"} · {pick(locale, "净利率", "Net margin")} {b.revenue > 0 ? pct(b.net / b.revenue) : "—"}</p>
    </div>
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin/proxy-orders" className="text-sm text-sage-600 underline">{pick(locale, "← 代下单工作台", "← Proxy order workbench")}</Link>
      <h1 className="mt-2 font-serif text-2xl text-sage-600">{pick(locale, "经营 · 利润核算", "Finance · Profit accounting")}</h1>
      <p className="text-sm text-clay-500">{pick(locale, "金额以元展示，内部以 cents 存储。退款/采购成本变化后会重新计算（保留历史快照）。", "Amounts shown in ¥, stored internally in cents. Recalculated after refunds or purchase-cost changes (historical snapshots are kept).")}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card title={pick(locale, "今日", "Today")} b={today} />
        <Card title={pick(locale, "本月", "This month")} b={month} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {byType.map((t) => (
          <Card key={t.type} title={t.type === "proxy" ? pick(locale, "代下单（累计）", "Proxy orders (cumulative)") : pick(locale, "小样套装（累计）", "Sample kits (cumulative)")} b={t} />
        ))}
      </div>

      <section className="mt-6">
        <h2 className="font-medium text-clay-600">{pick(locale, `⚠️ 亏损订单（${lossOrders.length}）`, `⚠️ Loss-making orders (${lossOrders.length})`)}</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {lossOrders.slice(0, 20).map((s) => (
            <li key={s.id} className="flex justify-between border-b border-cream-200 py-1">
              <span className="font-mono text-xs">{orderNo.get(s.orderId) ?? s.orderId}</span>
              <span className="text-red-600">{pick(locale, "净利", "Net")} {yuan(s.netProfitCents)}</span>
            </li>
          ))}
          {lossOrders.length === 0 && <li className="text-clay-500">{pick(locale, "暂无亏损订单。", "No loss-making orders.")}</li>}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="font-medium text-clay-600">{pick(locale, `成本不完整（${incomplete.length}）`, `Incomplete cost (${incomplete.length})`)}</h2>
        <p className="text-xs text-clay-500">{pick(locale, "代下单未录入采购成本，利润仅供参考。请在工作台完成采购并录入成本。", "Purchase cost not entered for these proxy orders, so profit is indicative only. Complete the purchase and enter the cost in the workbench.")}</p>
        <ul className="mt-2 space-y-1 text-sm">
          {incomplete.slice(0, 20).map((s) => (
            <li key={s.id} className="flex justify-between border-b border-cream-200 py-1">
              <span className="font-mono text-xs">{orderNo.get(s.orderId) ?? s.orderId}</span>
              <Link href={`/admin/proxy-orders/${s.orderId}`} className="text-sage-600 underline">{pick(locale, "去补录", "Enter cost")}</Link>
            </li>
          ))}
          {incomplete.length === 0 && <li className="text-clay-500">{pick(locale, "无。", "None.")}</li>}
        </ul>
      </section>
    </main>
  );
}
