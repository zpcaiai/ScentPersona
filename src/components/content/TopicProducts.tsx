import Link from "next/link";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

const yuan = (cents?: number | null) => (cents == null ? "" : `¥${(cents / 100).toFixed(0)}`);
const isSelf = (t?: string | null) => !!t && /flagship|official|self/.test(t);

/** Aggregated self-op / recommended offers for a topic page. Optional scent-family filter. */
export default async function TopicProducts({ family, title }: { family?: string; title?: string }) {
  const offers = await db.productOffer.findMany({
    where: { reviewStatus: "approved", isAvailable: true, ...(family ? { product: { scentFamily: family } } : {}) },
    orderBy: [{ salesCount: "desc" }],
    take: 12,
    include: { product: { select: { normalizedName: true, scentFamily: true } } },
  });
  if (offers.length === 0) return null;
  const items = offers.sort((a, b) => (isSelf(a.shopType) ? 0 : 1) - (isSelf(b.shopType) ? 0 : 1)).slice(0, 6);
  const locale = getLocale();

  return (
    <section className="space-y-3">
      <h2 className="font-serif text-xl text-clay-600">{title ?? pick(locale, "这个方向的推荐", "Picks in this direction")}</h2>
      <div className="grid grid-cols-2 gap-3">
        {items.map((o) => (
          <div key={o.id} className="card">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${isSelf(o.shopType) ? "bg-sage-100 text-sage-700" : "bg-cream-100 text-clay-600"}`}>
                {isSelf(o.shopType) ? pick(locale, "自营", "Self-op") : pick(locale, "推荐", "Pick")}
              </span>
              {o.product?.scentFamily && <span className="text-xs text-stone-400">{o.product.scentFamily}</span>}
            </div>
            <div className="mt-1 font-serif text-sm leading-snug text-stone-800">{o.product?.normalizedName ?? o.title}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-serif text-clay-500">{yuan(o.priceCents)}</span>
              {o.originalPriceCents && o.originalPriceCents > (o.priceCents ?? 0) && (
                <span className="text-xs text-stone-400 line-through">{yuan(o.originalPriceCents)}</span>
              )}
            </div>
            <div className="mt-0.5 text-xs text-stone-400">
              {o.rating ? `★ ${o.rating.toFixed(1)}` : ""}
              {o.shopName ? ` · ${o.shopName}` : ""}
            </div>
          </div>
        ))}
      </div>
      <Link href="/quiz" className="inline-block rounded-xl bg-sage-500 px-5 py-2.5 font-medium text-white">
        {pick(locale, "测测这个方向适不适合你", "See if this suits you")}
      </Link>
    </section>
  );
}
