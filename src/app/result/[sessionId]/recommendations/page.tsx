import PageShell from "@/components/layout/PageShell";
import RecommendationActions from "@/components/products/RecommendationActions";
import { db } from "@/lib/db";
import { parseJsonArray, parseJsonRecord } from "@/lib/utils";
import { recommendProductsForUser } from "@/lib/recommendation/recommendProductsForUser";
import { getOfferFreshness, getPurchaseTypeLabel, getRiskLabels } from "@/lib/products/offerPresentation";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function ResultRecommendationsPage({ params }: { params: { sessionId: string } }) {
  const locale = getLocale();
  const session = await db.quizSession.findUnique({ where: { id: params.sessionId } });
  if (!session) {
    return <PageShell><div className="py-12 text-center text-stone-500">{pick(locale, "未找到测试结果", "We couldn't find this result")}</div></PageShell>;
  }

  const tagScores = parseJsonRecord<number>(session.tagScoresJson);
  const recommendations = await recommendProductsForUser({ tagScores, limit: 3 });

  return (
    <PageShell>
      <div className="py-8">
        <h1 className="text-2xl font-serif text-stone-800 text-center">
          {pick(locale, "根据你的选择，你更适合这 3 个方向", "Based on your answers, these 3 directions suit you best")}
        </h1>
        <p className="mt-2 text-center text-sm text-stone-500">
          {pick(
            locale,
            "价格、优惠和库存可能变化，请以平台页面为准。",
            "Prices, discounts, and stock may change — the platform page is final."
          )}
        </p>
      </div>

      <div className="grid gap-5">
        {recommendations.map((item) => (
          <div key={item.product.id} className="card">
            <div className="text-xs text-sage-600">{item.role}</div>
            <h2 className="mt-1 font-serif text-xl text-stone-800">{item.product.normalizedName}</h2>
            <p className="mt-2 text-sm text-stone-600">{item.reason}</p>
            {item.bestOffer && (() => {
              const riskFlags = parseJsonArray<string>(item.bestOffer.riskFlagsJson);
              const risks = getRiskLabels(riskFlags);
              const freshness = getOfferFreshness(item.bestOffer.fetchedAt);
              const purchaseType = getPurchaseTypeLabel(riskFlags);
              return (
                <div className="mt-4 rounded-xl border border-cream-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm text-stone-700">{item.bestOffer.platform} · {item.bestOffer.shopName || pick(locale, "未知店铺", "Unknown shop")}</div>
                      <div className="mt-1 text-xs text-stone-400">
                        {purchaseType} · {freshness.label} · {item.bestOffer.fetchedAt.toLocaleString(locale === "en" ? "en-US" : "zh-CN")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-serif text-clay-500">
                        {item.bestOffer.priceCents ? `¥${(item.bestOffer.priceCents / 100).toFixed(2)}` : pick(locale, "暂无价格", "No price yet")}
                      </div>
                    </div>
                  </div>
                  {risks.length > 0 && (
                    <div className="mt-2 text-xs text-clay-600">{pick(locale, "提示：", "Note: ")}{risks.join(pick(locale, "、", ", "))}</div>
                  )}
                </div>
              );
            })()}
            <RecommendationActions
              sessionId={session.id}
              productId={item.product.id}
              productOfferId={item.bestOffer?.id}
              offersHref={`/products/${item.product.id}/offers`}
              outboundHref={item.bestOffer ? item.bestOffer.affiliateUrl || item.bestOffer.sourceUrl : null}
            />
          </div>
        ))}
        {recommendations.length === 0 && (
          <div className="card text-center text-sm text-stone-500">
            {pick(
              locale,
              "商品库还没有足够数据。请先通过后台导入商品 CSV。",
              "The catalog doesn't have enough data yet. Please import the product CSV from the admin first."
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
