import PageShell from "@/components/layout/PageShell";
import { db } from "@/lib/db";
import { parseJsonArray, parseJsonRecord } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function AdminProductDetailPage({ params }: { params: { productId: string } }) {
  const locale = getLocale();
  const product = await db.product.findUnique({
    where: { id: params.productId },
    include: { offers: { orderBy: { updatedAt: "desc" } }, matchCandidates: true },
  });

  if (!product) {
    return <PageShell><div className="py-12 text-center text-stone-500">{pick(locale, "商品不存在", "Product not found")}</div></PageShell>;
  }

  const scores = parseJsonRecord<number>(product.scentTagsJson);

  return (
    <PageShell>
      <div className="py-8">
        <div className="text-sm text-stone-400">{product.brand || pick(locale, "未知品牌", "Unknown brand")} · {product.reviewStatus}</div>
        <h1 className="mt-1 text-2xl font-serif text-stone-800">{product.normalizedName}</h1>
      </div>

      <div className="card">
        <h2 className="font-serif text-lg text-stone-800">{pick(locale, "标准信息", "Normalized info")}</h2>
        <div className="mt-3 grid gap-2 text-sm text-stone-600">
          <div>{pick(locale, "浓度", "Concentration")}：{product.concentration || pick(locale, "未知", "Unknown")}</div>
          <div>{pick(locale, "容量", "Volume")}：{product.volumeMl ? `${product.volumeMl}ml` : pick(locale, "未知", "Unknown")}</div>
          <div>{pick(locale, "香调", "Scent family")}：{product.scentFamily || pick(locale, "未知", "Unknown")}</div>
          <div>{pick(locale, "前调", "Top notes")}：{parseJsonArray<string>(product.topNotesJson).join("、") || pick(locale, "无", "None")}</div>
          <div>{pick(locale, "中调", "Middle notes")}：{parseJsonArray<string>(product.middleNotesJson).join("、") || pick(locale, "无", "None")}</div>
          <div>{pick(locale, "后调", "Base notes")}：{parseJsonArray<string>(product.baseNotesJson).join("、") || pick(locale, "无", "None")}</div>
        </div>
        <pre className="mt-4 rounded-xl bg-cream-100 p-3 text-xs text-stone-600">{JSON.stringify(scores, null, 2)}</pre>
      </div>

      <div className="card mt-6">
        <h2 className="font-serif text-lg text-stone-800">{pick(locale, "平台 Offers", "Platform offers")}</h2>
        <div className="mt-3 grid gap-3">
          {product.offers.map((offer) => (
            <div key={offer.id} className="rounded-xl border border-cream-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-stone-400">{offer.platform} · {offer.reviewStatus} · {pick(locale, "质量", "Quality")} {offer.qualityScore}</div>
                  <div className="mt-1 text-sm text-stone-700">{offer.title}</div>
                  <div className="mt-1 text-xs text-stone-400">{offer.sourceUrl}</div>
                  <details className="mt-2 text-xs text-stone-500">
                    <summary>{pick(locale, "原始数据", "Raw data")}</summary>
                    <pre className="mt-2 overflow-auto rounded-lg bg-stone-900 p-3 text-cream-50">{offer.rawDataJson}</pre>
                  </details>
                </div>
                <div className="text-right text-sm text-clay-500">
                  {offer.priceCents ? `¥${(offer.priceCents / 100).toFixed(2)}` : pick(locale, "暂无价格", "No price")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
