"use client";

/* eslint-disable @next/next/no-img-element */

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import { getProductById } from "@/data/products";

const STATUS_LABELS: Record<string, string> = {
  pending: "待支付",
  paid: "已支付",
  processing: "备货中",
  shipped: "已发货",
  completed: "已完成",
  cancelled: "已取消",
  refunded: "已退款",
};

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
      setError("订单访问凭证缺失，请从创建订单后的链接进入。");
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/order/${orderId}?accessToken=${encodeURIComponent(accessToken)}`);
    if (!res.ok) {
      setError("订单不存在或访问凭证已失效。");
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
        throw new Error(data.error || "支付发起失败");
      }

      const data = await res.json();
      setCodeUrl(data.codeUrl);
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "支付发起失败");
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
        throw new Error(data.error || "取消订单失败");
      }

      setCodeUrl(null);
      await loadOrder();
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "取消订单失败");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="py-16 text-center text-stone-500">订单加载中...</div>
      </PageShell>
    );
  }

  if (error || !order) {
    return (
      <PageShell>
        <div className="py-16 text-center">
          <h1 className="text-xl font-serif text-stone-800">无法查看订单</h1>
          <p className="mt-3 text-sm text-stone-500">{error}</p>
          <Link href="/quiz" className="btn-primary mt-6 inline-flex">
            重新测试
          </Link>
        </div>
      </PageShell>
    );
  }

  const products = order.productIds.map((id) => getProductById(id)).filter(Boolean);
  const qrSrc = codeUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(codeUrl)}`
    : "";

  return (
    <PageShell>
      <div className="py-8 text-center">
        <div className="text-sm text-stone-400">订单号 {order.orderNo}</div>
        <h1 className="mt-2 text-2xl font-serif text-stone-800">
          {STATUS_LABELS[order.status] || order.status}
        </h1>
        <div className="mt-2 text-2xl font-serif text-clay-500">
          ¥{(order.amount / 100).toFixed(1)}
        </div>
      </div>

      <div className="card">
        <h2 className="font-serif text-stone-800">商品</h2>
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
        <h2 className="font-serif text-stone-800">收货信息</h2>
        <div className="mt-4 grid gap-2 text-sm text-stone-600">
          <div>收货人：{order.customerName}</div>
          <div>手机号：{order.customerPhone}</div>
          {order.shippingAddress && <div>地址：{order.shippingAddress}</div>}
          {order.trackingNumber && <div>物流单号：{order.trackingNumber}</div>}
          {order.paidAt && <div>支付时间：{new Date(order.paidAt).toLocaleString("zh-CN")}</div>}
          {order.shippedAt && <div>发货时间：{new Date(order.shippedAt).toLocaleString("zh-CN")}</div>}
        </div>
      </div>

      {order.status === "pending" && (
        <div className="card mt-6 text-center">
          <h2 className="font-serif text-stone-800">微信扫码支付</h2>
          <p className="mt-2 text-sm text-stone-500">
            生成支付二维码后，用微信扫码完成支付。支付成功后刷新订单状态。
          </p>
          <button
            type="button"
            disabled={paying}
            onClick={startWechatNativePay}
            className="btn-primary mt-4"
          >
            {paying ? "生成中..." : codeUrl ? "重新生成二维码" : "生成支付二维码"}
          </button>
          {payError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {payError}
            </div>
          )}
          {codeUrl && (
            <div className="mt-5 flex flex-col items-center gap-3">
              <img src={qrSrc} alt="微信支付二维码" width={220} height={220} />
              <button type="button" className="btn-secondary" onClick={refreshPaymentStatus}>
                我已支付，刷新状态
              </button>
            </div>
          )}
          <button
            type="button"
            disabled={cancelling}
            onClick={cancelOrder}
            className="mt-4 text-sm text-stone-400 hover:text-clay-500"
          >
            {cancelling ? "取消中..." : "取消订单"}
          </button>
        </div>
      )}

      {order.status !== "pending" && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <button type="button" className="btn-secondary" onClick={refreshPaymentStatus}>
            刷新订单状态
          </button>
          {order.sessionId && (
            <Link
              href={`/feedback?sessionId=${order.sessionId}&orderId=${order.orderId}&orderAccessToken=${encodeURIComponent(accessToken)}`}
              className="btn-primary"
            >
              填写试香反馈
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
