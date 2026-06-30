import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateOfferTrustScore } from "@/lib/trust/calculateOfferTrustScore";
import { auditAdminAction } from "@/lib/admin/audit";
import { getAdminOperator } from "@/lib/admin/auth";

export const runtime = "nodejs";

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const operator = getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = body.action as string | undefined; // approve | reject | needs_review

  const offer = await db.productOffer.findUnique({ where: { id: params.id } });
  if (!offer) return NextResponse.json({ error: "offer_not_found" }, { status: 404 });

  const reviewStatus =
    action === "approve" ? "approved" : action === "reject" ? "rejected" : action === "needs_review" ? "needs_review" : offer.reviewStatus;

  const siblings = await db.productOffer.findMany({
    where: { productId: offer.productId, priceCents: { not: null } },
    select: { priceCents: true },
  });
  const med = median(siblings.map((o: { priceCents: number | null }) => o.priceCents!).filter(Boolean));

  let riskFlags: string[] = [];
  try { riskFlags = JSON.parse(offer.riskFlagsJson || "[]"); } catch { /* ignore */ }

  const trust = calculateOfferTrustScore({
    platform: offer.platform,
    shopType: offer.shopType,
    shopName: offer.shopName,
    title: offer.title,
    brand: offer.brand,
    imageUrl: offer.imageUrl,
    sourceUrl: offer.sourceUrl,
    priceCents: offer.priceCents,
    medianPriceCents: med,
    rating: offer.rating,
    reviewCount: offer.reviewCount,
    salesCount: offer.salesCount,
    riskFlags,
    fetchedAt: offer.fetchedAt,
    reviewStatus,
  });

  await db.productOfferTrustScore.upsert({
    where: { productOfferId: offer.id },
    create: {
      productOfferId: offer.id,
      score: trust.score,
      level: trust.level,
      reasonsJson: JSON.stringify(trust.reasons),
      riskFlagsJson: JSON.stringify(trust.riskFlags),
      recommendationPolicyJson: JSON.stringify(trust.recommendationPolicy),
      reviewStatus,
      reviewedBy: action ? operator : null,
    },
    update: {
      score: trust.score,
      level: trust.level,
      reasonsJson: JSON.stringify(trust.reasons),
      riskFlagsJson: JSON.stringify(trust.riskFlags),
      recommendationPolicyJson: JSON.stringify(trust.recommendationPolicy),
      reviewStatus,
      reviewedBy: action ? operator : undefined,
    },
  });
  if (action) {
    await db.productOffer.update({ where: { id: offer.id }, data: { reviewStatus } });
  }
  await auditAdminAction({ adminUserId: operator, action: "offer_trust", detail: `${offer.id} ${action ?? "recalc"} -> ${trust.level}` });
  return NextResponse.json({ ok: true, trust });
}
