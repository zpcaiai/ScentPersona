import { db } from "@/lib/db";
import { extractScentTags } from "@/lib/fragrance/extractScentTags";
import type { PlatformProductRaw } from "@/lib/platforms/types";
import { BasePlatformAdapter } from "@/lib/platforms/baseAdapter";
import { extractProductAttributes } from "./extractProductAttributes";
import { matchProductToExisting } from "./matchProduct";
import { normalizeTitle } from "./normalizeTitle";
import { evaluateOfferQuality } from "./quality";

export interface ImportCatalogResult {
  success: number;
  failed: number;
  duplicated: number;
  needsReview: number;
  errors: Array<{ index: number; error: string }>;
}

const normalizer = new (class extends BasePlatformAdapter {
  platform = "manual" as const;
  isConfigured() { return true; }
  async searchProducts() { return []; }
  async getProductDetail() { return null; }
})();

export async function importPlatformProducts(rawProducts: PlatformProductRaw[]): Promise<ImportCatalogResult> {
  const result: ImportCatalogResult = { success: 0, failed: 0, duplicated: 0, needsReview: 0, errors: [] };

  for (let index = 0; index < rawProducts.length; index += 1) {
    const raw = rawProducts[index];
    try {
      const offerInput = normalizer.normalize(raw);
      const attrs = extractProductAttributes(raw.title, raw.description);
      const existingProducts = await db.product.findMany({
        take: 200,
        select: {
          id: true,
          normalizedName: true,
          brand: true,
          concentration: true,
          volumeMl: true,
          topNotesJson: true,
          middleNotesJson: true,
          baseNotesJson: true,
        },
      });
      const match = matchProductToExisting({
        title: raw.title,
        brand: raw.brand || attrs.brand,
        products: existingProducts,
      });

      const scentTags = extractScentTags({
        title: raw.title,
        description: raw.description,
        scentFamily: raw.scentFamily || attrs.scentFamily,
        topNotes: raw.topNotes || attrs.notes,
        middleNotes: raw.middleNotes,
        baseNotes: raw.baseNotes,
        productName: attrs.productName,
      });

      const product = match.matchedProductId && !match.needsReview
        ? await db.product.findUniqueOrThrow({ where: { id: match.matchedProductId } })
        : await db.product.create({
            data: {
              normalizedName: attrs.productName || normalizeTitle(raw.title),
              brand: raw.brand || attrs.brand,
              mainImageUrl: raw.imageUrl,
              concentration: raw.concentration || attrs.concentration,
              volumeMl: attrs.volumeMl,
              gender: attrs.gender,
              scentFamily: raw.scentFamily || attrs.scentFamily,
              topNotesJson: JSON.stringify(raw.topNotes || []),
              middleNotesJson: JSON.stringify(raw.middleNotes || []),
              baseNotesJson: JSON.stringify(raw.baseNotes || []),
              scentTagsJson: JSON.stringify(scentTags.scores),
              suitableScenesJson: JSON.stringify(inferScenes(scentTags.scores)),
              reviewStatus: match.needsReview ? "needs_review" : "pending",
            },
          });

      const medianPriceCents = await getMedianPrice(product.id);
      const quality = evaluateOfferQuality({
        title: raw.title,
        brand: raw.brand || attrs.brand,
        imageUrl: raw.imageUrl,
        sourceUrl: raw.sourceUrl,
        rating: raw.rating,
        reviewCount: raw.reviewCount,
        priceCents: raw.priceCents,
        medianPriceCents,
        fetchedAt: raw.fetchedAt,
        shopType: raw.shopType,
      });

      const existingOffer = await db.productOffer.findFirst({
        where: raw.platformProductId
          ? { platform: raw.platform, platformProductId: raw.platformProductId }
          : { platform: raw.platform, sourceUrl: raw.sourceUrl },
      });

      const offer = existingOffer
        ? await db.productOffer.update({
            where: { id: existingOffer.id },
            data: {
              productId: product.id,
              title: offerInput.title,
              brand: offerInput.brand,
              priceCents: offerInput.priceCents,
              originalPriceCents: offerInput.originalPriceCents,
              rating: offerInput.rating,
              reviewCount: offerInput.reviewCount,
              salesCount: offerInput.salesCount,
              shopName: offerInput.shopName,
              shopType: offerInput.shopType,
              imageUrl: offerInput.imageUrl,
              affiliateUrl: offerInput.affiliateUrl,
              couponInfoJson: offerInput.couponInfoJson,
              rawDataJson: offerInput.rawDataJson,
              riskFlagsJson: JSON.stringify(quality.riskFlags),
              qualityScore: quality.qualityScore,
              reviewStatus: quality.reviewStatus,
              fetchedAt: offerInput.fetchedAt,
              isAvailable: true,
            },
          })
        : await db.productOffer.create({
            data: {
              productId: product.id,
              platform: offerInput.platform,
              platformProductId: offerInput.platformProductId,
              title: offerInput.title,
              shopName: offerInput.shopName,
              shopType: offerInput.shopType,
              priceCents: offerInput.priceCents,
              originalPriceCents: offerInput.originalPriceCents,
              currency: "CNY",
              rating: offerInput.rating,
              reviewCount: offerInput.reviewCount,
              salesCount: offerInput.salesCount,
              imageUrl: offerInput.imageUrl,
              sourceUrl: offerInput.sourceUrl,
              affiliateUrl: offerInput.affiliateUrl,
              couponInfoJson: offerInput.couponInfoJson,
              rawDataJson: offerInput.rawDataJson,
              riskFlagsJson: JSON.stringify(quality.riskFlags),
              qualityScore: quality.qualityScore,
              reviewStatus: quality.reviewStatus,
              fetchedAt: offerInput.fetchedAt,
            },
          });

      await db.priceHistory.create({
        data: {
          productOfferId: offer.id,
          priceCents: offerInput.priceCents,
          originalPriceCents: offerInput.originalPriceCents,
          couponInfoJson: offerInput.couponInfoJson,
          fetchedAt: offerInput.fetchedAt,
        },
      });

      if (match.matchedProductId) {
        await db.productMatchCandidate.create({
          data: {
            productId: product.id,
            productOfferId: offer.id,
            matchScore: match.score,
            matchReason: match.reason,
            status: match.needsReview ? "pending" : "approved",
          },
        });
      }

      result.success += 1;
      if (existingOffer) result.duplicated += 1;
      if (quality.reviewStatus === "needs_review" || match.needsReview) result.needsReview += 1;
    } catch (err) {
      result.failed += 1;
      result.errors.push({ index, error: err instanceof Error ? err.message : "导入失败" });
    }
  }

  return result;
}

async function getMedianPrice(productId: string): Promise<number | null> {
  const offers = await db.productOffer.findMany({
    where: { productId, priceCents: { not: null } },
    select: { priceCents: true },
  });
  const prices = offers.map((offer) => offer.priceCents).filter((price): price is number => typeof price === "number").sort((a, b) => a - b);
  if (prices.length === 0) return null;
  return prices[Math.floor(prices.length / 2)];
}

function inferScenes(scores: Record<string, number>): string[] {
  const scenes = new Set<string>();
  if ((scores.clean || 0) >= 5) scenes.add("通勤");
  if ((scores.calm || 0) >= 5) scenes.add("独处");
  if ((scores.soft || 0) >= 5) scenes.add("约会");
  if ((scores.presence || 0) >= 5) scenes.add("重要场合");
  return Array.from(scenes);
}
