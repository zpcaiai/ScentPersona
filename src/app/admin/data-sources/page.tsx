import PageShell from "@/components/layout/PageShell";
import { getPlatformConfigStatuses } from "@/lib/config/platformConfig";
import { checkDataSource } from "@/lib/compliance/checkDataSource";
import { getLocale } from "@/lib/i18n/server";
import { pick, type Locale } from "@/lib/i18n/config";

export default function AdminDataSourcesPage() {
  const locale = getLocale();
  const statuses = getPlatformConfigStatuses();

  return (
    <PageShell>
      <div className="py-8">
        <h1 className="text-2xl font-serif text-stone-800 text-center">{pick(locale, "数据源配置", "Data source config")}</h1>
      </div>
      <div className="grid gap-4">
        {statuses.map((item) => {
          const compliance = checkDataSource({
            platform: item.platform,
            sourceType: item.platform === "manual" ? "csv" : item.platform === "mock" ? "mock" : "official_api",
            hasOfficialApi: item.status === "configured",
            rateLimitPerMinute: 30,
          });
          return (
            <div key={item.platform} className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-lg text-stone-800">{item.label}</h2>
                  <div className="mt-1 text-sm text-stone-500">{pick(locale, "配置状态", "Config status")}：{statusLabel(item.status, locale)}</div>
                  <div className="mt-1 text-sm text-stone-500">{pick(locale, "合规状态", "Compliance status")}：{compliance.riskLevel}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.capabilities.map((capability) => (
                      <span key={capability} className="rounded-full bg-cream-100 px-3 py-1 text-xs text-stone-500">{capability}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right text-xs text-stone-400">
                  {item.requiredEnv.length ? item.requiredEnv.join(", ") : pick(locale, "无需密钥", "No keys needed")}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}

function statusLabel(status: string, locale: Locale) {
  return status === "configured"
    ? pick(locale, "已配置", "Configured")
    : status === "partial"
      ? pick(locale, "配置不完整", "Partially configured")
      : pick(locale, "未配置", "Not configured");
}
