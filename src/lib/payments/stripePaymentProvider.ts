import type {
  CreateCheckoutSessionInput,
  CreateCheckoutSessionOutput,
  PaymentProvider,
  RawWebhook,
  RefundInput,
  RefundOutput,
  WebhookVerifyResult,
} from "./types";

/**
 * Stripe Checkout skeleton (Skill 27). Configure via env, then implement using
 * the Stripe SDK / Checkout Sessions API. Keys are read from env only.
 */
export const stripePaymentProvider: PaymentProvider = {
  providerName: "stripe",
  isConfigured() {
    return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
  },
  async createCheckoutSession(_input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionOutput> {
    // TODO: stripe.checkout.sessions.create({ mode: "payment", line_items, ... })
    throw new Error("stripe_provider_not_implemented");
  },
  async verifyWebhook(_raw: RawWebhook): Promise<WebhookVerifyResult> {
    // TODO: stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
    return { ok: false, reason: "stripe_provider_not_implemented" };
  },
  async refund(_input: RefundInput): Promise<RefundOutput> {
    throw new Error("stripe_provider_not_implemented");
  },
  async getPaymentStatus(): Promise<string> {
    return "unknown";
  },
};
