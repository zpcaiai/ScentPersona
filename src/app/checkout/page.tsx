"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import { SITE_COPY } from "@/data/copy";
import { PRODUCTS, getProductById } from "@/data/products";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
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

  const recommendedProducts = recommendedIds
    .map((id) => getProductById(id))
    .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/purchase/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId ?? undefined,
          productType: "three_sample_kit",
          productIds: recommendedIds.length > 0 ? recommendedIds : PRODUCTS.slice(0, 3).map((p) => p.id),
          price: 2990,
          customerName: form.name,
          customerPhone: form.phone,
          customerEmail: form.email || undefined,
          note: form.note || undefined,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <PageShell>
        <div className="text-center py-16">
          <h1 className="text-xl font-serif text-stone-800">
            {SITE_COPY.checkout.successTitle}
          </h1>
          <p className="mt-3 text-stone-600 leading-relaxed">
            {SITE_COPY.checkout.successDesc}
          </p>
          <div className="mt-6 flex flex-col gap-3 items-center">
            <Link href="/feedback" className="btn-primary w-48">
              填写试香反馈
            </Link>
            <Link href="/" className="btn-secondary w-48">
              返回首页
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="py-8">
        <h1 className="text-2xl font-serif text-stone-800 text-center">
          {SITE_COPY.checkout.title}
        </h1>
        <p className="mt-2 text-sm text-stone-500 text-center">
          {SITE_COPY.checkout.subtitle}
        </p>
      </div>

      {/* TODO: Integrate real payment (Stripe/WeChat Pay/Alipay) here */}

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
            <label className="text-sm text-stone-600 block mb-1">邮箱（选填）</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "提交中..." : "确认领取（模拟支付）"}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
