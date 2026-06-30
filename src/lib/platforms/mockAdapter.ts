import { BasePlatformAdapter } from "./baseAdapter";
import type { PlatformProductRaw, PlatformProductSearchInput } from "./types";

const MOCK_PRODUCTS: PlatformProductRaw[] = [
  {
    platform: "mock",
    platformProductId: "mock-white-tea-50",
    title: "白茶清晨 EDP 50ml 清新白茶木质香水",
    brand: "ScentPersona",
    priceCents: 26800,
    originalPriceCents: 32800,
    rating: 4.8,
    reviewCount: 218,
    salesCount: 1200,
    shopName: "ScentPersona 官方样品店",
    shopType: "authorized",
    imageUrl: "/placeholder-product.png",
    sourceUrl: "https://example.com/mock-white-tea",
    rawData: { source: "mock" },
    fetchedAt: new Date(),
    volume: "50ml",
    concentration: "EDP",
    scentFamily: "白茶 木质",
    topNotes: ["白茶", "柑橘"],
    middleNotes: ["纸张", "白麝香"],
    baseNotes: ["雪松", "琥珀"],
    description: "干净、安静、适合通勤和独处。",
  },
  {
    platform: "mock",
    platformProductId: "mock-rain-study-30",
    title: "雨后书房 EDT 30ml 雪松茶香纸张感香水",
    brand: "ScentPersona",
    priceCents: 18800,
    rating: 4.6,
    reviewCount: 96,
    salesCount: 420,
    shopName: "授权香氛集合店",
    shopType: "authorized",
    imageUrl: "/placeholder-product.png",
    sourceUrl: "https://example.com/mock-rain-study",
    rawData: { source: "mock" },
    fetchedAt: new Date(),
    volume: "30ml",
    concentration: "EDT",
    scentFamily: "茶 木质",
    topNotes: ["雨后空气", "茶"],
    middleNotes: ["纸张", "雪松"],
    baseNotes: ["广藿香"],
    description: "适合安静办公、阅读、低存在感场景。",
  },
];

export class MockAdapter extends BasePlatformAdapter {
  platform = "mock" as const;

  isConfigured() {
    return true;
  }

  async searchProducts(input: PlatformProductSearchInput) {
    const keyword = input.keyword.trim().toLowerCase();
    return MOCK_PRODUCTS.filter((item) => {
      const haystack = `${item.title} ${item.brand || ""} ${item.scentFamily || ""}`.toLowerCase();
      return !keyword || haystack.includes(keyword);
    });
  }

  async getProductDetail(input: { platformProductId?: string; sourceUrl?: string }) {
    return MOCK_PRODUCTS.find((item) =>
      item.platformProductId === input.platformProductId || item.sourceUrl === input.sourceUrl
    ) || null;
  }
}
