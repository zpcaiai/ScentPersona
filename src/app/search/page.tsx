import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { db } from "@/lib/db";
import { getOfferFreshness, getPurchaseTypeLabel } from "@/lib/products/offerPresentation";
import { parseJsonArray } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const locale = getLocale();
  const q = String(searchParams?.q || "").trim();
  const sortBy = String(searchParams?.sortBy || "relevance");
  const offers = q
    ? await db.productOffer.findMany({
        where: {
          isAvailable: true,
          reviewStatus: { not: "rejected" },
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
            { product: { normalizedName: { contains: q, mode: "insensitive" } } },
            { product: { brand: { contains: q, mode: "insensitive" } } },
          ],
        },
        include: { product: true },
        orderBy: sortBy === "price_asc"
          ? [{ priceCents: "asc" }]
          : sortBy === "price_desc"
            ? [{ priceCents: "desc" }]
            : [{ qualityScore: "desc" }, { fetchedAt: "desc" }],
        take: 60,
      })
    : [];

  return (
    <PageShell>
      <div className="py-8">
        <h1 className="text-2xl font-serif text-stone-800 text-center">{pick(locale, "香水搜索与比价", "Search & compare perfumes")}</h1>
        <p className="mt-2 text-center text-sm text-stone-500">
          {pick(locale, "价格、优惠和库存可能变化，请以平台页面为准。", "Prices, promotions and stock can change — the platform page is the source of truth.")}
        </p>
      </div>

      <form className="card grid gap-3 sm:grid-cols-[1fr_auto_auto]" action="/search">
        <input
          name="q"
          defaultValue={q}
          placeholder={pick(locale, "搜索品牌、香水名、香调", "Search by brand, perfume name or notes")}
          className="rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm"
        />
        <select name="sortBy" defaultValue={sortBy} className="rounded-xl border border-cream-200 bg-white px-3 py-2 text-sm">
          <option value="relevance">{pick(locale, "综合排序", "Best match")}</option>
          <option value="price_asc">{pick(locale, "价格从低到高", "Price: low to high")}</option>
          <option value="price_desc">{pick(locale, "价格从高到低", "Price: high to low")}</option>
        </select>
        <button className="btn-primary" type="submit">{pick(locale, "搜索", "Search")}</button>
      </form>

      <div className="mt-6 grid gap-4">
        {offers.map((offer) => {
          const risks = parseJsonArray<string>(offer.riskFlagsJson);
          const freshness = getOfferFreshness(offer.fetchedAt);
          return (
            <div key={offer.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-stone-400">{offer.platform} · {offer.shopName || pick(locale, "未知店铺", "Unknown shop")}</div>
                  <h2 className="mt-1 font-serif text-lg text-stone-800">{offer.product.normalizedName}</h2>
                  <p className="mt-1 text-sm text-stone-600">{offer.title}</p>
                  <div className="mt-2 text-xs text-sage-600">{getPurchaseTypeLabel(risks)}</div>
                  <div className="mt-2 text-xs text-stone-400">
                    {pick(locale, "评分", "Rating")} {offer.rating ?? pick(locale, "暂无评分", "N/A")} · {pick(locale, "评论", "Reviews")} {offer.reviewCount ?? pick(locale, "暂无", "N/A")} · {pick(locale, "销量", "Sold")} {offer.salesCount ?? pick(locale, "暂无", "N/A")}
                  </div>
                  <div className="mt-1 text-xs text-stone-400">
                    {freshness.label} · {pick(locale, "更新时间", "Updated")} {offer.fetchedAt.toLocaleString(locale === "en" ? "en-US" : "zh-CN")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-serif text-clay-500">
                    {offer.priceCents ? `¥${(offer.priceCents / 100).toFixed(2)}` : pick(locale, "暂无价格", "No price")}
                  </div>
                  <Link href={`/products/${offer.productId}/offers`} className="btn-secondary mt-3 inline-flex">
                    {pick(locale, "查看比价", "Compare prices")}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
        {q && offers.length === 0 && (
          <div className="card text-center text-sm text-stone-500">
            {pick(locale, "暂无商品数据。可以先在后台通过 CSV 导入。", "No products yet. Import some via CSV in the admin first.")}
          </div>
        )}
      </div>
    </PageShell>
  );
}
