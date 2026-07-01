import Link from "next/link";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";
import { deriveThumbUrl } from "@/lib/storage/s3";

/** Homepage explore module: scent-family chips (into the quiz funnel) + featured topic cards. */
export default async function ExploreSection() {
  const locale = getLocale();
  const [families, topics] = await Promise.all([
    db.product.findMany({
      where: { reviewStatus: "approved" },
      distinct: ["scentFamily"],
      select: { scentFamily: true },
      take: 12,
    }),
    db.contentPage.findMany({
      where: { status: "published", pageType: "landing" },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
  ]);

  if (families.length === 0 && topics.length === 0) return null;

  return (
    <>
      {families.length > 0 && (
        <section className="py-8">
          <h2 className="text-xl font-serif text-stone-700 text-center mb-6">
            {pick(locale, "按香型探索", "Explore by scent family")}
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {families.map((f) => (
              <Link
                key={f.scentFamily}
                href="/quiz"
                className="text-sm bg-cream-100 text-sage-600 px-3 py-1.5 rounded-full hover:bg-sage-100 transition-colors"
              >
                {f.scentFamily}
              </Link>
            ))}
          </div>
        </section>
      )}

      {topics.length > 0 && (
        <section className="py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif text-stone-700">
              {pick(locale, "精选专题", "Featured topics")}
            </h2>
            <Link href="/c" className="text-sm text-sage-600">
              {pick(locale, "查看全部 →", "View all →")}
            </Link>
          </div>
          <div className="grid gap-3">
            {topics.map((t) => (
              <Link
                key={t.slug}
                href={`/c/${t.slug}`}
                className="card flex items-center gap-3 hover:border-sage-400 transition-colors"
              >
                {t.heroImageUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={(t as { heroThumbUrl?: string | null }).heroThumbUrl ?? deriveThumbUrl(t.heroImageUrl)} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                )}
                <div>
                  <div className="font-serif text-stone-800">{t.title}</div>
                  {t.subtitle && <div className="text-sm text-stone-500 mt-1">{t.subtitle}</div>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
