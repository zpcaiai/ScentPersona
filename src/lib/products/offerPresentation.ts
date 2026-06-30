const RISK_LABELS: Record<string, string> = {
  suspicious_low_price: "价格明显偏低，需人工复核",
  missing_source_url: "缺少商品来源链接",
  missing_brand: "品牌信息不完整",
  missing_image: "缺少商品图片",
  low_rating: "评分偏低",
  too_few_reviews: "评论数较少",
  possible_sample: "可能是小样/试香装",
  possible_decant: "可能是分装",
  possible_gift_box: "可能是礼盒/套装",
  stale_price: "价格数据较旧",
  unknown_shop_type: "店铺类型未知",
};

export function getOfferFreshness(fetchedAt: Date): {
  level: "fresh" | "aging" | "stale";
  label: string;
} {
  const ageHours = (Date.now() - fetchedAt.getTime()) / 36e5;
  if (ageHours <= 24) return { level: "fresh", label: "24 小时内更新" };
  if (ageHours <= 72) return { level: "aging", label: "3 天内更新" };
  return { level: "stale", label: "价格可能已变化" };
}

export function getPurchaseTypeLabel(riskFlags: string[]): string {
  if (riskFlags.includes("possible_decant")) return "分装";
  if (riskFlags.includes("possible_sample")) return "小样/试香";
  if (riskFlags.includes("possible_gift_box")) return "礼盒/套装";
  return "正装候选";
}

export function getRiskLabels(riskFlags: string[]): string[] {
  return riskFlags.map((risk) => RISK_LABELS[risk] || risk);
}
