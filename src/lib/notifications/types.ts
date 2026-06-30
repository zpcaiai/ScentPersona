export interface NotificationProvider {
  readonly channel: string;
  isConfigured(): boolean;
  send(input: { to?: string | null; title: string; content: string; metadata?: Record<string, unknown> }): Promise<{
    ok: boolean;
    providerMessageId?: string;
    error?: string;
  }>;
}

/** Order-critical notifications cannot be disabled by the user. */
export const ORDER_CRITICAL_TYPES = new Set([
  "payment_success", "purchase_started", "purchase_success", "price_changed",
  "out_of_stock", "shipment_created", "shipment_exception", "delivered",
  "refund_requested", "refund_success", "quote_expiring",
]);

export const MARKETING_TYPES = new Set([
  "sample_feedback_reminder", "repurchase_reminder", "coupon_expiring",
]);

/** Built-in fallback templates so notifications work without DB seeding. */
export const DEFAULT_TEMPLATES: Record<string, { title: string; content: string }> = {
  payment_success: { title: "支付成功", content: "订单 {{orderNo}} 已支付，我们将尽快为你采购。" },
  purchase_started: { title: "开始采购", content: "订单 {{orderNo}} 正在为你采购中。" },
  purchase_success: { title: "已采购", content: "订单 {{orderNo}} 已完成采购，等待发货。" },
  price_changed: { title: "价格变化", content: "订单 {{orderNo}} 采购时价格变化，请在订单页确认补差价、换品或退款。" },
  out_of_stock: { title: "缺货提醒", content: "订单 {{orderNo}} 采购时缺货，请选择换品或退款。" },
  shipment_created: { title: "已发货", content: "订单 {{orderNo}} 已发货：{{carrier}} {{trackingNo}}。" },
  delivered: { title: "已签收", content: "订单 {{orderNo}} 已签收，欢迎来填写试香反馈。" },
  refund_requested: { title: "退款申请已收到", content: "订单 {{orderNo}} 的退款申请正在处理。" },
  refund_success: { title: "退款完成", content: "订单 {{orderNo}} 已退款 ¥{{amount}}。" },
  sample_feedback_reminder: { title: "试香反馈", content: "先别急着一次闻完，今天先试第一支，回来告诉我们感受吧。" },
  repurchase_reminder: { title: "补货提醒", content: "你常用的香可能快用完了，要不要补一支？" },
};
