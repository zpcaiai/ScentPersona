"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import { getSiteCopy } from "@/data/copy";
import { getProducts } from "@/data/products";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";
import TrackEvent from "@/components/common/TrackEvent";

function FeedbackContent() {
  const { locale } = useLang();
  const copy = getSiteCopy(locale);
  const PRODUCTS_LIST = getProducts(locale);
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
    ? PRODUCTS_LIST.filter((p) => recommendedIds.includes(p.id))
    : PRODUCTS_LIST;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!feedbackAllowed) {
      setError(pick(locale, "订单支付完成后才能提交试香反馈。", "You can submit scent trial feedback once the order is paid."));
      return;
    }

    if (!favoriteProduct) {
      setError(pick(locale, "请选择最喜欢的一支。", "Please choose your favorite one."));
      return;
    }

    const requiredRatings = ["accuracy", "satisfaction", "packaging"];
    if (requiredRatings.some((key) => !ratings[key])) {
      setError(pick(locale, "请完成推荐准确度、整体满意度和包装体验评分。", "Please rate recommendation accuracy, overall satisfaction and packaging."));
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
        throw new Error(data.error || pick(locale, "反馈提交失败", "Failed to submit feedback"));
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : pick(locale, "反馈提交失败，请稍后重试", "Couldn\u2019t submit feedback. Please try again later."));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <PageShell>
        <div className="text-center py-16">
          <h1 className="text-xl font-serif text-stone-800">
            {copy.feedback.thankYouTitle}
          </h1>
          <p className="mt-3 text-stone-600">
            {copy.feedback.thankYouDesc}
          </p>
          <Link href="/" className="btn-secondary mt-6 inline-flex">
            {pick(locale, "返回首页", "Back to home")}
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <TrackEvent
        eventName="feedback_view"
        path="/feedback"
        sessionId={sessionId}
        orderId={orderId}
        personaId={personaId}
      />
      <div className="py-8">
        <h1 className="text-2xl font-serif text-stone-800 text-center">
          {copy.feedback.title}
        </h1>
        <p className="mt-2 text-sm text-stone-500 text-center">
          {copy.feedback.subtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 mt-4">
        {!feedbackAllowed && (
          <div className="rounded-xl border border-clay-200 bg-clay-400/10 p-4 text-sm text-clay-600">
            {pick(locale, "订单支付完成后才能填写试香反馈。", "You can fill out scent trial feedback once the order is paid.")}
          </div>
        )}

        {/* Favorite product */}
        <div className="card">
          <h3 className="font-serif text-stone-700">{pick(locale, "你最喜欢哪一支？", "Which one did you like most?")}</h3>
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
          <h3 className="font-serif text-stone-700">{pick(locale, "哪一支你不喜欢？", "Which ones didn\u2019t suit you?")}</h3>
          <p className="text-xs text-stone-400 mt-1">{pick(locale, "可多选", "Choose any that apply")}</p>
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
          <h3 className="font-serif text-stone-700">{pick(locale, "评分", "Ratings")}</h3>
          <div className="mt-3 grid gap-3">
            {[
              { key: "accuracy", label: pick(locale, "推荐准确度", "Recommendation accuracy") },
              { key: "satisfaction", label: pick(locale, "整体满意度", "Overall satisfaction") },
              { key: "packaging", label: pick(locale, "包装体验", "Packaging experience") },
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
          <h3 className="font-serif text-stone-700">{pick(locale, "想说点什么？", "Anything you\u2019d like to add?")}</h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder={pick(locale, "比如：哪支让你惊喜？哪支和你想象的不一样？", "E.g. which one surprised you? Which was different from what you expected?")}
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
            <span className="text-sm text-stone-700">{pick(locale, "我已经买了正装", "I already bought a full bottle")}</span>
          </label>
          {boughtFullSize && (
            <div className="mt-3">
              <select
                value={fullSizeProduct ?? ""}
                onChange={(e) => setFullSizeProduct(e.target.value || null)}
                className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm focus:outline-none focus:border-sage-400"
              >
                <option value="">{pick(locale, "选择你买的正装", "Choose the full bottle you bought")}</option>
                {PRODUCTS_LIST.map((product) => (
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
          {loading ? pick(locale, "提交中...", "Submitting...") : pick(locale, "提交反馈", "Submit feedback")}
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
