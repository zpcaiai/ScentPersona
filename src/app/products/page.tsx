import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { SITE_COPY } from "@/data/copy";
import { PRODUCTS } from "@/data/products";

export default function ProductsPage() {
  return (
    <PageShell>
      <div className="text-center py-8">
        <h1 className="text-2xl font-serif text-stone-800">
          {SITE_COPY.products.title}
        </h1>
        <p className="mt-3 text-stone-600 leading-relaxed">
          {SITE_COPY.products.subtitle}
        </p>
      </div>

      <div className="grid gap-4 mt-6">
        {/* Primary offer */}
        <div className="card border-2 border-sage-400">
          <img src="/products/sample-set.jpg" alt="" className="w-full h-40 object-cover rounded-xl mb-4" loading="lazy" />
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-sage-500 mb-1">推荐</div>
              <h3 className="font-serif text-lg text-stone-800">
                {SITE_COPY.products.primaryOfferTitle}
              </h3>
              <p className="mt-2 text-sm text-stone-600">
                {SITE_COPY.products.primaryOfferDesc}
              </p>
            </div>
            <div className="text-2xl font-serif text-clay-500">
              {SITE_COPY.products.primaryOfferPrice}
            </div>
          </div>
          <Link href="/quiz" className="btn-primary mt-4 inline-flex">
            先做测试，再领小样
          </Link>
        </div>

        {/* Secondary offer */}
        <div className="card">
          <img src="/products/sample-set.jpg" alt="" className="w-full h-40 object-cover rounded-xl mb-4" loading="lazy" />
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-serif text-lg text-stone-800">
                {SITE_COPY.products.secondaryOfferTitle}
              </h3>
              <p className="mt-2 text-sm text-stone-600">
                {SITE_COPY.products.secondaryOfferDesc}
              </p>
            </div>
            <div className="text-2xl font-serif text-clay-500">
              {SITE_COPY.products.secondaryOfferPrice}
            </div>
          </div>
          <Link href="/checkout" className="btn-secondary mt-4 inline-flex">
            直接购买
          </Link>
        </div>

        {/* Gift offer */}
        <div className="card">
          <img src="/products/gift-box.jpg" alt="" className="w-full h-40 object-cover rounded-xl mb-4" loading="lazy" />
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-serif text-lg text-stone-800">
                {SITE_COPY.products.giftOfferTitle}
              </h3>
              <p className="mt-2 text-sm text-stone-600">
                {SITE_COPY.products.giftOfferDesc}
              </p>
            </div>
            <div className="text-2xl font-serif text-clay-500">
              {SITE_COPY.products.giftOfferPrice}
            </div>
          </div>
          <Link href="/checkout" className="btn-secondary mt-4 inline-flex">
            购买礼盒
          </Link>
        </div>
      </div>

      {/* All products */}
      <div className="mt-10">
        <h2 className="font-serif text-lg text-stone-700 mb-4">全部香氛</h2>
        <div className="grid grid-cols-2 gap-4">
          {PRODUCTS.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="card hover:border-sage-400 transition-colors"
            >
              <img src={product.image} alt={product.name} className="w-full aspect-square object-cover rounded-lg mb-2" loading="lazy" />
              <h4 className="font-serif text-stone-800">{product.name}</h4>
              <p className="mt-1 text-xs text-stone-500 line-clamp-2">
                {product.plainDescription}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {product.notes.top.slice(0, 2).map((n) => (
                  <span key={n} className="text-xs bg-cream-100 text-stone-500 px-2 py-0.5 rounded-full">
                    {n}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
