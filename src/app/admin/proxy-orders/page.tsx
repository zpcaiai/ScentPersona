import Link from "next/link";
import { db } from "@/lib/db";
import { getProxyStatusCopy } from "@/data/proxyOrderCopy";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";
import { isOrderStatus, type OrderStatus } from "@/lib/orders/orderStatus";
import { maskName, maskPhone } from "@/lib/privacy/masking";

export const dynamic = "force-dynamic";

const yuan = (c: number) => `¥${(c / 100).toFixed(2)}`;

export default async function AdminProxyOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const locale = getLocale();
  const statusCopy = getProxyStatusCopy(locale);
  const FILTERS: { key: string; label: string }[] = [
    { key: "all", label: pick(locale, "全部", "All") },
    { key: "paid", label: pick(locale, "待采购", "To purchase") },
    { key: "purchasing", label: pick(locale, "采购中", "Purchasing") },
    { key: "price_changed", label: pick(locale, "价格变化", "Price changed") },
    { key: "out_of_stock", label: pick(locale, "缺货", "Out of stock") },
    { key: "awaiting_shipment", label: pick(locale, "待发货", "To ship") },
    { key: "shipped", label: pick(locale, "已发货", "Shipped") },
    { key: "refund_pending", label: pick(locale, "退款中", "Refunding") },
  ];
  const status = searchParams.status && searchParams.status !== "all" ? searchParams.status : null;
  const orders = await db.order.findMany({
    where: { orderType: "proxy", ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { shipment: true, refunds: { where: { status: "requested" }, take: 1 } },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "代下单工作台", "Proxy orders")}</h1>
      <p className="text-sm text-clay-600">{pick(locale, "生产环境必须启用管理员认证与权限控制（当前为 Basic Auth）。", "Production must enable admin auth and access control (currently Basic Auth).")}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/proxy-orders?status=${f.key}`}
            className={`rounded-full border px-3 py-1 text-sm ${
              (status ?? "all") === f.key ? "border-sage-500 bg-sage-500 text-white" : "border-cream-300 text-sage-600"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <table className="mt-4 w-full text-sm">
        <thead className="text-left text-clay-500">
          <tr>
            <th className="py-2">{pick(locale, "订单号", "Order")}</th><th>{pick(locale, "商品", "Product")}</th><th>{pick(locale, "客户", "Customer")}</th><th>{pick(locale, "金额", "Amount")}</th><th>{pick(locale, "状态", "Status")}</th><th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const s = (isOrderStatus(o.status) ? o.status : "draft") as OrderStatus;
            return (
              <tr key={o.id} className="border-t border-cream-200">
                <td className="py-2 font-mono text-xs">{o.orderNo}</td>
                <td className="max-w-[220px] truncate">{o.productTitle}</td>
                <td>{maskName(o.customerName)} {maskPhone(o.customerPhone)}</td>
                <td>{yuan(o.finalTotalCents ?? o.amount)}</td>
                <td>
                  <span className="rounded bg-cream-100 px-2 py-0.5 text-xs">{statusCopy[s].label}</span>
                  {o.refunds.length > 0 && <span className="ml-1 text-xs text-red-600">{pick(locale, "退款申请", "Refund request")}</span>}
                </td>
                <td><Link href={`/admin/proxy-orders/${o.id}`} className="text-sage-600 underline">{pick(locale, "处理", "Manage")}</Link></td>
              </tr>
            );
          })}
          {orders.length === 0 && (
            <tr><td colSpan={6} className="py-8 text-center text-clay-500">{pick(locale, "暂无订单", "No orders")}</td></tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
