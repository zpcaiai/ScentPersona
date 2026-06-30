import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adapters } from "@/lib/platforms";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  const platform = request.nextUrl.searchParams.get("platform") || "";
  const sortBy = request.nextUrl.searchParams.get("sortBy") || "relevance";
  const onlyAvailable = request.nextUrl.searchParams.get("onlyAvailable") !== "false";

  if (!q) {
    return NextResponse.json({ products: [], offers: [] });
  }

  const offerWhere = {
    ...(onlyAvailable ? { isAvailable: true } : {}),
    ...(platform ? { platform } : {}),
    reviewStatus: { not: "rejected" },
    OR: [
      { title: { contains: q, mode: "insensitive" as const } },
      { brand: { contains: q, mode: "insensitive" as const } },
      { product: { normalizedName: { contains: q, mode: "insensitive" as const } } },
      { product: { brand: { contains: q, mode: "insensitive" as const } } },
    ],
  };

  const orderBy = sortOrder(sortBy);
  const offers = await db.productOffer.findMany({
    where: offerWhere,
    include: { product: true },
    orderBy,
    take: 80,
  });

  let mockOffers: unknown[] = [];
  if (offers.length === 0) {
    const mock = adapters.find((adapter) => adapter.platform === "mock");
    mockOffers = mock ? await mock.searchProducts({ keyword: q }) : [];
  }

  return NextResponse.json({
    offers,
    mockOffers,
    disclaimer: "价格、优惠和库存可能变化，请以平台页面为准。",
  });
}

function sortOrder(sortBy: string) {
  if (sortBy === "price_asc") return [{ priceCents: "asc" as const }];
  if (sortBy === "price_desc") return [{ priceCents: "desc" as const }];
  if (sortBy === "rating") return [{ rating: "desc" as const }];
  if (sortBy === "sales") return [{ salesCount: "desc" as const }];
  if (sortBy === "updated") return [{ fetchedAt: "desc" as const }];
  return [{ qualityScore: "desc" as const }, { fetchedAt: "desc" as const }];
}
