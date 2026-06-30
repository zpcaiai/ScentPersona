import type { ShippingProvider, TrackingInput, TrackingResult } from "./types";

/**
 * Manual provider (MVP default). No external query — the operator records the
 * carrier + tracking number and the status is driven by admin actions.
 */
export const manualShippingProvider: ShippingProvider = {
  providerName: "manual",
  isConfigured() {
    return true;
  },
  async track(input: TrackingInput): Promise<TrackingResult> {
    return {
      trackingNo: input.trackingNo,
      carrierCode: input.carrierCode ?? null,
      carrierName: input.carrierName ?? null,
      status: "unknown",
      latestText: "物流信息以人工录入为准",
      events: [],
      raw: { provider: "manual" },
    };
  },
};
