import type { PlatformAdapter, PlatformProductRaw, ProductOfferInput } from "./types";

export abstract class BasePlatformAdapter implements PlatformAdapter {
  abstract platform: PlatformAdapter["platform"];
  abstract searchProducts(input: Parameters<PlatformAdapter["searchProducts"]>[0]): ReturnType<PlatformAdapter["searchProducts"]>;
  abstract getProductDetail(input: Parameters<PlatformAdapter["getProductDetail"]>[0]): ReturnType<PlatformAdapter["getProductDetail"]>;
  abstract isConfigured(): boolean;

  normalize(raw: PlatformProductRaw): ProductOfferInput {
    return {
      platform: raw.platform,
      platformProductId: raw.platformProductId,
      title: raw.title,
      brand: raw.brand,
      priceCents: raw.priceCents,
      originalPriceCents: raw.originalPriceCents,
      rating: raw.rating,
      reviewCount: raw.reviewCount,
      salesCount: raw.salesCount,
      shopName: raw.shopName,
      shopType: raw.shopType,
      imageUrl: raw.imageUrl,
      sourceUrl: raw.sourceUrl,
      affiliateUrl: raw.affiliateUrl,
      couponInfoJson: JSON.stringify(raw.couponInfo || {}),
      rawDataJson: JSON.stringify(raw.rawData || {}),
      fetchedAt: raw.fetchedAt,
      volume: raw.volume,
      concentration: raw.concentration,
      scentFamily: raw.scentFamily,
      topNotes: raw.topNotes,
      middleNotes: raw.middleNotes,
      baseNotes: raw.baseNotes,
      description: raw.description,
    };
  }
}
