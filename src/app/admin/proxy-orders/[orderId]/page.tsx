import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getProxyStatusCopy } from "@/data/proxyOrderCopy";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";
import { isOrderStatus, type OrderStatus } from "@/lib/orders/orderStatus";
import ProxyOrderAdminActions from "@/components/admin/ProxyOrderAdminActions";

export const dynamic = "force-dynamic";
const yuan = (c?: number | null) => (c == null ? "—" : `¥${(c / 100).toFixed(2)}`);

export default async function AdminProxyOrderDetail({ params }: { params: { orderId: string } }) {
  const order = await db.order.findUnique({
    where: { id: params.orderId },
    include: {
      address: true,
      purchase: true,
      shipment: true,
      payments: { orderBy: { createdAt: "desc" } },
      refunds: { orderBy: { createdAt: "desc" } },
      priceAdjustments: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order || order.orderType !== "proxy") notFound();
  const locale = getLocale();
  const statusCopy = getProxyStatusCopy(locale);
  const s = (isOrderStatus(order.status) ? order.status : "draft") as OrderStatus;
  const pendingRefund = order.refunds.find((r: { status: string }) => r.status === "requested");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/admin/proxy-orders" className="text-sm text-sage-600 underline">{pick(locale, "← 返回列表", "← Back to list")}</Link>
      <h1 className="mt-2 font-serif text-2xl text-sage-600">{order.orderNo}</h1>
      <p className="text-sage-600">{pick(locale, "状态", "Status")}: {statusCopy[s].label} ({order.status})</p>

      <ProxyOrderAdminActions
        orderId={order.id}
        status={order.status}
        hasPendingRefund={Boolean(pendingRefund)}
      />

      <section className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-xl border border-cream-200 p-3">
          <p className="font-medium text-sage-600">{pick(locale, "商品", "Product")}</p>
          <p>{order.productTitle}</p>
          <p className="text-clay-500">{order.sourcePlatform} · ×{order.quantity}</p>
          <a href={order.sourceProductUrl ?? "#"} target="_blank" rel="noreferrer" className="text-xs text-sage-600 underline">{pick(locale, "源链接", "Source link")}</a>
        </div>
        <div className="rounded-xl border border-cream-200 p-3">
          <p className="font-medium text-sage-600">{pick(locale, "金额", "Amount")}</p>
          <p>{pick(locale, "商品", "Product")} {yuan(order.productPriceCents)} · {pick(locale, "服务费", "Service fee")} {yuan(order.serviceFeeCents)}</p>
          <p>{pick(locale, "实付", "Paid")} {yuan(order.finalTotalCents ?? order.amount)}</p>
          <p className="text-clay-500">{pick(locale, "采购成本", "Purchase cost")} {yuan(order.purchase?.purchaseCostCents)} {pick(locale, "（不展示给用户）", "(hidden from user)")}</p>
        </div>
        <div className="rounded-xl border border-cream-200 p-3">
          <p className="font-medium text-sage-600">{pick(locale, "收货（完整，敏感）", "Shipping (full, sensitive)")}</p>
          {order.address ? (
            <>
              <p>{order.address.recipientName} · {order.address.phone}</p>
              <p>{order.address.province}{order.address.city}{order.address.district} {order.address.addressLine1}</p>
            </>
          ) : <p className="text-clay-500">{pick(locale, "未填写", "Not provided")}</p>}
        </div>
        <div className="rounded-xl border border-cream-200 p-3">
          <p className="font-medium text-sage-600">{pick(locale, "采购 / 物流", "Purchase / Tracking")}</p>
          <p>{pick(locale, "平台订单号", "Platform order no.")}: {order.purchase?.platformOrderNo ?? "—"}</p>
          <p>{pick(locale, "运单", "Tracking")}: {order.shipment?.carrierName ?? "—"} {order.shipment?.trackingNo ?? ""}</p>
        </div>
      </section>

      <section className="mt-6">
        <p className="font-medium text-sage-600">{pick(locale, "事件时间线", "Event timeline")}</p>
        <ul className="mt-2 space-y-1 border-l border-sage-400 pl-4 text-sm">
          {order.events.map((e: { id: string; createdAt: Date; title: string; message: string | null; operatorId: string | null }) => (
            <li key={e.id}>
              <span className="text-clay-500">{new Date(e.createdAt).toLocaleString("zh-CN")}</span> · {e.title}
              {e.message ? <span className="text-clay-500"> — {e.message}</span> : null}
              {e.operatorId ? <span className="text-xs text-sage-600"> [{e.operatorId}]</span> : null}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
