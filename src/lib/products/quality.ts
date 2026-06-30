import { extractProductAttributes } from "./extractProductAttributes";

export type RiskFlag =
  | "suspicious_low_price"
  | "missing_source_url"
  | "missing_brand"
  | "missing_image"
  | "low_rating"
  | "too_few_reviews"
  | "possible_sample"
  | "possible_decant"
  | "possible_gift_box"
  | "stale_price"
  | "unknown_shop_type";

export function evaluateOfferQuality(input: {
  title: string;
  brand?: string | null;
  imageUrl?: string | null;
  sourceUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  priceCents?: number | null;
  medianPriceCents?: number | null;
  fetchedAt: Date;
  shopType?: string | null;
}): { riskFlags: RiskFlag[]; qualityScore: number; reviewStatus: "approved" | "needs_review" | "rejected" | "pending" } {
  const riskFlags: RiskFlag[] = [];
  const attrs = extractProductAttributes(input.title);

  if (!input.sourceUrl) riskFlags.push("missing_source_url");
  if (!input.brand) riskFlags.push("missing_brand");
  if (!input.imageUrl) riskFlags.push("missing_image");
  if (typeof input.rating === "number" && input.rating < 4) riskFlags.push("low_rating");
  if (typeof input.reviewCount === "number" && input.reviewCount < 10) riskFlags.push("too_few_reviews");
  if (attrs.isSample) riskFlags.push("possible_sample");
  if (attrs.isDecant) riskFlags.push("possible_decant");
  if (attrs.isGiftBox) riskFlags.push("possible_gift_box");
  if (!input.shopType) riskFlags.push("unknown_shop_type");
  if (Date.now() - input.fetchedAt.getTime() > 7 * 24 * 60 * 60 * 1000) riskFlags.push("stale_price");
  if (input.priceCents && input.medianPriceCents && input.priceCents < input.medianPriceCents * 0.5) {
    riskFlags.push("suspicious_low_price");
  }

  let qualityScore = 0;
  if (input.brand) qualityScore += 10;
  if (input.imageUrl) qualityScore += 10;
  if (input.sourceUrl) qualityScore += 10;
  if (typeof input.rating === "number") qualityScore += 10;
  if (typeof input.reviewCount === "number") qualityScore += 10;
  if (!riskFlags.includes("suspicious_low_price")) qualityScore += 20;
  if (input.title.length >= 8) qualityScore += 10;
  if (!riskFlags.includes("stale_price")) qualityScore += 10;
  if (riskFlags.length === 0) qualityScore += 10;

  return {
    riskFlags,
    qualityScore,
    reviewStatus: riskFlags.includes("missing_source_url") ? "rejected" : riskFlags.length > 0 ? "needs_review" : "approved",
  };
}
