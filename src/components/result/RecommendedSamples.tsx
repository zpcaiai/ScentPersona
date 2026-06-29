"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ProductRecommendation, RecommendationRole } from "@/lib/scoring/types";
import { PRODUCTS, getProductById } from "@/data/products";
import { SITE_COPY } from "@/data/copy";

interface RecommendedSamplesProps {
  recommendations: ProductRecommendation[];
  sessionId: string;
}

const FALLBACK_ROLES: RecommendationRole[] = ["本命香候选", "安全款", "惊喜尝试"];

export default function RecommendedSamples({ recommendations, sessionId }: RecommendedSamplesProps) {
  const initialIds = useMemo(() => recommendations.map((rec) => rec.productId), [recommendations]);
  const [selectedIds, setSelectedIds] = useState(initialIds);

  const replaceProduct = (index: number) => {
    const currentId = selectedIds[index];
    const usedIds = new Set(selectedIds);
    const currentProductIndex = PRODUCTS.findIndex((product) => product.id === currentId);

    for (let offset = 1; offset <= PRODUCTS.length; offset += 1) {
      const candidate = PRODUCTS[(currentProductIndex + offset + PRODUCTS.length) % PRODUCTS.length];
      if (!usedIds.has(candidate.id)) {
        setSelectedIds((prev) => prev.map((id, i) => (i === index ? candidate.id : id)));
        return;
      }
    }
  };

  const checkoutHref = `/checkout?sessionId=${sessionId}&productIds=${encodeURIComponent(selectedIds.join(","))}`;

  return (
    <div className="mt-6">
      <h3 className="font-serif text-lg text-stone-800 mb-4">为你推荐的3支小样</h3>
      <div className="grid gap-4">
        {selectedIds.map((productId, i) => {
          const product = getProductById(productId);
          if (!product) return null;
          const rec = recommendations.find((item) => item.productId === productId);
          const role = rec?.role || FALLBACK_ROLES[i] || "惊喜尝试";

          return (
            <div key={`${product.id}-${i}`} className="card">
              <img src={product.image} alt={product.name} className="w-full h-36 object-cover rounded-lg mb-3" loading="lazy" />
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-400">#{i + 1}</span>
                    <h4 className="font-serif text-stone-800">{product.name}</h4>
                  </div>
                  <span className="inline-block mt-1 text-xs bg-sage-400/20 text-sage-600 px-2 py-0.5 rounded-full">
                    {role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => replaceProduct(i)}
                  className="rounded-full border border-cream-200 px-3 py-1 text-xs text-stone-500 transition-colors hover:border-sage-400 hover:text-sage-600"
                >
                  换一支
                </button>
              </div>

              <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                {product.emotionalScene}
              </p>
              <p className="mt-2 text-sm text-stone-500">
                {product.plainDescription}
              </p>
              <div className="mt-3 text-xs text-sage-500 bg-sage-400/10 rounded-lg p-3">
                {rec?.reason || `${product.name}会作为这套试香组合里的${role}，帮你确认真实上身感。`}
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

      <div className="card mt-6 text-center bg-gradient-to-br from-sage-400/10 to-cream-100">
        <h3 className="font-serif text-lg text-stone-800">
          {SITE_COPY.result.sampleCtaTitle}
        </h3>
        <p className="mt-2 text-sm text-stone-600">
          {SITE_COPY.result.sampleCtaCopy}
        </p>
        <Link href={checkoutHref} className="btn-primary mt-4 inline-flex">
          {SITE_COPY.result.sampleCtaButton}
        </Link>
      </div>
    </div>
  );
}
