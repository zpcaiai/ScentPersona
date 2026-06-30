import { parseJsonArray } from "@/lib/utils";
import type { ProductOffer } from "@prisma/client";

export function selectBestOffer(offers: ProductOffer[]): ProductOffer | null {
  const candidates = offers
    .filter((offer) => offer.isAvailable && offer.reviewStatus !== "rejected")
    .filter((offer) => !parseJsonArray<string>(offer.riskFlagsJson).includes("suspicious_low_price"))
    .sort((a, b) => offerScore(b) - offerScore(a));
  return candidates[0] || null;
}

function offerScore(offer: ProductOffer): number {
  let score = offer.qualityScore;
  if (offer.priceCents) score += Math.max(0, 30 - offer.priceCents / 1000);
  if (offer.rating) score += offer.rating * 4;
  if (offer.reviewCount) score += Math.min(15, Math.log10(offer.reviewCount + 1) * 5);
  const ageHours = (Date.now() - offer.fetchedAt.getTime()) / 36e5;
  if (ageHours <= 24) score += 10;
  if (offer.reviewStatus === "approved") score += 15;
  if (offer.reviewStatus === "needs_review") score -= 10;
  return score;
}
