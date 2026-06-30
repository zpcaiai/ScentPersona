import type { ShippingProvider } from "./types";
import { manualShippingProvider } from "./manualShippingProvider";
import { mockShippingProvider } from "./mockShippingProvider";
import { kuaidi100Provider } from "./kuaidi100Provider";
import { kdniaoProvider } from "./kdniaoProvider";

export * from "./types";

const REGISTRY: Record<string, ShippingProvider> = {
  manual: manualShippingProvider,
  mock: mockShippingProvider,
  kuaidi100: kuaidi100Provider,
  kdniao: kdniaoProvider,
};

export const DEFAULT_SHIPPING_PROVIDER = process.env.DEFAULT_SHIPPING_PROVIDER || "manual";

export function getShippingProvider(name?: string | null): ShippingProvider | null {
  const key = (name || DEFAULT_SHIPPING_PROVIDER).toLowerCase();
  return REGISTRY[key] ?? null;
}

export function listShippingProviders(): { name: string; configured: boolean }[] {
  return Object.values(REGISTRY).map((p) => ({ name: p.providerName, configured: p.isConfigured() }));
}
