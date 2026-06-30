"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

const PLATFORM_VALUES = ["mock", "manual", "jd", "taobao", "tmall", "pdd"] as const;

export default function RunJobForm() {
  const router = useRouter();
  const { locale } = useLang();
  const platformLabels: Record<string, string> = {
    mock: pick(locale, "Mock 数据", "Mock data"),
    manual: pick(locale, "手动/CSV", "Manual / CSV"),
    jd: pick(locale, "京东", "JD"),
    taobao: pick(locale, "淘宝", "Taobao"),
    tmall: pick(locale, "天猫", "Tmall"),
    pdd: pick(locale, "拼多多", "Pinduoduo"),
  };
  const [query, setQuery] = useState(pick(locale, "白茶", "white tea"));
  const [platform, setPlatform] = useState("mock");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const runJob = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/jobs/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || pick(locale, "同步失败", "Sync failed"));
      setMessage(pick(locale, `同步完成：导入 ${data.imported || 0}，更新 ${data.updated || 0}，需审核 ${data.needsReview || 0}`, `Sync complete: ${data.imported || 0} imported, ${data.updated || 0} updated, ${data.needsReview || 0} need review`));
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : pick(locale, "同步失败", "Sync failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card grid gap-3">
      <p className="text-sm text-stone-500">
        {pick(
          locale,
          "可先用 Mock 验证流程。京东、淘宝、天猫、拼多多只在授权 API adapter 配置完成后启用。",
          "Use Mock to validate the flow first. JD, Taobao, Tmall and Pinduoduo are enabled only after the authorized API adapter is configured."
        )}
      </p>
      <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="rounded-xl border border-cream-200 px-4 py-3 text-sm text-stone-700"
          placeholder={pick(locale, "搜索关键词", "Search keyword")}
        />
        <select
          value={platform}
          onChange={(event) => setPlatform(event.target.value)}
          className="rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm text-stone-700"
        >
          {PLATFORM_VALUES.map((value) => (
            <option key={value} value={value}>
              {platformLabels[value]}
            </option>
          ))}
        </select>
        <button className="btn-primary" type="button" disabled={loading} onClick={runJob}>
          {loading ? pick(locale, "同步中", "Syncing") : pick(locale, "运行同步", "Run sync")}
        </button>
      </div>
      {message && <div className="text-xs text-stone-500">{message}</div>}
    </div>
  );
}
