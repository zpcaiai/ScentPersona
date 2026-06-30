import { isPlatformConfigured } from "@/lib/config/platformConfig";
import { BasePlatformAdapter } from "./baseAdapter";
import type { Platform, PlatformProductSearchInput } from "./types";

class ConfiguredApiAdapter extends BasePlatformAdapter {
  constructor(public platform: Exclude<Platform, "manual" | "mock">) {
    super();
  }

  isConfigured() {
    return isPlatformConfigured(this.platform);
  }

  async searchProducts(_input: PlatformProductSearchInput) {
    if (!this.isConfigured()) return [];
    throw new Error(`${this.platform} official API adapter is not implemented. Use authorized API credentials and SDK before enabling.`);
  }

  async getProductDetail() {
    if (!this.isConfigured()) return null;
    throw new Error(`${this.platform} official API adapter is not implemented. Use authorized API credentials and SDK before enabling.`);
  }
}

export const jdAdapter = new ConfiguredApiAdapter("jd");
export const taobaoAdapter = new ConfiguredApiAdapter("taobao");
export const tmallAdapter = new ConfiguredApiAdapter("tmall");
export const pddAdapter = new ConfiguredApiAdapter("pdd");
