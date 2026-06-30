import type { OfferTrustInput, TrustScore, TrustLevel } from "./types";

const MARKETING_WORDS = /正品|包邮|秒杀|限时|热卖|爆款|官方|旗舰|女神|送礼|特价|清仓/g;
const STALE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Offer trust scoring (Skill 42). Pure — no DB. Higher = more trustworthy.
 * Hard blocks: no sourceUrl, or admin-rejected.
 */
export function calculateOfferTrustScore(input: OfferTrustInput): TrustScore {
  const reasons: string[] = [];
  const riskFlags = new Set<string>(input.riskFlags ?? []);

  // Hard blocks
  if (!input.sourceUrl) {
    return blocked("缺少来源链接", riskFlags, ["missing_source_url"]);
  }
  if (input.reviewStatus === "rejected") {
    return blocked("已被人工拒绝", riskFlags, [...riskFlags]);
  }

  let score = 50;

  // Shop type / channel
  switch (input.shopType) {
    case "flagship_official":
      score += 25; reasons.push("官方旗舰店"); break;
    case "brand_authorized":
      score += 18; reasons.push("品牌授权店"); break;
    case "pop":
      reasons.push("第三方店铺"); break;
    default:
      score -= 5; reasons.push("店铺类型未知");
  }

  // Title clarity
  const title = input.title ?? "";
  const marketingHits = (title.match(MARKETING_WORDS) || []).length;
  if (input.brand && title.length > 6 && marketingHits <= 2) {
    score += 5;
  } else {
    score -= 3; reasons.push("标题信息不够清晰");
  }

  // Image
  if (input.imageUrl) score += 5;
  else { score -= 5; reasons.push("缺少商品图"); }

  // Rating
  if (input.rating == null) { score -= 3; reasons.push("暂无评分"); }
  else if (input.rating >= 4.7) score += 8;
  else if (input.rating >= 4.5) score += 5;
  else if (input.rating < 4) { score -= 5; reasons.push("评分偏低"); }

  // Reviews
  if (input.reviewCount == null) score -= 2;
  else if (input.reviewCount >= 1000) score += 6;
  else if (input.reviewCount >= 100) score += 3;
  else if (input.reviewCount < 10) { score -= 3; reasons.push("评论数较少"); }

  // Sales
  if (input.salesCount == null) score -= 1;
  else if (input.salesCount >= 1000) score += 4;
  else if (input.salesCount >= 100) score += 2;

  // Price reasonableness
  if (input.priceCents != null && input.medianPriceCents != null && input.medianPriceCents > 0) {
    if (input.priceCents < input.medianPriceCents * 0.5) {
      score -= 25; riskFlags.add("suspicious_low_price"); reasons.push("价格明显低于同款中位价");
    } else if (input.priceCents > input.medianPriceCents * 3) {
      score -= 10; riskFlags.add("suspicious_high_price"); reasons.push("价格明显高于同款中位价");
    }
  }

  // Decant / sample masquerading
  if (riskFlags.has("possible_decant") || riskFlags.has("possible_sample")) {
    score -= 10; reasons.push("疑似分装/小样，购买前请确认规格");
  }

  // Freshness
  const ageMs = Date.now() - new Date(input.fetchedAt).getTime();
  if (ageMs > STALE_MS) { score -= 8; riskFlags.add("stale_price"); reasons.push("数据超过 7 天未更新"); }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const level: TrustLevel = score >= 75 ? "high" : score >= 50 ? "medium" : "low";

  const suspiciousLow = riskFlags.has("suspicious_low_price");
  const needsReview = input.reviewStatus === "needs_review";

  return {
    score,
    level,
    reasons,
    riskFlags: [...riskFlags],
    recommendationPolicy: {
      canRecommend: true,
      canBeBestOffer: level !== "low" && !suspiciousLow && !needsReview,
      needsUserWarning: level === "low" || suspiciousLow || riskFlags.has("possible_decant"),
      needsAdminReview: level === "low" || suspiciousLow || needsReview,
    },
  };
}

function blocked(reason: string, flags: Set<string>, extra: string[]): TrustScore {
  for (const f of extra) flags.add(f);
  return {
    score: 0,
    level: "blocked",
    reasons: [reason],
    riskFlags: [...flags],
    recommendationPolicy: {
      canRecommend: false,
      canBeBestOffer: false,
      needsUserWarning: true,
      needsAdminReview: true,
    },
  };
}
