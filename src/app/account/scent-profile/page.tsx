"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { getPersonaById } from "@/data/personas";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

const DIM_ZH: Record<string, string> = { clean: "干净感", soft: "温柔感", woody: "木质感", bright: "明亮感", presence: "存在感", calm: "安静感" };
const DIM_EN: Record<string, string> = { clean: "Clean", soft: "Soft", woody: "Woody", bright: "Bright", presence: "Presence", calm: "Calm" };

export default function ScentProfilePage() {
  const { locale } = useLang();
  const DIM = locale === "en" ? DIM_EN : DIM_ZH;
  const [data, setData] = useState<{ currentPersonaId: string | null; scentScoresJson: string } | null | undefined>(undefined);
  useEffect(() => {
    fetch("/api/account/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setData(j?.scentProfile ?? null));
  }, []);

  if (data === undefined) return <PageShell><p className="text-sage-600">{pick(locale, "加载中…", "Loading…")}</p></PageShell>;
  if (data === null)
    return (
      <PageShell>
        <p className="text-sage-600">{pick(locale, "还没有气味资产。", "No scent assets yet.")}</p>
        <Link href="/quiz" className="mt-3 inline-block text-sage-600 underline">{pick(locale, "去做选香测试 →", "Take the scent quiz →")}</Link>
      </PageShell>
    );

  const persona = data.currentPersonaId ? getPersonaById(data.currentPersonaId, locale) : undefined;
  let scores: Record<string, number> = {};
  try { scores = JSON.parse(data.scentScoresJson || "{}"); } catch { /* ignore */ }

  return (
    <PageShell>
      <div className="space-y-5">
        <Link href="/account" className="text-sm text-sage-600 underline">{pick(locale, "← 我的", "← Account")}</Link>
        <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "我的气味人格", "My scent persona")}</h1>
        {persona && (
          <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4">
            <p className="font-serif text-xl text-clay-600">{persona.name}</p>
            <p className="mt-1 text-sm text-sage-600">{persona.description}</p>
          </div>
        )}
        <div className="space-y-2">
          {Object.keys(DIM).map((k) => (
            <div key={k} className="grid grid-cols-[72px_1fr_28px] items-center gap-2 text-xs text-sage-600">
              <span>{DIM[k]}</span>
              <div className="h-2 overflow-hidden rounded-full bg-cream-100">
                <div className="h-full bg-sage-500" style={{ width: `${Math.min(100, (scores[k] || 0) * 10)}%` }} />
              </div>
              <span>{scores[k] || 0}</span>
            </div>
          ))}
        </div>
        <Link href="/quiz" className="inline-block text-sage-600 underline">{pick(locale, "重新测试更新人格 →", "Retake to update your persona →")}</Link>
      </div>
    </PageShell>
  );
}
