"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import { SITE_COPY } from "@/data/copy";
import { PRODUCTS, getProductById } from "@/data/products";
import TrackEvent, { trackEvent } from "@/components/common/TrackEvent";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const selectedProductIds = searchParams.get("productIds");
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    note: "",
  });

  useEffect(() => {
    if (sessionId) {
      fetch(`/api/quiz/result?sessionId=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.recommendedProductIds) {
            setRecommendedIds(data.recommendedProductIds);
          }
        })
        .catch(() => {});
    }
  }, [sessionId]);

  const selectedValidProductIds = selectedProductIds
    ? selectedProductIds.split(",").filter((id) => getProductById(id))
    : [];
  const checkoutProductIds = Array.from(new Set([
    ...(selectedValidProductIds.length > 0 ? selectedValidProductIds : recommendedIds),
    ...PRODUCTS.map((product) => product.id),
  ])).slice(0, 3);

  const recommendedProducts = checkoutProductIds
    .map((id) => getProductById(id))
    .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const productIds = checkoutProductIds.length > 0
        ? checkoutProductIds
        : PRODUCTS.slice(0, 3).map((p) => p.id);

      const res = await fetch("/api/order/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId ?? undefined,
          productType: "sample-set-3",
          productIds,
          amount: 2990,
          platform: "web",
          customerName: form.name,
          customerPhone: form.phone,
          shippingAddress: form.address || undefined,
          note: form.note || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "订单创建失败");
      }

      const data = await res.json();
      window.localStorage.setItem(`orderAccessToken:${data.orderId}`, data.orderAccessToken);
      trackEvent({
        eventName: "checkout_submit",
        path: "/checkout",
        sessionId,
        orderId: data.orderId,
      });
      router.push(`/order/${data.orderId}?accessToken=${encodeURIComponent(data.orderAccessToken)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "订单创建失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <TrackEvent
        eventName="checkout_view"
        path="/checkout"
        sessionId={sessionId}
      />
      <div className="py-8">
        <h1 className="text-2xl font-serif text-stone-800 text-center">
          {SITE_COPY.checkout.title}
        </h1>
        <p className="mt-2 text-sm text-stone-500 text-center">
          {SITE_COPY.checkout.subtitle}
        </p>
      </div>
      {recommendedProducts.length > 0 && (
        <div className="mt-6">
          <h3 className="font-serif text-stone-700 mb-3">你的推荐小样</h3>
          <div className="grid gap-3">
            {recommendedProducts.map((product) => product && (
              <div key={product.id} className="card flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-serif text-stone-800">{product.name}</div>
                  <div className="text-xs text-stone-500 mt-1">
                    {product.plainDescription}
                  </div>
                </div>
                <div className="text-sm text-clay-500">1.5ml</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-stone-600">气味人格小样套装</span>
          <span className="text-xl font-serif text-clay-500">29.9元</span>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label className="text-sm text-stone-600 block mb-1">姓名 *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm focus:outline-none focus:border-sage-400"
            />
          </div>
          <div>
            <label className="text-sm text-stone-600 block mb-1">手机号 *</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm focus:outline-none focus:border-sage-400"
            />
          </div>
          <div>
            <label className="text-sm text-stone-600 block mb-1">收货地址 *</label>
            <input
              type="text"
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm focus:outline-none focus:border-sage-400"
            />
          </div>
          <div>
            <label className="text-sm text-stone-600 block mb-1">备注（选填）</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm focus:outline-none focus:border-sage-400"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "创建订单中..." : "创建订单并去支付"}
          </button>
        </form>
      </div>
    </PageShell>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
