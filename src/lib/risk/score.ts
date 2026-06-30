/** Pure risk scoring cores (Skill 45). Advisory; blocking is applied by callers. */
export type RiskLevel = "low" | "medium" | "high" | "blocked";

export interface OrderRiskSignals {
  samePhoneOrdersLastDay: number;
  amountMismatch: boolean;
  lowTrustSource: boolean;
  incompleteAddress: boolean;
  firstOrderHighValue: boolean;
  abnormalLowPriceProduct: boolean;
}

export interface UserRiskSignals {
  refundsLast30d: number;
  accountsSameAddress: number;
  addressChangesLast7d: number;
  orderThenRefundCount: number;
}

export interface RefundRiskSignals {
  refundsLast30d: number;
  deliveredButRefund: boolean;
  newUserHighValueRefund: boolean;
  noEvidence: boolean;
}

export interface RiskResult {
  score: number;
  level: RiskLevel;
  flags: string[];
  reasons: string[];
}

function levelFor(score: number): RiskLevel {
  return score >= 80 ? "blocked" : score >= 60 ? "high" : score >= 30 ? "medium" : "low";
}

export function scoreOrderRisk(s: OrderRiskSignals): RiskResult {
  const flags: string[] = [];
  const reasons: string[] = [];
  let score = 0;
  if (s.amountMismatch) { score += 50; flags.push("amount_mismatch"); reasons.push("支付金额与订单不一致"); }
  if (s.abnormalLowPriceProduct) { score += 30; flags.push("abnormal_low_price"); reasons.push("商品异常低价"); }
  if (s.samePhoneOrdersLastDay >= 5) { score += 30; flags.push("burst_orders"); reasons.push("同手机号短时间多单"); }
  else if (s.samePhoneOrdersLastDay >= 3) { score += 15; flags.push("frequent_orders"); }
  if (s.lowTrustSource) { score += 20; flags.push("low_trust_source"); reasons.push("商品来源可信度低"); }
  if (s.firstOrderHighValue) { score += 10; flags.push("first_order_high_value"); }
  if (s.incompleteAddress) { score += 10; flags.push("incomplete_address"); }
  score = Math.min(100, score);
  let level = levelFor(score);
  if (s.amountMismatch && level === "low") level = "high";
  return { score, level, flags, reasons };
}

export function scoreUserRisk(s: UserRiskSignals): RiskResult {
  const flags: string[] = [];
  const reasons: string[] = [];
  let score = 0;
  if (s.refundsLast30d >= 3) { score += 30; flags.push("frequent_refunds"); reasons.push("30天内多次退款"); }
  if (s.accountsSameAddress >= 3) { score += 25; flags.push("multi_account_same_address"); reasons.push("同地址多个账号"); }
  if (s.addressChangesLast7d >= 4) { score += 15; flags.push("frequent_address_change"); }
  if (s.orderThenRefundCount >= 2) { score += 20; flags.push("order_then_refund"); reasons.push("下单后立即退款多次"); }
  score = Math.min(100, score);
  return { score, level: levelFor(score), flags, reasons };
}

export function scoreRefundRisk(s: RefundRiskSignals): RiskResult {
  const flags: string[] = [];
  const reasons: string[] = [];
  let score = 0;
  if (s.refundsLast30d >= 3) { score += 30; flags.push("frequent_refunds"); }
  if (s.deliveredButRefund) { score += 20; flags.push("delivered_but_refund"); reasons.push("物流已签收仍申请退款"); }
  if (s.newUserHighValueRefund) { score += 20; flags.push("new_user_high_value_refund"); }
  if (s.noEvidence) { score += 15; flags.push("no_evidence"); }
  score = Math.min(100, score);
  return { score, level: levelFor(score), flags, reasons };
}
