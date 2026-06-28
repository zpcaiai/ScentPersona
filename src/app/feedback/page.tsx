"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import { SITE_COPY } from "@/data/copy";
import { PRODUCTS } from "@/data/products";

function FeedbackContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const purchaseIntentId = searchParams.get("purchaseIntentId");
  const orderId = searchParams.get("orderId");
  const orderAccessToken = searchParams.get("orderAccessToken");

  const [personaId, setPersonaId] = useState<string | null>(null);
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [favoriteProduct, setFavoriteProduct] = useState<string | null>(null);
  const [dislikedProducts, setDislikedProducts] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [boughtFullSize, setBoughtFullSize] = useState(false);
  const [fullSizeProduct, setFullSizeProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackAllowed, setFeedbackAllowed] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetch(`/api/quiz/result?sessionId=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.personaId) setPersonaId(data.personaId);
          if (data.recommendedProductIds) setRecommendedIds(data.recommendedProductIds);
        })
        .catch(() => {});
    }
  }, [sessionId]);

  useEffect(() => {
    if (orderId && orderAccessToken) {
      fetch(`/api/order/${orderId}?accessToken=${encodeURIComponent(orderAccessToken)}`)
        .then(async (res) => {
          if (!res.ok) throw new Error("order unavailable");
          return res.json();
        })
        .then((order) => {
          setFeedbackAllowed(!["pending", "cancelled", "refunded"].includes(order.status));
          if (order.sessionId && !sessionId) {
            fetch(`/api/quiz/result?sessionId=${order.sessionId}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.personaId) setPersonaId(data.personaId);
                if (data.recommendedProductIds) setRecommendedIds(data.recommendedProductIds);
              })
              .catch(() => {});
          }
        })
        .catch(() => {
          setFeedbackAllowed(false);
        });
    }
  }, [orderId, orderAccessToken, sessionId]);

  const productsToShow = recommendedIds.length > 0
    ? PRODUCTS.filter((p) => recommendedIds.includes(p.id))
    : PRODUCTS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!feedbackAllowed) {
      setError("订单支付完成后才能提交试香反馈。");
      return;
    }

    if (!favoriteProduct) {
      setError("请选择最喜欢的一支。");
      return;
    }

    const requiredRatings = ["accuracy", "satisfaction", "packaging"];
    if (requiredRatings.some((key) => !ratings[key])) {
      setError("请完成推荐准确度、整体满意度和包装体验评分。");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId ?? undefined,
          purchaseIntentId: purchaseIntentId ?? undefined,
          orderId: orderId ?? undefined,
          orderAccessToken: orderAccessToken ?? undefined,
          personaId: personaId ?? undefined,
          favoriteProductId: favoriteProduct,
          dislikedProductIds: dislikedProducts,
          ratings,
          comment: comment || undefined,
          boughtFullSize,
          fullSizeProductId: fullSizeProduct,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "反馈提交失败");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "反馈提交失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <PageShell>
        <div className="text-center py-16">
          <h1 className="text-xl font-serif text-stone-800">
            {SITE_COPY.feedback.thankYouTitle}
          </h1>
          <p className="mt-3 text-stone-600">
            {SITE_COPY.feedback.thankYouDesc}
          </p>
          <Link href="/" className="btn-secondary mt-6 inline-flex">
            返回首页
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="py-8">
        <h1 className="text-2xl font-serif text-stone-800 text-center">
          {SITE_COPY.feedback.title}
        </h1>
        <p className="mt-2 text-sm text-stone-500 text-center">
          {SITE_COPY.feedback.subtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 mt-4">
        {!feedbackAllowed && (
          <div className="rounded-xl border border-clay-200 bg-clay-400/10 p-4 text-sm text-clay-600">
            订单支付完成后才能填写试香反馈。
          </div>
        )}

        {/* Favorite product */}
        <div className="card">
          <h3 className="font-serif text-stone-700">你最喜欢哪一支？</h3>
          <div className="mt-3 grid gap-2">
            {productsToShow.map((product) => (
              <label
                key={product.id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  favoriteProduct === product.id
                    ? "border-sage-400 bg-sage-400/10"
                    : "border-cream-200"
                }`}
              >
                <input
                  type="radio"
                  name="favorite"
                  value={product.id}
                  checked={favoriteProduct === product.id}
                  onChange={(e) => setFavoriteProduct(e.target.value)}
                  className="accent-sage-500"
                />
                <span className="text-sm text-stone-700">{product.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Disliked products */}
        <div className="card">
          <h3 className="font-serif text-stone-700">哪一支你不喜欢？</h3>
          <p className="text-xs text-stone-400 mt-1">可多选</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {productsToShow.map((product) => (
              <label
                key={product.id}
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                  dislikedProducts.includes(product.id)
                    ? "border-clay-400 bg-clay-400/10"
                    : "border-cream-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={dislikedProducts.includes(product.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setDislikedProducts([...dislikedProducts, product.id]);
                    } else {
                      setDislikedProducts(dislikedProducts.filter((id) => id !== product.id));
                    }
                  }}
                  className="accent-clay-500"
                />
                <span className="text-sm text-stone-700">{product.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ratings */}
        <div className="card">
          <h3 className="font-serif text-stone-700">评分</h3>
          <div className="mt-3 grid gap-3">
            {[
              { key: "accuracy", label: "推荐准确度" },
              { key: "satisfaction", label: "整体满意度" },
              { key: "packaging", label: "包装体验" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm text-stone-600">{item.label}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatings({ ...ratings, [item.key]: star })}
                      className={`text-lg ${
                        (ratings[item.key] ?? 0) >= star
                          ? "text-sage-500"
                          : "text-stone-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="card">
          <h3 className="font-serif text-stone-700">想说点什么？</h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="比如：哪支让你惊喜？哪支和你想象的不一样？"
            className="mt-3 w-full rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm focus:outline-none focus:border-sage-400"
          />
        </div>

        {/* Full size purchase */}
        <div className="card">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={boughtFullSize}
              onChange={(e) => setBoughtFullSize(e.target.checked)}
              className="accent-sage-500"
            />
            <span className="text-sm text-stone-700">我已经买了正装</span>
          </label>
          {boughtFullSize && (
            <div className="mt-3">
              <select
                value={fullSizeProduct ?? ""}
                onChange={(e) => setFullSizeProduct(e.target.value || null)}
                className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm focus:outline-none focus:border-sage-400"
              >
                <option value="">选择你买的正装</option>
                {PRODUCTS.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading || !feedbackAllowed} className="btn-primary">
          {loading ? "提交中..." : "提交反馈"}
        </button>
      </form>
    </PageShell>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense>
      <FeedbackContent />
    </Suspense>
  );
}
