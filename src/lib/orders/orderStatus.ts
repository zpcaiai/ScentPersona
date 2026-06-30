/**
 * Unified order state machine (Skill 23).
 *
 * Covers the proxy-order (代下单) lifecycle. Sample-kit orders keep their own
 * legacy status strings ("pending"/"completed"/...) and are NOT driven through
 * this machine; `isOrderStatus` guards against accidentally transitioning them.
 */

export const ORDER_STATUSES = [
  "draft",
  "quoted",
  "awaiting_payment",
  "paid",
  "purchasing",
  "purchased",
  "price_changed",
  "out_of_stock",
  "awaiting_shipment",
  "shipped",
  "delivered",
  "after_sales",
  "cancelled",
  "refund_pending",
  "refunded",
  "failed",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const STATUS_SET: ReadonlySet<string> = new Set(ORDER_STATUSES);

/** Explicit forward transitions. cancel/refund_pending/failed are handled by rules below. */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ["quoted"],
  quoted: ["awaiting_payment"],
  awaiting_payment: ["paid"],
  paid: ["purchasing"],
  purchasing: ["purchased", "price_changed", "out_of_stock"],
  purchased: ["awaiting_shipment"],
  price_changed: ["purchasing"],
  out_of_stock: ["purchasing"],
  awaiting_shipment: ["shipped"],
  shipped: ["delivered", "after_sales"],
  delivered: ["after_sales"],
  after_sales: ["delivered"],
  cancelled: [],
  refund_pending: ["refunded"],
  refunded: [],
  failed: [],
};

/** States from which a direct cancellation is allowed (before goods are sourced/shipped). */
export const CANCELLABLE_STATES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  "draft",
  "quoted",
  "awaiting_payment",
  "paid",
  "purchasing",
  "price_changed",
  "out_of_stock",
]);

/** States from which a refund flow can be opened (money has been captured). */
export const REFUNDABLE_STATES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  "paid",
  "purchasing",
  "purchased",
  "price_changed",
  "out_of_stock",
  "awaiting_shipment",
  "shipped",
  "after_sales",
]);

export const TERMINAL_STATES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  "cancelled",
  "refunded",
  "failed",
]);

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && STATUS_SET.has(value);
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return TERMINAL_STATES.has(status);
}

/**
 * Controlled transition check.
 * - terminal states never transition
 * - same-state is not a transition
 * - `failed` is an admin escape hatch from any non-terminal state
 * - `cancelled` only from CANCELLABLE_STATES
 * - `refund_pending` only from REFUNDABLE_STATES
 * - otherwise consult the explicit forward map
 */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (!isOrderStatus(from) || !isOrderStatus(to)) return false;
  if (from === to) return false;
  if (TERMINAL_STATES.has(from)) return false;
  if (to === "failed") return true;
  if (to === "cancelled") return CANCELLABLE_STATES.has(from);
  if (to === "refund_pending") return REFUNDABLE_STATES.has(from);
  return (TRANSITIONS[from] ?? []).includes(to);
}

export function getAllowedNextStatuses(from: OrderStatus): OrderStatus[] {
  if (!isOrderStatus(from)) return [];
  return ORDER_STATUSES.filter((to) => canTransition(from, to));
}

/** Default Chinese event title for a target status (admin/audit timeline). */
export const STATUS_EVENT_TITLE: Record<OrderStatus, string> = {
  draft: "订单已创建",
  quoted: "已生成报价",
  awaiting_payment: "等待支付",
  paid: "用户已支付",
  purchasing: "开始代采购",
  purchased: "已完成采购",
  price_changed: "采购价格发生变化",
  out_of_stock: "采购时发现缺货",
  awaiting_shipment: "等待商家发货",
  shipped: "已发货",
  delivered: "已签收",
  after_sales: "进入售后",
  cancelled: "订单已取消",
  refund_pending: "退款处理中",
  refunded: "已退款",
  failed: "订单异常，需人工处理",
};
