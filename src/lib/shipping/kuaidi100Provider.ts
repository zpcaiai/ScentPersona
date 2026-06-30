import type { ShippingProvider, TrackingInput, TrackingResult } from "./types";

/** 快递100 skeleton (Skill 31). Keys from env only. */
export const kuaidi100Provider: ShippingProvider = {
  providerName: "kuaidi100",
  isConfigured() {
    return Boolean(process.env.KUAIDI100_KEY && process.env.KUAIDI100_CUSTOMER);
  },
  async track(_input: TrackingInput): Promise<TrackingResult> {
    // TODO: POST https://poll.kuaidi100.com/poll/query.do with signed param
    throw new Error("kuaidi100_not_implemented");
  },
};
