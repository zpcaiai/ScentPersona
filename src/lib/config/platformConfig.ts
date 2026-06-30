import type { Platform } from "@/lib/platforms/types";

export interface PlatformConfigStatus {
  platform: Platform;
  label: string;
  status: "configured" | "partial" | "missing";
  capabilities: string[];
  requiredEnv: string[];
}

const PLATFORM_ENVS: Record<Platform, { label: string; requiredEnv: string[]; capabilities: string[] }> = {
  jd: {
    label: "京东",
    requiredEnv: ["JD_APP_KEY", "JD_APP_SECRET", "JD_UNION_ID"],
    capabilities: ["搜索商品", "获取详情", "更新价格", "联盟链接"],
  },
  taobao: {
    label: "淘宝",
    requiredEnv: ["TAOBAO_APP_KEY", "TAOBAO_APP_SECRET", "TAOBAO_SESSION"],
    capabilities: ["搜索商品", "获取详情", "更新价格", "联盟链接"],
  },
  tmall: {
    label: "天猫",
    requiredEnv: ["TMALL_APP_KEY", "TMALL_APP_SECRET"],
    capabilities: ["搜索商品", "获取详情", "更新价格", "联盟链接"],
  },
  pdd: {
    label: "拼多多",
    requiredEnv: ["PDD_CLIENT_ID", "PDD_CLIENT_SECRET"],
    capabilities: ["搜索商品", "获取详情", "更新价格", "联盟链接"],
  },
  manual: {
    label: "手动/CSV",
    requiredEnv: [],
    capabilities: ["CSV 导入", "手动维护", "价格追溯"],
  },
  mock: {
    label: "Mock 数据",
    requiredEnv: [],
    capabilities: ["搜索商品", "演示数据", "开发测试"],
  },
};

export function getPlatformConfigStatuses(): PlatformConfigStatus[] {
  return (Object.keys(PLATFORM_ENVS) as Platform[]).map((platform) => {
    const config = PLATFORM_ENVS[platform];
    const configuredCount = config.requiredEnv.filter((key) => !!process.env[key]).length;
    const status =
      config.requiredEnv.length === 0 || configuredCount === config.requiredEnv.length
        ? "configured"
        : configuredCount > 0
          ? "partial"
          : "missing";

    return {
      platform,
      label: config.label,
      status,
      capabilities: config.capabilities,
      requiredEnv: config.requiredEnv,
    };
  });
}

export function isPlatformConfigured(platform: Platform): boolean {
  return getPlatformConfigStatuses().find((item) => item.platform === platform)?.status === "configured";
}
