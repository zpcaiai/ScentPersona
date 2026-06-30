import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const REVIEW_STATUSES = new Set(["pending", "approved", "rejected", "needs_review"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const reviewStatus = typeof body.reviewStatus === "string" ? body.reviewStatus : "";
    if (!REVIEW_STATUSES.has(reviewStatus)) {
      return NextResponse.json({ error: "Invalid reviewStatus" }, { status: 400 });
    }
    const offer = await db.productOffer.update({
      where: { id: params.id },
      data: { reviewStatus },
    });
    return NextResponse.json({ offerId: offer.id, reviewStatus: offer.reviewStatus });
  } catch {
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
