/** Payment provider abstraction (Skill 27). No card data ever touches our servers. */

export interface PaymentCustomer {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  openid?: string | null;
}

export interface CreateCheckoutSessionInput {
  orderId: string;
  orderNo: string;
  amountCents: number;
  currency: string;
  description: string;
  purpose?: string;
  customer?: PaymentCustomer;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionOutput {
  provider: string;
  providerPaymentId: string;
  checkoutUrl?: string;
  clientSecret?: string;
  status: string;
}

export interface RefundInput {
  providerPaymentId: string;
  amountCents: number;
  /** Original captured total (required by WeChat refund). */
  originalAmountCents?: number;
  reason: string;
}

export interface RefundOutput {
  provider: string;
  providerRefundId: string;
  status: string;
}

export interface PaymentWebhookEvent {
  type: string;
  providerPaymentId: string;
  amountCents?: number;
  status: "paid" | "failed" | "pending" | string;
  raw: unknown;
}

export interface WebhookVerifyResult {
  ok: boolean;
  event?: PaymentWebhookEvent;
  reason?: string;
}

export interface RawWebhook {
  body: string;
  signature: string | null;
  headers?: Record<string, string>;
}

export interface PaymentProvider {
  readonly providerName: string;
  isConfigured(): boolean;
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionOutput>;
  verifyWebhook(raw: RawWebhook): Promise<WebhookVerifyResult>;
  refund(input: RefundInput): Promise<RefundOutput>;
  getPaymentStatus(providerPaymentId: string): Promise<string>;
}
