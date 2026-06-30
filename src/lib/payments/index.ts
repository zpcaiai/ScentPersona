import type { PaymentProvider } from "./types";
import { mockPaymentProvider } from "./mockPaymentProvider";
import { stripePaymentProvider } from "./stripePaymentProvider";
import { wechatPayProvider } from "./wechatPayProvider";
import { alipayProvider } from "./alipayProvider";
import { xhsPaymentProvider } from "./xhsPaymentProvider";

export * from "./types";

const REGISTRY: Record<string, PaymentProvider> = {
  mock: mockPaymentProvider,
  stripe: stripePaymentProvider,
  wechat: wechatPayProvider,
  alipay: alipayProvider,
  xhs: xhsPaymentProvider,
};

/** Default provider for the proxy-order MVP. Override per-order via body.provider. */
export const DEFAULT_PAYMENT_PROVIDER = process.env.DEFAULT_PAYMENT_PROVIDER || "mock";

export function getPaymentProvider(name?: string | null): PaymentProvider | null {
  const key = (name || DEFAULT_PAYMENT_PROVIDER).toLowerCase();
  return REGISTRY[key] ?? null;
}

export function listConfiguredProviders(): { name: string; configured: boolean }[] {
  return Object.values(REGISTRY).map((p) => ({ name: p.providerName, configured: p.isConfigured() }));
}
