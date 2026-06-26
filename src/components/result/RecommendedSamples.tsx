import type { ProductRecommendation } from "@/lib/scoring/types";
import { getProductById } from "@/data/products";

interface RecommendedSamplesProps {
  recommendations: ProductRecommendation[];
}

export default function RecommendedSamples({ recommendations }: RecommendedSamplesProps) {
  return (
    <div className="mt-6">
      <h3 className="font-serif text-lg text-stone-800 mb-4">为你推荐的3支小样</h3>
      <div className="grid gap-4">
        {recommendations.map((rec, i) => {
          const product = getProductById(rec.productId);
          if (!product) return null;

          return (
            <div key={rec.productId} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400">#{i + 1}</span>
                    <h4 className="font-serif text-stone-800">{product.name}</h4>
                  </div>
                  <span className="inline-block mt-1 text-xs bg-sage-400/20 text-sage-600 px-2 py-0.5 rounded-full">
                    {rec.role}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                {product.emotionalScene}
              </p>
              <p className="mt-2 text-sm text-stone-500">
                {product.plainDescription}
              </p>
              <div className="mt-3 text-xs text-sage-500 bg-sage-400/10 rounded-lg p-3">
                {rec.reason}
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {product.notes.top.map((n) => (
                  <span key={n} className="text-xs bg-cream-100 text-stone-500 px-2 py-0.5 rounded-full">
                    {n}
                  </span>
                ))}
                {product.notes.middle.map((n) => (
                  <span key={n} className="text-xs bg-cream-100 text-stone-500 px-2 py-0.5 rounded-full">
                    {n}
                  </span>
                ))}
                {product.notes.base.map((n) => (
                  <span key={n} className="text-xs bg-cream-100 text-stone-500 px-2 py-0.5 rounded-full">
                    {n}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
