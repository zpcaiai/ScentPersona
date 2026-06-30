export interface DataSourceCheckInput {
  sourceType: string;
  platform: string;
  requiresLogin?: boolean;
  hasOfficialApi?: boolean;
  usesCaptchaBypass?: boolean;
  usesPrivateApi?: boolean;
  rateLimitPerMinute?: number;
}

export interface DataSourceCheckResult {
  allowed: boolean;
  riskLevel: "low" | "medium" | "high" | "blocked";
  reasons: string[];
  suggestions: string[];
}

export function checkDataSource(input: DataSourceCheckInput): DataSourceCheckResult {
  const reasons: string[] = [];
  const suggestions: string[] = [];

  if (input.usesCaptchaBypass) reasons.push("使用验证码绕过能力");
  if (input.usesPrivateApi) reasons.push("使用未授权私有接口");
  if (input.requiresLogin && !input.hasOfficialApi) reasons.push("需要登录但没有官方或授权 API");
  if ((input.rateLimitPerMinute || 0) > 60) reasons.push("请求频率过高");

  if (reasons.some((reason) => reason.includes("绕过") || reason.includes("私有接口"))) {
    return {
      allowed: false,
      riskLevel: "blocked",
      reasons,
      suggestions: ["改用官方开放平台、联盟 API、商家授权接口、CSV 或手动导入。"],
    };
  }

  if (reasons.length > 0) {
    suggestions.push("降低请求频率，确认平台授权范围，并保留 sourceUrl/fetchedAt。");
    return { allowed: false, riskLevel: "high", reasons, suggestions };
  }

  if (["csv", "manual", "mock", "official_api", "affiliate_api", "merchant_authorized"].includes(input.sourceType)) {
    return {
      allowed: true,
      riskLevel: "low",
      reasons: ["数据源类型在允许范围内"],
      suggestions: ["继续保留来源、平台、更新时间和原始数据。"],
    };
  }

  return {
    allowed: true,
    riskLevel: input.hasOfficialApi ? "low" : "medium",
    reasons: ["未发现阻断项"],
    suggestions: ["上线前确认平台条款和授权范围。"],
  };
}
