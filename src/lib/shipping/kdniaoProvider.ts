import type { ShippingProvider, TrackingInput, TrackingResult } from "./types";

/** 快递鸟 skeleton (Skill 31). Keys from env only. */
export const kdniaoProvider: ShippingProvider = {
  providerName: "kdniao",
  isConfigured() {
    return Boolean(process.env.KDNIAO_API_KEY && process.env.KDNIAO_EBUSINESS_ID);
  },
  async track(_input: TrackingInput): Promise<TrackingResult> {
    // TODO: POST https://api.kdniao.com/Ebusiness/EbusinessOrderHandle.aspx
    throw new Error("kdniao_not_implemented");
  },
};
