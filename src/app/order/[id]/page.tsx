"use client";

/* eslint-disable @next/next/no-img-element */

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import { getProductById } from "@/data/products";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick, type Locale } from "@/lib/i18n/config";

function statusLabel(status: string, locale: Locale): string {
  switch (status) {
    case "pending": return pick(locale, "待支付", "Awaiting payment");
    case "paid": return pick(locale, "已支付", "Paid");
    case "processing": return pick(locale, "备货中", "Preparing");
    case "shipped": return pick(locale, "已发货", "Shipped");
    case "completed": return pick(locale, "已完成", "Completed");
    case "cancelled": return pick(locale, "已取消", "Cancelled");
    case "refunded": return pick(locale, "已退款", "Refunded");
    default: return status;
  }
}

interface OrderDetail {
  orderId: string;
  orderNo: string;
  sessionId: string | null;
  productIds: string[];
  amount: number;
  status: string;
  platform: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string | null;
  trackingNumber: string | null;
  transactionId: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

function OrderContent() {
  const { locale } = useLang();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const orderId = params.id;
  const accessToken = useMemo(() => {
    if (typeof window === "undefined") return searchParams.get("accessToken") ?? "";
    return (
      searchParams.get("accessToken") ||
      window.localStorage.getItem(`orderAccessToken:${orderId}`) ||
      ""
    );
  }, [orderId, searchParams]);

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [codeUrl, setCodeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = async () => {
    if (!accessToken) {
      setError(pick(locale, "订单访问凭证缺失，请从创建订单后的链接进入。", "Your order access token is missing. Please open the order from the link you got after creating it."));
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/order/${orderId}?accessToken=${encodeURIComponent(accessToken)}`);
    if (!res.ok) {
      setError(pick(locale, "订单不存在或访问凭证已失效。", "This order doesn't exist or the access token has expired."));
      setLoading(false);
      return;
    }

    setOrder(await res.json());
    setLoading(false);
  };

  const refreshPaymentStatus = async () => {
    if (order?.status === "pending") {
      await fetch("/api/payment/wechat/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, accessToken }),
      }).catch(() => {});
    }

    await loadOrder();
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, accessToken]);

  const startWechatNativePay = async () => {
    setPaying(true);
    setPayError(null);
    setCodeUrl(null);

    try {
      const res = await fetch("/api/payment/wechat-native", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, accessToken }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || pick(locale, "支付发起失败", "Couldn't start payment"));
      }

      const data = await res.json();
      setCodeUrl(data.codeUrl);
    } catch (err) {
      setPayError(err instanceof Error ? err.message : pick(locale, "支付发起失败", "Couldn't start payment"));
    } finally {
      setPaying(false);
    }
  };

  const cancelOrder = async () => {
    setCancelling(true);
    setPayError(null);

    try {
      const res = await fetch(`/api/order/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || pick(locale, "取消订单失败", "Couldn't cancel the order"));
      }

      setCodeUrl(null);
      await loadOrder();
    } catch (err) {
      setPayError(err instanceof Error ? err.message : pick(locale, "取消订单失败", "Couldn't cancel the order"));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="py-16 text-center text-stone-500">{pick(locale, "订单加载中...", "Loading order...")}</div>
      </PageShell>
    );
  }

  if (error || !order) {
    return (
      <PageShell>
        <div className="py-16 text-center">
          <h1 className="text-xl font-serif text-stone-800">{pick(locale, "无法查看订单", "Couldn't open this order")}</h1>
          <p className="mt-3 text-sm text-stone-500">{error}</p>
          <Link href="/quiz" className="btn-primary mt-6 inline-flex">
            {pick(locale, "重新测试", "Retake the quiz")}
          </Link>
        </div>
      </PageShell>
    );
  }

  const products = order.productIds.map((id) => getProductById(id, locale)).filter(Boolean);
  const qrSrc = codeUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(codeUrl)}`
    : "";

  return (
    <PageShell>
      <div className="py-8 text-center">
        <div className="text-sm text-stone-400">{pick(locale, "订单号", "Order number")} {order.orderNo}</div>
        <h1 className="mt-2 text-2xl font-serif text-stone-800">
          {statusLabel(order.status, locale)}
        </h1>
        <div className="mt-2 text-2xl font-serif text-clay-500">
          ¥{(order.amount / 100).toFixed(1)}
        </div>
      </div>

      <div className="card">
        <h2 className="font-serif text-stone-800">{pick(locale, "商品", "Items")}</h2>
        <div className="mt-4 grid gap-3">
          {products.map((product) => product && (
            <div key={product.id} className="flex justify-between gap-4 text-sm">
              <span className="text-stone-700">{product.name}</span>
              <span className="text-stone-400">1.5ml</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="font-serif text-stone-800">{pick(locale, "收货信息", "Shipping details")}</h2>
        <div className="mt-4 grid gap-2 text-sm text-stone-600">
          <div>{pick(locale, "收货人：", "Recipient: ")}{order.customerName}</div>
          <div>{pick(locale, "手机号：", "Phone: ")}{order.customerPhone}</div>
          {order.shippingAddress && <div>{pick(locale, "地址：", "Address: ")}{order.shippingAddress}</div>}
          {order.trackingNumber && <div>{pick(locale, "物流单号：", "Tracking number: ")}{order.trackingNumber}</div>}
          {order.paidAt && <div>{pick(locale, "支付时间：", "Paid at: ")}{new Date(order.paidAt).toLocaleString(locale === "en" ? "en-US" : "zh-CN")}</div>}
          {order.shippedAt && <div>{pick(locale, "发货时间：", "Shipped at: ")}{new Date(order.shippedAt).toLocaleString(locale === "en" ? "en-US" : "zh-CN")}</div>}
        </div>
      </div>

      {order.status === "pending" && (
        <div className="card mt-6 text-center">
          <h2 className="font-serif text-stone-800">{pick(locale, "微信扫码支付", "Pay by WeChat QR")}</h2>
          <p className="mt-2 text-sm text-stone-500">
            {pick(
              locale,
              "生成支付二维码后，用微信扫码完成支付。支付成功后刷新订单状态。",
              "Generate the payment QR code, then scan it with WeChat to pay. Refresh the order status once payment succeeds."
            )}
          </p>
          <button
            type="button"
            disabled={paying}
            onClick={startWechatNativePay}
            className="btn-primary mt-4"
          >
            {paying ? pick(locale, "生成中...", "Generating...") : codeUrl ? pick(locale, "重新生成二维码", "Regenerate QR code") : pick(locale, "生成支付二维码", "Generate payment QR code")}
          </button>
          {payError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {payError}
            </div>
          )}
          {codeUrl && (
            <div className="mt-5 flex flex-col items-center gap-3">
              <img src={qrSrc} alt={pick(locale, "微信支付二维码", "WeChat Pay QR code")} width={220} height={220} />
              <button type="button" className="btn-secondary" onClick={refreshPaymentStatus}>
                {pick(locale, "我已支付，刷新状态", "I've paid — refresh status")}
              </button>
            </div>
          )}
          <button
            type="button"
            disabled={cancelling}
            onClick={cancelOrder}
            className="mt-4 text-sm text-stone-400 hover:text-clay-500"
          >
            {cancelling ? pick(locale, "取消中...", "Cancelling...") : pick(locale, "取消订单", "Cancel order")}
          </button>
        </div>
      )}

      {order.status !== "pending" && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <button type="button" className="btn-secondary" onClick={refreshPaymentStatus}>
            {pick(locale, "刷新订单状态", "Refresh order status")}
          </button>
          {order.sessionId && (
            <Link
              href={`/feedback?sessionId=${order.sessionId}&orderId=${order.orderId}&orderAccessToken=${encodeURIComponent(accessToken)}`}
              className="btn-primary"
            >
              {pick(locale, "填写试香反馈", "Share scent trial feedback")}
            </Link>
          )}
        </div>
      )}
    </PageShell>
  );
}

export default function OrderPage() {
  return (
    <Suspense>
      <OrderContent />
    </Suspense>
  );
}
