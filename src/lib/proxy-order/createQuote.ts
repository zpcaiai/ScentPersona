import { db } from "@/lib/db";
import { generateOrderNo, generateOrderAccessToken } from "@/lib/order-utils";
import { recordOrderEvent, transitionOrderStatus } from "@/lib/orders/transitionOrderStatus";
import { computeServiceFeeCents, type ServiceLevel } from "./serviceFee";

export const QUOTE_TTL_MS = 30 * 60 * 1000;
const STALE_MS = 24 * 60 * 60 * 1000;
const DECANT_RE = /分装|小样|试管|试用装|体验装|decant|sample/i;

export interface CreateQuoteInput {
  offerId: string;
  quantity?: number;
  serviceLevel?: ServiceLevel;
  sessionId?: string | null;
  userNote?: string | null;
}

export interface QuoteBreakdown {
  unitPriceCents: number;
  quantity: number;
  productPriceCents: number;
  serviceFeeCents: number;
  domesticShippingFeeCents: number;
  estimatedTotalCents: number;
  currency: string;
}

export interface QuoteResult {
  orderId: string;
  orderNo: string;
  accessToken: string;
  status: string;
  blocked: boolean;
  riskFlags: string[];
  breakdown: QuoteBreakdown;
  quoteExpiresAt: Date | null;
}

/**
 * Build a payable quote from a ProductOffer and persist it as a proxy Order.
 * Suspicious-low-price offers are NOT auto-quoted; they stay in `draft` for
 * manual review (Skill 25 / 18).
 */
export async function createQuote(input: CreateQuoteInput): Promise<QuoteResult> {
  const quantity = Math.max(1, Math.min(Math.floor(input.quantity ?? 1), 10));

  const offer = await db.productOffer.findUnique({
    where: { id: input.offerId },
    include: { product: true },
  });
  if (!offer) throw new Error("OFFER_NOT_FOUND");
  if (offer.priceCents == null) throw new Error("OFFER_NO_PRICE");

  const unitPriceCents = offer.priceCents;
  const productPriceCents = unitPriceCents * quantity;
  const serviceFeeCents = computeServiceFeeCents(productPriceCents, input.serviceLevel ?? "standard");
  const domesticShippingFeeCents = 0;
  const estimatedTotalCents = productPriceCents + serviceFeeCents + domesticShippingFeeCents;

  const riskFlags: string[] = [];
  let offerRisk: string[] = [];
  try {
    const parsed = JSON.parse(offer.riskFlagsJson || "[]");
    if (Array.isArray(parsed)) offerRisk = parsed.map(String);
  } catch {
    /* ignore malformed */
  }
  const suspiciousLow = offerRisk.includes("suspicious_low_price");
  if (suspiciousLow) riskFlags.push("suspicious_low_price");
  if (Date.now() - new Date(offer.fetchedAt).getTime() > STALE_MS) riskFlags.push("stale_price");
  const decantText = `${offer.title} ${offer.product?.normalizedName ?? ""}`;
  if (DECANT_RE.test(decantText)) riskFlags.push("possible_decant");

  // Suspicious-low-price offers require manual review before a payable quote.
  const blocked = suspiciousLow;

  const priceSnapshot = {
    platform: offer.platform,
    title: offer.title,
    priceCents: offer.priceCents,
    originalPriceCents: offer.originalPriceCents,
    rating: offer.rating,
    reviewCount: offer.reviewCount,
    salesCount: offer.salesCount,
    shopName: offer.shopName,
    shopType: offer.shopType,
    sourceUrl: offer.sourceUrl,
    imageUrl: offer.imageUrl,
    fetchedAt: offer.fetchedAt,
  };

  const orderNo = generateOrderNo();
  const accessToken = generateOrderAccessToken();
  const quoteExpiresAt = blocked ? null : new Date(Date.now() + QUOTE_TTL_MS);

  const order = await db.order.create({
    data: {
      orderNo,
      accessToken,
      orderType: "proxy",
      sessionId: input.sessionId ?? null,
      productType: "proxy_order",
      status: "draft",
      platform: "web",
      // Customer name/phone are captured at the confirm step (placeholder until then).
      customerName: "",
      customerPhone: "",
      amount: estimatedTotalCents,
      sourcePlatform: offer.platform,
      sourceOfferId: offer.id,
      sourceProductUrl: offer.sourceUrl,
      productTitle: offer.title,
      productImageUrl: offer.imageUrl,
      productBrand: offer.brand ?? offer.product?.brand ?? null,
      productSpec: offer.product?.volumeMl ? `${offer.product.volumeMl}ml` : null,
      quantity,
      productPriceCents,
      serviceFeeCents,
      domesticShippingFeeCents,
      estimatedTotalCents,
      currency: offer.currency || "CNY",
      quoteExpiresAt,
      priceSnapshotJson: JSON.stringify(priceSnapshot),
      riskFlagsJson: JSON.stringify(riskFlags),
      userNote: input.userNote ?? null,
    },
  });

  await recordOrderEvent({
    orderId: order.id,
    eventType: "order_created",
    title: "代下单已创建",
    metadata: { offerId: offer.id, quantity, riskFlags },
  });

  if (!blocked) {
    await transitionOrderStatus({
      orderId: order.id,
      to: "quoted",
      eventType: "quote_created",
      message: "已生成报价，等待用户确认",
    });
  }

  return {
    orderId: order.id,
    orderNo: order.orderNo,
    accessToken: order.accessToken,
    status: blocked ? "draft" : "quoted",
    blocked,
    riskFlags,
    breakdown: {
      unitPriceCents,
      quantity,
      productPriceCents,
      serviceFeeCents,
      domesticShippingFeeCents,
      estimatedTotalCents,
      currency: order.currency,
    },
    quoteExpiresAt,
  };
}
