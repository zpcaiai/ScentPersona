import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import OfferOutboundLink from "@/components/products/OfferOutboundLink";
import ProxyOrderButton from "@/components/products/ProxyOrderButton";
import { db } from "@/lib/db";
import { parseJsonArray, parseJsonRecord } from "@/lib/utils";
import { getOfferFreshness, getPurchaseTypeLabel, getRiskLabels } from "@/lib/products/offerPresentation";
import { getLocale } from "@/lib/i18n/server";
import { pick, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function ProductOffersPage({ params }: { params: { slug: string } }) {
  const locale = getLocale();
  const product = await db.product.findUnique({
    where: { id: params.slug },
    include: {
      offers: {
        where: { isAvailable: true, reviewStatus: { not: "rejected" } },
        orderBy: [{ priceCents: "asc" }],
      },
    },
  });

  if (!product) notFound();

  const scores = parseJsonRecord<number>(product.scentTagsJson);
  const topNotes = parseJsonArray<string>(product.topNotesJson);
  const middleNotes = parseJsonArray<string>(product.middleNotesJson);
  const baseNotes = parseJsonArray<string>(product.baseNotesJson);

  return (
    <PageShell>
      <div className="py-8">
        <div className="text-sm text-stone-400">{product.brand || pick(locale, "未知品牌", "Unknown brand")}</div>
        <h1 className="mt-1 text-2xl font-serif text-stone-800">{product.normalizedName}</h1>
        <p className="mt-2 text-sm text-stone-500">
          {pick(locale, "价格、优惠和库存可能变化，请以平台页面为准。", "Prices, promotions and stock can change — the platform page is the source of truth.")}
        </p>
      </div>

      <div className="card">
        <h2 className="font-serif text-lg text-stone-800">{pick(locale, "香味信息", "Scent details")}</h2>
        <div className="mt-3 grid gap-2 text-sm text-stone-600">
          {product.scentFamily && <div>{pick(locale, "香调", "Scent family")}：{product.scentFamily}</div>}
          {topNotes.length > 0 && <div>{pick(locale, "前调", "Top")}：{topNotes.join(pick(locale, "、", ", "))}</div>}
          {middleNotes.length > 0 && <div>{pick(locale, "中调", "Heart")}：{middleNotes.join(pick(locale, "、", ", "))}</div>}
          {baseNotes.length > 0 && <div>{pick(locale, "后调", "Base")}：{baseNotes.join(pick(locale, "、", ", "))}</div>}
        </div>
        <div className="mt-4 grid gap-2">
          {["clean", "soft", "woody", "bright", "presence", "calm"].map((key) => (
            <div key={key} className="grid grid-cols-[72px_1fr_32px] items-center gap-2 text-xs text-stone-500">
              <span>{dimensionLabel(key, locale)}</span>
              <div className="h-2 overflow-hidden rounded-full bg-cream-100">
                <div className="h-full bg-sage-500" style={{ width: `${Math.min(100, (scores[key] || 0) * 10)}%` }} />
              </div>
              <span>{scores[key] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {product.offers.map((offer) => {
          const risks = parseJsonArray<string>(offer.riskFlagsJson);
          const freshness = getOfferFreshness(offer.fetchedAt);
          const riskLabels = getRiskLabels(risks);
          const purchaseType = getPurchaseTypeLabel(risks);
          return (
            <div key={offer.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-stone-400">{offer.platform} · {offer.shopName || pick(locale, "未知店铺", "Unknown shop")}</div>
                  <div className="mt-1 text-sm text-stone-700">{offer.title}</div>
                  <div className="mt-2 text-xs text-sage-600">{purchaseType}</div>
                  <div className="mt-2 text-xs text-stone-400">
                    {pick(locale, "评分", "Rating")} {offer.rating ?? pick(locale, "暂无评分", "N/A")} · {pick(locale, "评论", "Reviews")} {offer.reviewCount ?? pick(locale, "暂无", "N/A")} · {pick(locale, "销量", "Sold")} {offer.salesCount ?? pick(locale, "暂无", "N/A")}
                  </div>
                  <div className="mt-1 text-xs text-stone-400">
                    {freshness.label} · {pick(locale, "更新时间", "Updated")} {offer.fetchedAt.toLocaleString(locale === "en" ? "en-US" : "zh-CN")}
                  </div>
                  {riskLabels.length > 0 && (
                    <div className="mt-2 text-xs text-clay-600">{pick(locale, "风险提示", "Heads up")}：{riskLabels.join(pick(locale, "、", ", "))}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xl font-serif text-clay-500">
                    {offer.priceCents ? `¥${(offer.priceCents / 100).toFixed(2)}` : pick(locale, "暂无价格", "No price")}
                  </div>
                  <OfferOutboundLink productId={product.id} offerId={offer.id} href={offer.affiliateUrl || offer.sourceUrl} />
                  <ProxyOrderButton offerId={offer.id} />
                </div>
              </div>
            </div>
          );
        })}
        <Link href="/search" className="btn-secondary justify-center">{pick(locale, "返回搜索", "Back to search")}</Link>
      </div>
    </PageShell>
  );
}

function dimensionLabel(key: string, locale: Locale): string {
  return {
    clean: pick(locale, "干净感", "Clean"),
    soft: pick(locale, "温柔感", "Soft"),
    woody: pick(locale, "木质感", "Woody"),
    bright: pick(locale, "明亮感", "Bright"),
    presence: pick(locale, "存在感", "Presence"),
    calm: pick(locale, "安静感", "Calm"),
  }[key] || key;
}
