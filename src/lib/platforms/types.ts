export type Platform = "pdd" | "taobao" | "tmall" | "jd" | "manual" | "mock";

export type ProductSortBy =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "sales"
  | "rating"
  | "updated";

export interface PlatformProductSearchInput {
  keyword: string;
  brand?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  page?: number;
  pageSize?: number;
  sortBy?: ProductSortBy;
}

export interface PlatformProductRaw {
  platform: Platform;
  platformProductId?: string;
  title: string;
  brand?: string;
  priceCents?: number;
  originalPriceCents?: number;
  rating?: number;
  reviewCount?: number;
  salesCount?: number;
  shopName?: string;
  shopType?: string;
  imageUrl?: string;
  sourceUrl: string;
  affiliateUrl?: string;
  couponInfo?: Record<string, unknown>;
  rawData: Record<string, unknown>;
  fetchedAt: Date;
  volume?: string;
  concentration?: string;
  scentFamily?: string;
  topNotes?: string[];
  middleNotes?: string[];
  baseNotes?: string[];
  description?: string;
}

export interface ProductOfferInput {
  platform: Platform;
  platformProductId?: string;
  title: string;
  brand?: string;
  priceCents?: number;
  originalPriceCents?: number;
  rating?: number;
  reviewCount?: number;
  salesCount?: number;
  shopName?: string;
  shopType?: string;
  imageUrl?: string;
  sourceUrl: string;
  affiliateUrl?: string;
  couponInfoJson: string;
  rawDataJson: string;
  fetchedAt: Date;
  volume?: string;
  concentration?: string;
  scentFamily?: string;
  topNotes?: string[];
  middleNotes?: string[];
  baseNotes?: string[];
  description?: string;
}

export interface PlatformAdapter {
  platform: Platform;
  searchProducts(input: PlatformProductSearchInput): Promise<PlatformProductRaw[]>;
  getProductDetail(input: { platformProductId?: string; sourceUrl?: string }): Promise<PlatformProductRaw | null>;
  normalize(raw: PlatformProductRaw): ProductOfferInput;
  isConfigured(): boolean;
}
