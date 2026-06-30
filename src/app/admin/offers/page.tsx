import PageShell from "@/components/layout/PageShell";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/utils";
import OfferReviewActions from "./OfferReviewActions";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function AdminOffersPage() {
  const locale = getLocale();
  const offers = await db.productOffer.findMany({
    include: { product: true },
    orderBy: [{ reviewStatus: "desc" }, { updatedAt: "desc" }],
    take: 150,
  });

  return (
    <PageShell>
      <div className="py-8">
        <h1 className="text-2xl font-serif text-stone-800 text-center">{pick(locale, "Offer 风险审核", "Offer risk review")}</h1>
      </div>
      <div className="grid gap-4">
        {offers.map((offer) => (
          <div key={offer.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-stone-400">{offer.platform} · {offer.reviewStatus} · {pick(locale, "质量", "Quality")} {offer.qualityScore}</div>
                <h2 className="mt-1 font-serif text-lg text-stone-800">{offer.product.normalizedName}</h2>
                <p className="mt-1 text-sm text-stone-600">{offer.title}</p>
                <p className="mt-2 text-xs text-clay-600">
                  {pick(locale, "风险", "Risk")}：{parseJsonArray<string>(offer.riskFlagsJson).join("、") || pick(locale, "无", "None")}
                </p>
              </div>
              <div className="text-right text-sm text-clay-500">
                {offer.priceCents ? `¥${(offer.priceCents / 100).toFixed(2)}` : pick(locale, "暂无价格", "No price")}
              </div>
            </div>
            <OfferReviewActions offerId={offer.id} currentStatus={offer.reviewStatus} />
          </div>
        ))}
      </div>
    </PageShell>
  );
}
