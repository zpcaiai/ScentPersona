import type { OrderStatus } from "@/lib/orders/orderStatus";
import type { Locale } from "@/lib/scoring/types";

/**
 * User-facing copy for the proxy-order (代下单) service (Skill 35).
 * Kept in data (not hard-coded in components) so it can be reviewed for
 * compliance and later moved into the LegalDocument CMS (Skill 40).
 *
 * The zh values below remain the canonical defaults (e.g. the agreement
 * snapshot stored at confirm time). Use getProxyCopy(locale) in localized UI.
 */

// ----- Canonical (zh) -----

export const PROXY_SERVICE_NAME = "帮我代下单";

export const proxyServiceAgreementShort =
  "我确认授权本平台按以上商品信息为我代下单。若采购时出现价格变化、缺货或物流限制，我同意由平台联系我确认补差价、换品或退款。";

export const proxyServiceAgreementFull = [
  "1. 服务说明：本服务是平台根据你的授权，为你采购你所选择的指定商品，并非淘宝/天猫/京东/拼多多等平台的官方订单页面。",
  "2. 价格说明：报价基于下单时的商品数据，价格、库存与优惠可能随时变化。若采购时价格发生变化，我们会联系你确认补差价、换品或退款，绝不擅自加价采购。",
  "3. 物流说明：物流以商家实际发货及承运方信息为准，运单信息可能存在延迟。香水类商品可能受运输规则限制。",
  "4. 售后说明：采购前可申请取消并退款；已采购或已发货后，需根据平台商家规则处理退换货。",
  "5. 我们不会：保存你的电商平台账号密码、代你登录个人账号、绕过验证码/风控/限购，也不承诺一定抢到或一定最低价。",
] as const;

export const proxyRiskNotices = [
  "价格、优惠和库存可能变化，最终以采购时平台页面为准。",
  "如采购时涨价或缺货，我们会先联系你确认补差价、换品或退款。",
  "香水属于含醇商品，部分线路可能限制运输，以实际承运方为准。",
  "本服务为平台代下单履约，不代表你在第三方电商平台的官方订单。",
] as const;

export const proxyRefundNotice =
  "我们会根据订单当前的采购和发货状态处理退款。若商品已采购或已发货，可能需要先确认平台商家是否支持取消或退货。";

export const proxyShippingNotice =
  "物流信息来自承运方，可能有延迟。若长时间无更新，可点击联系客服核实。";

export const proxyProhibitedItems =
  "本服务不代买违法违规商品、危险品、医疗用途产品，以及任何需要绕过平台规则才能购买的商品。";

/** Status copy shown to end users (kept gentle and non-alarming). */
export const proxyStatusCopy: Record<OrderStatus, { label: string; desc: string }> = {
  draft: { label: "待确认", desc: "请确认商品与收货信息。" },
  quoted: { label: "待确认报价", desc: "报价已生成，请在有效期内确认并支付。" },
  awaiting_payment: { label: "待支付", desc: "请完成支付以便我们开始采购。" },
  paid: { label: "已支付", desc: "已收到付款，正在为你安排采购。" },
  purchasing: { label: "采购中", desc: "正在为你采购，请耐心等待。" },
  purchased: { label: "已采购", desc: "已完成采购，等待商家发货。" },
  price_changed: { label: "待确认差价", desc: "采购时价格发生变化，需要你确认补差价、换品或退款。" },
  out_of_stock: { label: "缺货待处理", desc: "采购时发现暂时缺货，请选择换品或退款。" },
  awaiting_shipment: { label: "待发货", desc: "已完成采购，等待商家发货。" },
  shipped: { label: "运输中", desc: "已发货，可查看物流信息。" },
  delivered: { label: "已签收", desc: "包裹已签收，欢迎来填写试香反馈。" },
  after_sales: { label: "售后中", desc: "我们正在处理你的售后请求。" },
  cancelled: { label: "已取消", desc: "订单已取消。" },
  refund_pending: { label: "退款处理中", desc: "退款正在处理，请耐心等待。" },
  refunded: { label: "已退款", desc: "退款已完成。" },
  failed: { label: "异常处理中", desc: "订单出现异常，客服将尽快跟进。" },
};

// ----- English -----

const proxyStatusCopyEn: Record<OrderStatus, { label: string; desc: string }> = {
  draft: { label: "Pending confirmation", desc: "Please confirm the item and shipping details." },
  quoted: { label: "Quote ready", desc: "Your quote is ready. Please confirm and pay within the valid period." },
  awaiting_payment: { label: "Awaiting payment", desc: "Please complete payment so we can start purchasing." },
  paid: { label: "Paid", desc: "Payment received. We're arranging the purchase for you." },
  purchasing: { label: "Purchasing", desc: "We're purchasing for you. Please hold on." },
  purchased: { label: "Purchased", desc: "Purchase complete. Waiting for the merchant to ship." },
  price_changed: { label: "Price change to confirm", desc: "The price changed at purchase. Please confirm paying the difference, swapping, or a refund." },
  out_of_stock: { label: "Out of stock", desc: "The item was out of stock at purchase. Please choose to swap or refund." },
  awaiting_shipment: { label: "Awaiting shipment", desc: "Purchase complete. Waiting for the merchant to ship." },
  shipped: { label: "In transit", desc: "Shipped. You can view tracking information." },
  delivered: { label: "Delivered", desc: "Your package has arrived. We'd love your scent trial feedback." },
  after_sales: { label: "After-sales", desc: "We're handling your after-sales request." },
  cancelled: { label: "Cancelled", desc: "This order has been cancelled." },
  refund_pending: { label: "Refund processing", desc: "Your refund is being processed. Please hold on." },
  refunded: { label: "Refunded", desc: "Your refund is complete." },
  failed: { label: "Issue being handled", desc: "There's an issue with this order; support will follow up soon." },
};

const proxyServiceAgreementFullEn = [
  "1. About the service: With your authorization, the platform purchases the specific item you selected on your behalf. This is not an official order page on Taobao / Tmall / JD / Pinduoduo or similar platforms.",
  "2. About pricing: The quote is based on the product data at the time of ordering; prices, stock, and discounts may change at any time. If the price changes at purchase, we will contact you to confirm paying the difference, swapping, or a refund — we never raise the price and buy without your consent.",
  "3. About shipping: Shipping follows the merchant's actual dispatch and the carrier's information; tracking may be delayed. Perfume products may be subject to shipping restrictions.",
  "4. About after-sales: You may request cancellation and a refund before purchase; once purchased or shipped, returns and exchanges follow the merchant's rules.",
  "5. We will not: store your e-commerce account passwords, log into your personal accounts for you, bypass captchas / risk controls / purchase limits, and we do not promise to secure the item or guarantee the lowest price.",
] as const;

const proxyRiskNoticesEn = [
  "Prices, discounts, and stock may change; the platform page at the time of purchase is final.",
  "If the price rises or the item is out of stock at purchase, we'll contact you first to confirm paying the difference, swapping, or a refund.",
  "Perfume contains alcohol; some shipping routes may restrict it, subject to the actual carrier.",
  "This service is the platform ordering on your behalf, and does not represent an official order on a third-party e-commerce platform.",
] as const;

interface ProxyCopy {
  serviceName: string;
  agreementShort: string;
  agreementFull: readonly string[];
  riskNotices: readonly string[];
  refundNotice: string;
  shippingNotice: string;
  prohibitedItems: string;
  statusCopy: Record<OrderStatus, { label: string; desc: string }>;
}

const PROXY_COPY_ZH: ProxyCopy = {
  serviceName: PROXY_SERVICE_NAME,
  agreementShort: proxyServiceAgreementShort,
  agreementFull: proxyServiceAgreementFull,
  riskNotices: proxyRiskNotices,
  refundNotice: proxyRefundNotice,
  shippingNotice: proxyShippingNotice,
  prohibitedItems: proxyProhibitedItems,
  statusCopy: proxyStatusCopy,
};

const PROXY_COPY_EN: ProxyCopy = {
  serviceName: "Order It for Me",
  agreementShort:
    "I authorize this platform to place an order on my behalf based on the product information above. If the price changes, the item is out of stock, or shipping is restricted at the time of purchase, I agree that the platform will contact me to confirm paying the difference, swapping the item, or a refund.",
  agreementFull: proxyServiceAgreementFullEn,
  riskNotices: proxyRiskNoticesEn,
  refundNotice:
    "We process refunds based on the order's current purchase and shipping status. If the item has been purchased or shipped, we may first need to confirm whether the merchant allows cancellation or return.",
  shippingNotice:
    "Tracking information comes from the carrier and may be delayed. If there's no update for a while, tap to contact support to check.",
  prohibitedItems:
    "This service does not purchase illegal or non-compliant goods, hazardous items, products for medical use, or anything that requires bypassing platform rules to buy.",
  statusCopy: proxyStatusCopyEn,
};

const PROXY_COPY_BY_LOCALE: Record<Locale, ProxyCopy> = {
  zh: PROXY_COPY_ZH,
  en: PROXY_COPY_EN,
};

/** Locale-aware bundle of proxy-order copy. Defaults to zh. */
export function getProxyCopy(locale: Locale = "zh"): ProxyCopy {
  return PROXY_COPY_BY_LOCALE[locale] ?? PROXY_COPY_ZH;
}

/** Locale-aware status label + desc map. */
export function getProxyStatusCopy(
  locale: Locale = "zh"
): Record<OrderStatus, { label: string; desc: string }> {
  return getProxyCopy(locale).statusCopy;
}
