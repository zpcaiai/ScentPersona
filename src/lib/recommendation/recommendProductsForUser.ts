import { db } from "@/lib/db";
import { parseJsonArray, parseJsonRecord } from "@/lib/utils";
import { selectBestOffer } from "./selectBestOffer";
import type { CatalogRecommendation } from "./types";

const ROLES: CatalogRecommendation["role"][] = ["本命香候选", "安全日常款", "惊喜尝试款"];

export async function recommendProductsForUser(input: {
  tagScores: Record<string, number>;
  avoidTags?: string[];
  limit?: number;
}): Promise<CatalogRecommendation[]> {
  const products = await db.product.findMany({
    where: { reviewStatus: { not: "rejected" } },
    include: {
      offers: {
        where: {
          isAvailable: true,
          reviewStatus: { not: "rejected" },
        },
      },
    },
    take: 100,
  });

  return products
    .map((product) => {
      const productScores = parseJsonRecord<number>(product.scentTagsJson);
      const matchScore = cosineLike(input.tagScores, productScores) - avoidPenalty(input.avoidTags || [], productScores);
      const bestOffer = selectBestOffer(product.offers);
      return {
        product,
        bestOffer,
        alternativeOffers: product.offers.filter((offer) => offer.id !== bestOffer?.id).slice(0, 3),
        matchScore,
      };
    })
    .filter((item) => item.bestOffer)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, input.limit || 3)
    .map((item, index) => ({
      ...item,
      role: ROLES[index] || "惊喜尝试款",
      reason: buildReason(item.product.scentTagsJson, input.tagScores),
    }));
}

function cosineLike(a: Record<string, number>, b: Record<string, number>): number {
  const keys = ["clean", "soft", "woody", "bright", "presence", "calm"];
  return keys.reduce((sum, key) => sum + Math.min(a[key] || 0, b[key] || 0), 0);
}

function avoidPenalty(avoidTags: string[], scores: Record<string, number>): number {
  return avoidTags.reduce((sum, tag) => sum + (scores[tag] || 0) * 2, 0);
}

function buildReason(productScoresJson: string, userScores: Record<string, number>): string {
  const productScores = parseJsonRecord<number>(productScoresJson);
  const top = Object.entries(productScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => dimensionLabel(key));
  const userTop = Object.entries(userScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => dimensionLabel(key));
  return `它的${top.join("和")}较突出，与你测试中呈现的${userTop.join("和")}更接近。`;
}

function dimensionLabel(key: string): string {
  return {
    clean: "干净感",
    soft: "温柔感",
    woody: "木质感",
    bright: "明亮感",
    presence: "存在感",
    calm: "安静感",
  }[key] || key;
}
