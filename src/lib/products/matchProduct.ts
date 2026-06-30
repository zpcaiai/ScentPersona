import { parseJsonArray } from "@/lib/utils";
import { extractProductAttributes } from "./extractProductAttributes";
import { tokenizeTitle } from "./normalizeTitle";
import type { ProductLikeForMatch, ProductMatchResult } from "./types";

function overlapScore(a: string[], b: string[], max: number): number {
  if (a.length === 0 || b.length === 0) return 0;
  const bSet = new Set(b.map((item) => item.toLowerCase()));
  const overlap = a.filter((item) => bSet.has(item.toLowerCase())).length;
  return Math.min(max, Math.round((overlap / Math.max(a.length, b.length)) * max));
}

export function matchProductToExisting(input: {
  title: string;
  brand?: string;
  products: ProductLikeForMatch[];
}): ProductMatchResult {
  const attrs = extractProductAttributes(input.title);
  const titleTokens = tokenizeTitle(input.title);
  let best: ProductMatchResult = {
    score: 0,
    confidence: "low",
    reason: "没有找到可合并的标准商品",
    needsReview: true,
  };

  for (const product of input.products) {
    const productTokens = tokenizeTitle(product.normalizedName);
    const productNotes = [
      ...parseJsonArray<string>(product.topNotesJson),
      ...parseJsonArray<string>(product.middleNotesJson),
      ...parseJsonArray<string>(product.baseNotesJson),
    ];

    let score = 0;
    const reasons: string[] = [];
    const brand = input.brand || attrs.brand;
    if (brand && product.brand && brand.toLowerCase() === product.brand.toLowerCase()) {
      score += 30;
      reasons.push("品牌一致");
    }
    const nameScore = overlapScore(titleTokens, productTokens, 30);
    if (nameScore > 0) reasons.push(`名称相似 +${nameScore}`);
    score += nameScore;
    if (attrs.volumeMl && product.volumeMl && attrs.volumeMl === product.volumeMl) {
      score += 10;
      reasons.push("容量一致");
    }
    if (attrs.concentration && product.concentration && attrs.concentration === product.concentration) {
      score += 10;
      reasons.push("浓度一致");
    }
    const notesScore = overlapScore(attrs.notes, productNotes, 10);
    if (notesScore > 0) reasons.push(`香调重合 +${notesScore}`);
    score += notesScore;
    score += Math.min(10, Math.round(nameScore / 3));

    if (score > best.score) {
      best = {
        matchedProductId: product.id,
        score,
        confidence: score >= 85 ? "high" : score >= 70 ? "medium" : "low",
        reason: reasons.join("，") || "标题相似度较低",
        needsReview: score < 70,
      };
    }
  }

  return best;
}
