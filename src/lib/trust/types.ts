export type TrustLevel = "high" | "medium" | "low" | "blocked";

export interface RecommendationPolicy {
  canRecommend: boolean;
  canBeBestOffer: boolean;
  needsUserWarning: boolean;
  needsAdminReview: boolean;
}

export interface TrustScore {
  score: number;
  level: TrustLevel;
  reasons: string[];
  riskFlags: string[];
  recommendationPolicy: RecommendationPolicy;
}

export interface OfferTrustInput {
  platform: string;
  shopType?: string | null;
  shopName?: string | null;
  title?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  sourceUrl?: string | null;
  priceCents?: number | null;
  medianPriceCents?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  salesCount?: number | null;
  riskFlags?: string[];
  fetchedAt: Date | string;
  reviewStatus?: string;
}
