import { notFound } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { PRODUCTS, getProductBySlug } from "@/data/products";
import { getScentTagLabels } from "@/data/scentTags";
import { getSiteCopy } from "@/data/copy";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";
import type { ScentTag } from "@/lib/scoring/types";

interface ProductDetailPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.slug }));
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const locale = getLocale();
  const copy = getSiteCopy(locale);
  const scentTagLabels = getScentTagLabels(locale);
  const product = getProductBySlug(params.slug, locale);
  if (!product) {
    notFound();
  }
  const p = product!;

  return (
    <PageShell>
      <div className="py-8">
        <Link href="/products" className="text-sm text-stone-400 hover:text-sage-600">
          {pick(locale, "← 返回全部产品", "← Back to all products")}
        </Link>
      </div>

      <img
        src={p.image}
        alt={p.name}
        className="w-full aspect-[4/3] object-cover rounded-2xl mb-6"
        loading="lazy"
      />

      <div className="card">
        <h1 className="text-2xl font-serif text-stone-800">{p.name}</h1>
        <div className="mt-2 text-lg text-clay-500">
          ¥{((p.price.sample ?? p.price.fullSize ?? 0) / 100).toFixed(1)}
        </div>
        <p className="mt-4 text-stone-600 leading-relaxed">
          {p.emotionalScene}
        </p>
        <p className="mt-3 text-sm text-stone-500 leading-relaxed">
          {p.plainDescription}
        </p>
      </div>

      {/* Scent notes */}
      <div className="card mt-6">
        <h3 className="font-serif text-stone-700 mb-4">{pick(locale, "香调", "Scent notes")}</h3>
        <div className="grid gap-4">
          <div>
            <div className="text-xs text-sage-500 mb-2">{pick(locale, "前调", "Top")}</div>
            <div className="flex flex-wrap gap-2">
              {p.notes.top.map((note) => (
                <span key={note} className="text-sm bg-cream-100 text-stone-600 px-3 py-1 rounded-full">
                  {note}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-sage-500 mb-2">{pick(locale, "中调", "Heart")}</div>
            <div className="flex flex-wrap gap-2">
              {p.notes.middle.map((note) => (
                <span key={note} className="text-sm bg-cream-100 text-stone-600 px-3 py-1 rounded-full">
                  {note}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-sage-500 mb-2">{pick(locale, "后调", "Base")}</div>
            <div className="flex flex-wrap gap-2">
              {p.notes.base.map((note) => (
                <span key={note} className="text-sm bg-cream-100 text-stone-600 px-3 py-1 rounded-full">
                  {note}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scent tags */}
      <div className="card mt-6">
        <h3 className="font-serif text-stone-700 mb-3">{pick(locale, "气味标签", "Scent tags")}</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(p.scentTags)
            .filter(([_, v]) => v > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([tag, score]) => (
              <span
                key={tag}
                className="text-xs bg-sage-400/20 text-sage-600 px-3 py-1 rounded-full"
              >
                {scentTagLabels[tag as ScentTag]} · {score}
              </span>
            ))}
        </div>
      </div>

      {/* CTA */}
      <div className="card mt-6 text-center bg-gradient-to-br from-sage-400/10 to-cream-100">
        <h3 className="font-serif text-stone-800">
          {copy.products.primaryOfferTitle}
        </h3>
        <p className="mt-2 text-sm text-stone-600">
          {copy.products.primaryOfferDesc}
        </p>
        <div className="mt-4 flex flex-col gap-3 items-center">
          <Link href="/quiz" className="btn-primary w-48">
            {pick(locale, "先做测试", "Take the quiz first")}
          </Link>
          <Link href="/checkout" className="btn-secondary w-48">
            {pick(locale, "直接购买小样", "Buy samples directly")}
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
