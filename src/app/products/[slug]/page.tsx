import { notFound } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { PRODUCTS, getProductBySlug } from "@/data/products";
import { SCENT_TAG_LABELS } from "@/data/scentTags";
import { SITE_COPY } from "@/data/copy";
import type { ScentTag } from "@/lib/scoring/types";

interface ProductDetailPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.slug }));
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const product = getProductBySlug(params.slug);
  if (!product) {
    notFound();
  }
  const p = product!;

  return (
    <PageShell>
      <div className="py-8">
        <Link href="/products" className="text-sm text-stone-400 hover:text-sage-600">
          ← 返回全部产品
        </Link>
      </div>

      <div className="card">
        <h1 className="text-2xl font-serif text-stone-800">{p.name}</h1>
        <div className="mt-2 text-lg text-clay-500">
          ¥{(p.price / 100).toFixed(1)}
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
        <h3 className="font-serif text-stone-700 mb-4">香调</h3>
        <div className="grid gap-4">
          <div>
            <div className="text-xs text-sage-500 mb-2">前调</div>
            <div className="flex flex-wrap gap-2">
              {p.notes.top.map((note) => (
                <span key={note} className="text-sm bg-cream-100 text-stone-600 px-3 py-1 rounded-full">
                  {note}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-sage-500 mb-2">中调</div>
            <div className="flex flex-wrap gap-2">
              {p.notes.middle.map((note) => (
                <span key={note} className="text-sm bg-cream-100 text-stone-600 px-3 py-1 rounded-full">
                  {note}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-sage-500 mb-2">后调</div>
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
        <h3 className="font-serif text-stone-700 mb-3">气味标签</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(p.scentTags)
            .filter(([_, v]) => v > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([tag, score]) => (
              <span
                key={tag}
                className="text-xs bg-sage-400/20 text-sage-600 px-3 py-1 rounded-full"
              >
                {SCENT_TAG_LABELS[tag as ScentTag]} · {score}
              </span>
            ))}
        </div>
      </div>

      {/* CTA */}
      <div className="card mt-6 text-center bg-gradient-to-br from-sage-400/10 to-cream-100">
        <h3 className="font-serif text-stone-800">
          {SITE_COPY.products.primaryOfferTitle}
        </h3>
        <p className="mt-2 text-sm text-stone-600">
          {SITE_COPY.products.primaryOfferDesc}
        </p>
        <div className="mt-4 flex flex-col gap-3 items-center">
          <Link href="/quiz" className="btn-primary w-48">
            先做测试
          </Link>
          <Link href="/checkout" className="btn-secondary w-48">
            直接购买小样
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
