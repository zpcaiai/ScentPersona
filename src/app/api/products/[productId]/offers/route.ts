import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  const sortBy = request.nextUrl.searchParams.get("sortBy") || "price_asc";
  const offers = await db.productOffer.findMany({
    where: {
      productId: params.productId,
      isAvailable: true,
      reviewStatus: { not: "rejected" },
    },
    orderBy: sortBy === "rating"
      ? [{ rating: "desc" }]
      : sortBy === "updated"
        ? [{ fetchedAt: "desc" }]
        : [{ priceCents: "asc" }],
  });

  return NextResponse.json({
    offers,
    disclaimer: "价格、优惠和库存可能变化，请以平台页面为准。",
  });
}
