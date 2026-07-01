import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Test-only: seed a recommendable product + offer. Disabled unless E2E_TEST=1. */
export async function POST() {
  if (process.env.E2E_TEST !== "1") return NextResponse.json({ error: "disabled" }, { status: 404 });
  const product = await db.product.create({
    data: { normalizedName: `E2E测试香水${Date.now()}`, brand: "E2E", volumeMl: 50, category: "fragrance", scentTagsJson: JSON.stringify({ clean: 8, calm: 6 }), reviewStatus: "approved" },
  });
  const offer = await db.productOffer.create({
    data: {
      productId: product.id, platform: "mock", title: "E2E测试香水 50ml 正品旗舰",
      brand: "E2E", shopName: "E2E官方旗舰店", shopType: "flagship_official",
      priceCents: 19900, currency: "CNY", rating: 4.8, reviewCount: 1200, salesCount: 800,
      imageUrl: "https://example.com/e2e.jpg", sourceUrl: "https://example.com/e2e",
      riskFlagsJson: "[]", qualityScore: 85, reviewStatus: "approved", fetchedAt: new Date(), isAvailable: true,
    },
  });
  return NextResponse.json({ productId: product.id, offerId: offer.id });
}
