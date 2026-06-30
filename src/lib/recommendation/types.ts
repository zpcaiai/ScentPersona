import type { Product, ProductOffer } from "@prisma/client";

export interface CatalogRecommendation {
  role: "本命香候选" | "安全日常款" | "惊喜尝试款";
  product: Product;
  bestOffer: ProductOffer | null;
  alternativeOffers: ProductOffer[];
  matchScore: number;
  reason: string;
}
