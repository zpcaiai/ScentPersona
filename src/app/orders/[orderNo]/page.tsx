"use client";

/* eslint-disable @next/next/no-img-element */
import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";
import { getProxyCopy } from "@/data/proxyOrderCopy";
import { isOrderStatus } from "@/lib/orders/orderStatus";

const yuan = (c?: number | null) => (c == null ? "—" : `¥${(c / 100).toFixed(2)}`);

interface Detail {
  orderId: string;
  orderNo: string;
  status: string;
  statusLabel: string;
  statusDesc: string;
  product: { title?: string; imageUrl?: string; brand?: string; spec?: string; quantity?: number; sourcePlatform?: string };
  breakdown: { productPriceCents?: number; serviceFeeCents?: number; domesticShippingFeeCents?: number; estimatedTotalCents?: number; finalTotalCents?: number; amountCents?: number };
  address: { recipientName: string; phone: string; region: string; line: string } | null;
  payment: { status: string } | null;
  shipment: { carrierName?: string; trackingNo?: string; status: string; latestText?: string; events: { time?: string; location?: string; text?: string }[] } | null;
  pendingAdjustment: { oldTotalCents: number; newTotalCents: number; diffCents: number; reason: string } | null;
  refunds: { status: string; amountCents: number }[];
  timeline: { title: string; eventType: string; createdAt: string }[];
}

function OrderInner() {
  const { locale } = useLang();
  const proxy = getProxyCopy(locale);
  const params = useParams<{ orderNo: string }>();
  const search = useSearchParams();
  const orderNo = params.orderNo;
  const token = search.get("token") ?? (typeof window !== "undefined" ? window.localStorage.getItem(`proxyToken:${orderNo}`) ?? "" : "");

  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/proxy-orders/detail?orderNo=${encodeURIComponent(orderNo)}&token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : (setDetail(d), setError(null))))
      .catch(() => setError(pick(locale, "加载失败", "Failed to load")))
      .finally(() => setLoading(false));
  }, [orderNo, token, locale]);

  useEffect(() => {
    if (token) window.localStorage.setItem(`proxyToken:${orderNo}`, token);
    load();
  }, [load, orderNo, token]);

  const act = useCallback(
    async (path: string, body: Record<string, unknown>) => {
      if (!detail) return;
      setBusy(true);
      setError(null);
      try {
        const r = await fetch(`/api/proxy-orders/${detail.orderId}/${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, ...body }),
        });
        const j = await r.json();
        if (!r.ok) setError(j.error || pick(locale, "操作失败", "Action failed"));
        else if (j.checkoutUrl) window.location.href = j.checkoutUrl;
        else load();
      } catch {
        setError(pick(locale, "网络错误", "Network error"));
      } finally {
        setBusy(false);
      }
    },
    [detail, token, load, locale]
  );

  if (loading) return <p className="text-sage-600">{pick(locale, "加载中…", "Loading…")}</p>;
  if (error && !detail)
    return (
      <div className="space-y-2">
        <p className="text-red-600">{pick(locale, "无法查看订单：", "Couldn't open this order: ")}{error}</p>
        <p className="text-sm text-sage-600">{pick(locale, "请通过订单链接打开，或核对手机号后四位。", "Open it from your order link, or check the last 4 digits of your phone number.")}</p>
      </div>
    );
  if (!detail) return null;
  const b = detail.breakdown;
  const statusLabel = isOrderStatus(detail.status) ? proxy.statusCopy[detail.status].label : detail.statusLabel;
  const statusDesc = isOrderStatus(detail.status) ? proxy.statusCopy[detail.status].desc : detail.statusDesc;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-clay-600">{pick(locale, "订单", "Order")} {detail.orderNo}</p>
        <h1 className="font-serif text-2xl text-sage-600">{statusLabel}</h1>
        <p className="text-sage-600">{statusDesc}</p>
      </div>

      {detail.pendingAdjustment && (
        <section className="rounded-2xl border border-clay-400 bg-clay-50/50 p-4">
          <p className="font-medium text-clay-600">{pick(locale, "采购时价格发生变化", "The price changed at purchase")}</p>
          <p className="text-sm text-sage-600">{pick(locale, "原因：", "Reason: ")}{detail.pendingAdjustment.reason}</p>
          <dl className="mt-2 text-sm">
            <div className="flex justify-between"><dt>{pick(locale, "原报价", "Original quote")}</dt><dd>{yuan(detail.pendingAdjustment.oldTotalCents)}</dd></div>
            <div className="flex justify-between"><dt>{pick(locale, "新价格", "New price")}</dt><dd>{yuan(detail.pendingAdjustment.newTotalCents)}</dd></div>
            <div className="flex justify-between font-semibold"><dt>{pick(locale, "差价", "Difference")}</dt><dd className="text-clay-600">{yuan(detail.pendingAdjustment.diffCents)}</dd></div>
          </dl>
          <div className="mt-3 flex gap-2">
            <button disabled={busy} onClick={() => act("price-adjustment/accept", {})} className="flex-1 rounded-lg bg-sage-500 py-2 text-sm text-white disabled:opacity-50">{pick(locale, "支付差价 / 继续", "Pay the difference / continue")}</button>
            <button disabled={busy} onClick={() => act("price-adjustment/reject", {})} className="flex-1 rounded-lg border border-clay-300 py-2 text-sm text-clay-600 disabled:opacity-50">{pick(locale, "不接受，申请退款", "Decline and request a refund")}</button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-cream-200 bg-cream-50 p-4">
        <div className="flex gap-3">
          {detail.product.imageUrl && <img src={detail.product.imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />}
          <div className="flex-1">
            <p className="text-xs text-clay-500">{detail.product.sourcePlatform}</p>
            <p className="font-medium leading-snug">{detail.product.title}</p>
            <p className="text-sm text-sage-600">{detail.product.brand} {detail.product.spec} · ×{detail.product.quantity}</p>
          </div>
        </div>
        <dl className="mt-3 space-y-1 border-t border-cream-200 pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-sage-600">{pick(locale, "商品价", "Item price")}</dt><dd>{yuan(b.productPriceCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-sage-600">{pick(locale, "服务费", "Service fee")}</dt><dd>{yuan(b.serviceFeeCents)}</dd></div>
          <div className="flex justify-between border-t border-cream-200 pt-2 font-semibold"><dt>{pick(locale, "实付", "Paid")}</dt><dd className="text-clay-600">{yuan(b.finalTotalCents ?? b.amountCents)}</dd></div>
        </dl>
      </section>

      {detail.address && (
        <section className="rounded-2xl border border-cream-200 p-4 text-sm">
          <p className="font-medium text-sage-600">{pick(locale, "收货信息", "Shipping details")}</p>
          <p className="mt-1">{detail.address.recipientName} · {detail.address.phone}</p>
          <p className="text-sage-600">{detail.address.region} {detail.address.line}</p>
        </section>
      )}

      {detail.shipment && (
        <section className="rounded-2xl border border-cream-200 p-4 text-sm">
          <p className="font-medium text-sage-600">{pick(locale, "物流", "Shipping")}</p>
          <p className="mt-1">{detail.shipment.carrierName} {detail.shipment.trackingNo}</p>
          {detail.shipment.latestText && <p className="text-sage-600">{detail.shipment.latestText}</p>}
          {detail.shipment.events?.length > 0 && (
            <ul className="mt-2 space-y-1 border-l border-cream-300 pl-3 text-xs text-sage-600">
              {detail.shipment.events.map((e, i) => (
                <li key={i}>{e.text} {e.location ? `· ${e.location}` : ""}</li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-clay-500">{proxy.shippingNotice}</p>
        </section>
      )}

      <section className="rounded-2xl border border-cream-200 p-4">
        <p className="font-medium text-sage-600">{pick(locale, "订单进度", "Order progress")}</p>
        <ul className="mt-2 space-y-2 border-l border-sage-400 pl-4 text-sm">
          {detail.timeline.map((e, i) => (
            <li key={i}>
              <p>{e.title}</p>
              <p className="text-xs text-clay-500">{new Date(e.createdAt).toLocaleString(locale === "en" ? "en-US" : "zh-CN")}</p>
            </li>
          ))}
        </ul>
      </section>

      {detail.status === "delivered" && (
        <a href={`/orders/${detail.orderNo}/feedback?token=${encodeURIComponent(token)}`} className="block rounded-xl bg-sage-500 py-2.5 text-center text-sm text-white">已签收？来填写试香反馈，领正装抵扣券</a>
      )}

      {["shipped", "delivered", "after_sales"].includes(detail.status) && (
        <a href={`/orders/${detail.orderNo}/after-sales?token=${encodeURIComponent(token)}`} className="block rounded-xl border border-clay-300 py-2.5 text-center text-sm text-clay-600">{pick(locale, "遇到问题？申请售后", "Run into a problem? Request after-sales")}</a>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {["paid", "purchasing", "out_of_stock", "price_changed"].includes(detail.status) &&
        !detail.refunds.some((r) => r.status === "requested") && (
          <div className="space-y-2">
            <button disabled={busy} onClick={() => act("refund-request", { reason: "用户申请退款" })} className="w-full rounded-xl border border-clay-300 py-2.5 text-sm text-clay-600 disabled:opacity-50">{pick(locale, "申请退款", "Request a refund")}</button>
            <p className="text-center text-xs text-clay-500">{proxy.refundNotice}</p>
          </div>
        )}
    </div>
  );
}

export default function ProxyOrderCenterPage() {
  return (
    <PageShell>
      <Suspense fallback={<OrderFallback />}>
        <OrderInner />
      </Suspense>
    </PageShell>
  );
}

function OrderFallback() {
  const { locale } = useLang();
  return <p className="text-sage-600">{pick(locale, "加载中…", "Loading…")}</p>;
}
