/**
 * After-sales anti-fraud risk scoring (Skill 44). Pure — score is advisory only,
 * never auto-rejects a user.
 */
export interface AfterSalesSignals {
  refundsLast30d: number;
  missingClaimsCount: number;
  orderAmountCents: number;
  isNewUser: boolean;
  hasEvidence: boolean;
  deliveredButClaimsMissing: boolean;
}

const HIGH_VALUE_CENTS = 50000;

export function scoreAfterSalesRisk(s: AfterSalesSignals): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 0;
  if (s.refundsLast30d >= 2) { score += 30; flags.push("frequent_refunds"); }
  if (s.missingClaimsCount >= 2) { score += 30; flags.push("repeat_missing_claims"); }
  if (s.orderAmountCents > HIGH_VALUE_CENTS && !s.hasEvidence) { score += 10; flags.push("high_value_no_evidence"); }
  if (s.isNewUser && s.orderAmountCents > HIGH_VALUE_CENTS) { score += 10; flags.push("new_user_high_value"); }
  if (!s.hasEvidence) { score += 20; flags.push("missing_evidence"); }
  if (s.deliveredButClaimsMissing) { score += 20; flags.push("delivered_but_claims_missing"); }
  return { score: Math.min(100, score), flags };
}

/** Evidence the user should be asked to provide, per case type. */
export const EVIDENCE_REQUIREMENTS: Record<string, string[]> = {
  damaged: ["外包装照片", "商品破损照片", "物流面单照片", "开箱视频（可选）"],
  wrong_item: ["收到商品正面照片", "包装照片", "订单截图"],
  authenticity: ["商品批号/喷码照片", "包装细节照片", "平台订单信息"],
  missing: ["运单号", "物流截图", "收货状态说明"],
  logistics: ["运单号", "物流截图", "收货状态说明"],
  allergy: ["使用部位照片（可选）", "成分疑虑说明"],
  dislike: ["简单说明不适合的原因"],
  other: ["问题描述", "相关照片"],
};
