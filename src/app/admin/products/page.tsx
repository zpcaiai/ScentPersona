import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { db } from "@/lib/db";
import { parseJsonRecord } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const locale = getLocale();
  const products = await db.product.findMany({
    include: { offers: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <PageShell>
      <div className="py-8">
        <h1 className="text-2xl font-serif text-stone-800 text-center">{pick(locale, "商品管理", "Products")}</h1>
        <div className="mt-4 text-center">
          <Link href="/admin/import" className="btn-primary">{pick(locale, "导入 CSV", "Import CSV")}</Link>
        </div>
      </div>
      <div className="grid gap-4">
        {products.map((product) => {
          const prices = product.offers.map((offer) => offer.priceCents).filter((price): price is number => typeof price === "number");
          const scores = parseJsonRecord<number>(product.scentTagsJson);
          return (
            <Link key={product.id} href={`/admin/products/${product.id}`} className="card block">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-stone-400">{product.brand || pick(locale, "未知品牌", "Unknown brand")} · {product.reviewStatus}</div>
                  <h2 className="mt-1 font-serif text-lg text-stone-800">{product.normalizedName}</h2>
                  <div className="mt-2 text-xs text-stone-500">
                    {pick(locale, "标签", "Tags")}：{pick(locale, "干净", "Clean")} {scores.clean || 0} / {pick(locale, "温柔", "Soft")} {scores.soft || 0} / {pick(locale, "木质", "Woody")} {scores.woody || 0} / {pick(locale, "明亮", "Bright")} {scores.bright || 0}
                  </div>
                </div>
                <div className="text-right text-sm text-stone-500">
                  <div>{product.offers.length} {pick(locale, "个 offer", "offers")}</div>
                  <div>{new Set(product.offers.map((offer) => offer.platform)).size} {pick(locale, "个平台", "platforms")}</div>
                  <div className="text-clay-500">{prices.length ? pick(locale, `最低 ¥${(Math.min(...prices) / 100).toFixed(2)}`, `From ¥${(Math.min(...prices) / 100).toFixed(2)}`) : pick(locale, "暂无价格", "No price")}</div>
                </div>
              </div>
            </Link>
          );
        })}
        {products.length === 0 && <div className="card text-center text-sm text-stone-500">{pick(locale, "暂无商品。请先导入 CSV。", "No products yet. Import a CSV first.")}</div>}
      </div>
    </PageShell>
  );
}
