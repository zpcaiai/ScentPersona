import type { ShippingProvider, ShippingStatus, TrackingInput, TrackingResult } from "./types";

/** Deterministic fake trajectory for demos/tests. */
export const mockShippingProvider: ShippingProvider = {
  providerName: "mock",
  isConfigured() {
    return true;
  },
  async track(input: TrackingInput): Promise<TrackingResult> {
    const lastChar = input.trackingNo.slice(-1);
    const delivered = /[02468]/.test(lastChar);
    const status: ShippingStatus = delivered ? "delivered" : "in_transit";
    const now = Date.now();
    const events = [
      { time: new Date(now - 36e5 * 12).toISOString(), location: "杭州", text: "商家已发货" },
      { time: new Date(now - 36e5 * 6).toISOString(), location: "杭州转运中心", text: "运输中" },
      ...(delivered
        ? [{ time: new Date(now - 36e5).toISOString(), location: "收件地", text: "已签收，签收人：本人" }]
        : [{ time: new Date(now - 36e5 * 2).toISOString(), location: "目的城市", text: "派送中" }]),
    ];
    return {
      trackingNo: input.trackingNo,
      carrierCode: input.carrierCode ?? "mock",
      carrierName: input.carrierName ?? "Mock 快递",
      status,
      latestText: events[events.length - 1].text,
      events,
      raw: { provider: "mock", delivered },
    };
  },
};
