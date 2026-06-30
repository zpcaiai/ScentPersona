import crypto from "crypto";
import type {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionOutput,
  PaymentProvider,
  RawWebhook,
  RefundInput,
  RefundOutput,
  WebhookVerifyResult,
} from "./types";

const MOCK_SECRET = process.env.MOCK_PAY_SECRET || "mock_pay_secret_dev_only";

export function mockSign(body: string): string {
  return crypto.createHmac("sha256", MOCK_SECRET).update(body).digest("hex");
}

/**
 * Local mock PSP for MVP/dev. Returns a checkout URL pointing at an in-app
 * page that simulates the bank; the success/fail action is delivered back
 * through the same signed, idempotent webhook path as a real provider.
 */
export const mockPaymentProvider: PaymentProvider = {
  providerName: "mock",
  isConfigured() {
    return true;
  },
  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionOutput> {
    const providerPaymentId = `mock_${input.orderNo}_${crypto.randomBytes(4).toString("hex")}`;
    return {
      provider: "mock",
      providerPaymentId,
      checkoutUrl: `/pay/mock/${input.orderId}`,
      status: "created",
    };
  },
  async verifyWebhook(raw: RawWebhook): Promise<WebhookVerifyResult> {
    if (!raw.signature) return { ok: false, reason: "missing_signature" };
    const expected = mockSign(raw.body);
    const a = Buffer.from(expected);
    const b = Buffer.from(raw.signature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { ok: false, reason: "bad_signature" };
    }
    try {
      const parsed = JSON.parse(raw.body) as {
        type?: string;
        providerPaymentId?: string;
        amountCents?: number;
        status?: string;
      };
      if (!parsed.providerPaymentId) return { ok: false, reason: "missing_payment_id" };
      return {
        ok: true,
        event: {
          type: parsed.type ?? "payment.updated",
          providerPaymentId: parsed.providerPaymentId,
          amountCents: parsed.amountCents,
          status: parsed.status ?? "pending",
          raw: parsed,
        },
      };
    } catch {
      return { ok: false, reason: "bad_json" };
    }
  },
  async refund(input: RefundInput): Promise<RefundOutput> {
    return {
      provider: "mock",
      providerRefundId: `mockref_${crypto.randomBytes(4).toString("hex")}`,
      status: "refunded",
    };
  },
  async getPaymentStatus(): Promise<string> {
    // Mock has no remote ledger; status is driven by the webhook. TODO real PSP query.
    return "unknown";
  },
};
