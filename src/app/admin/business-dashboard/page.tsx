import Link from "next/link";
import { getBusinessMetrics } from "@/lib/analytics/businessMetrics";
import DashboardCharts from "@/components/admin/DashboardCharts";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";
const yuan = (c: number) => `¥${(c / 100).toFixed(2)}`;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-cream-200 p-3">
      <p className="text-xs text-clay-500">{label}</p>
      <p className="font-serif text-xl text-sage-600">{value}</p>
      {sub && <p className="text-xs text-clay-500">{sub}</p>}
    </div>
  );
}

export default async function BusinessDashboard({ searchParams }: { searchParams: { range?: string } }) {
  const locale = getLocale();
  const range = searchParams.range === "30" ? 30 : searchParams.range === "month" ? 30 : 7;
  const m = await getBusinessMetrics(range);
  const p = (o: Record<string, number>, k: string) => o[k] ?? 0;
  const ranges: [string, string][] = [["7", pick(locale, "近7天", "Last 7 days")], ["30", pick(locale, "近30天", "Last 30 days")]];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "经营看板", "Business dashboard")}</h1>
        <div className="flex gap-2 text-sm">
          {ranges.map(([v, l]) => (
            <Link key={v} href={`/admin/business-dashboard?range=${v}`} className={`rounded-full border px-3 py-1 ${String(range) === v ? "border-sage-500 bg-sage-500 text-white" : "border-cream-300 text-sage-600"}`}>{l}</Link>
          ))}
        </div>
      </div>
      <p className="text-xs text-clay-500">{pick(locale, "数据来自真实数据库；金额以元展示，内部以 cents 存储。利润为累计（按订单最新快照）。", "Data is from the live database; amounts shown in ¥, stored internally in cents. Profit is cumulative (per the latest order snapshot).")}</p>

      <h2 className="mt-5 font-medium text-clay-600">{pick(locale, "流量与测试", "Traffic & quizzes")}</h2>
      <div className="mt-2 grid grid-cols-3 gap-3">
        <Stat label={pick(locale, "测试开始", "Quiz starts")} value={String(m.traffic.quizStarts)} />
        <Stat label={pick(locale, "测试完成", "Quiz completions")} value={String(m.traffic.quizCompletions)} />
        <Stat label={pick(locale, "完成率", "Completion rate")} value={pct(m.traffic.completionRate)} />
      </div>

      <h2 className="mt-5 font-medium text-clay-600">{pick(locale, "商品互动", "Product engagement")}</h2>
      <div className="mt-2 grid grid-cols-4 gap-3">
        <Stat label={pick(locale, "浏览", "Views")} value={String(p(m.products, "view"))} />
        <Stat label={pick(locale, "收藏", "Favorites")} value={String(p(m.products, "favorite"))} />
        <Stat label={pick(locale, "去平台", "Outbound")} value={String(p(m.products, "outbound_click"))} />
        <Stat label={pick(locale, "不喜欢", "Dislikes")} value={String(p(m.products, "dislike"))} />
      </div>

      <h2 className="mt-5 font-medium text-clay-600">{pick(locale, "交易", "Transactions")}</h2>
      <div className="mt-2 grid grid-cols-3 gap-3">
        <Stat label={pick(locale, "支付订单", "Paid orders")} value={String(m.transactions.paidOrders)} />
        <Stat label={pick(locale, "支付金额", "Revenue")} value={yuan(m.transactions.revenueCents)} />
        <Stat label={pick(locale, "客单价", "AOV")} value={yuan(m.transactions.aovCents)} />
        <Stat label={pick(locale, "代下单", "Proxy orders")} value={String(p(m.transactions.byType, "proxy"))} />
        <Stat label={pick(locale, "小样套装", "Sample kits")} value={String(p(m.transactions.byType, "sample_kit"))} />
      </div>

      <h2 className="mt-5 font-medium text-clay-600">{pick(locale, "利润（累计）", "Profit (cumulative)")}</h2>
      <div className="mt-2 grid grid-cols-3 gap-3">
        <Stat label={pick(locale, "收入", "Revenue")} value={yuan(m.profit.revenueCents)} />
        <Stat label={pick(locale, "毛利", "Gross profit")} value={yuan(m.profit.grossCents)} />
        <Stat label={pick(locale, "净利", "Net profit")} value={yuan(m.profit.netCents)} sub={pick(locale, `亏损单 ${m.profit.lossOrders} · 成本不全 ${m.profit.incomplete}`, `${m.profit.lossOrders} loss-making · ${m.profit.incomplete} incomplete cost`)} />
      </div>

      <h2 className="mt-5 font-medium text-clay-600">{pick(locale, "履约（代下单）", "Fulfillment (proxy orders)")}</h2>
      <div className="mt-2 grid grid-cols-4 gap-3">
        <Stat label={pick(locale, "待采购", "To purchase")} value={String(p(m.fulfillment.proxy, "paid"))} />
        <Stat label={pick(locale, "采购中", "Purchasing")} value={String(p(m.fulfillment.proxy, "purchasing"))} />
        <Stat label={pick(locale, "待发货", "To ship")} value={String(p(m.fulfillment.proxy, "awaiting_shipment"))} />
        <Stat label={pick(locale, "已发货", "Shipped")} value={String(p(m.fulfillment.proxy, "shipped"))} />
      </div>

      <h2 className="mt-5 font-medium text-clay-600">{pick(locale, "售后", "After-sales")}</h2>
      <div className="mt-2 grid grid-cols-4 gap-3">
        <Stat label={pick(locale, "工单", "Tickets")} value={String(m.afterSales.tickets)} />
        <Stat label={pick(locale, "售后案", "After-sales cases")} value={String(m.afterSales.cases)} />
        <Stat label={pick(locale, "退款数", "Refund count")} value={String(m.afterSales.refundCount)} />
        <Stat label={pick(locale, "退款额", "Refund amount")} value={yuan(m.afterSales.refundCents)} />
      </div>

      <h2 className="mt-5 font-medium text-clay-600">{pick(locale, "复购 / 转化", "Repeat / conversion")}</h2>
      <div className="mt-2 grid grid-cols-4 gap-3">
        <Stat label={pick(locale, "试香转化", "Sample conversions")} value={String(m.retention.sampleConversions)} />
        <Stat label={pick(locale, "香味衣橱", "Scent wardrobes")} value={String(m.retention.wardrobes)} />
        <Stat label={pick(locale, "用券", "Coupon redemptions")} value={String(m.retention.couponRedemptions)} />
        <Stat label={pick(locale, "正装推荐", "Full-size recs")} value={String(m.retention.fullSizeRecs)} />
      </div>

      <p className="mt-6 text-sm"><Link href="/admin/launch-checklist" className="text-sage-600 underline">{pick(locale, "→ 上线前检查", "→ Launch checklist")}</Link></p>
    </main>
  );
}
