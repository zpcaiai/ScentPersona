"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

export default function PrivacyCenterPage() {
  const { locale } = useLang();
  const [data, setData] = useState<{ marketingEnabled: boolean; consents: { consentType: string; acceptedAt: string; revokedAt: string | null }[] } | null>(null);
  const [auth, setAuth] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  function load() {
    fetch("/api/account/privacy").then((r) => { if (r.status === 401) { setAuth(false); return null; } return r.json(); }).then((j) => j && setData(j));
  }
  useEffect(load, []);

  async function revokeMarketing() { await fetch("/api/account/privacy/revoke", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consentType: "marketing" }) }); setMsg(pick(locale, "已关闭营销通知", "Marketing notifications turned off")); load(); }
  async function requestDelete() { await fetch("/api/account/privacy/delete-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "用户申请" }) }); setMsg(pick(locale, "已提交删除申请，我们会尽快处理。订单交易记录将依法保留。", "Your deletion request has been submitted; we'll handle it as soon as possible. Order transaction records will be retained as required by law.")); }
  function exportData() { window.open("/api/account/privacy/export", "_blank"); }

  if (!auth) return <PageShell><p className="text-sage-600">{pick(locale, "请先 ", "Please ")}<Link href="/account" className="underline">{pick(locale, "登录", "sign in")}</Link>{pick(locale, "。", " first.")}</p></PageShell>;

  return (
    <PageShell>
      <div className="space-y-5">
        <Link href="/account" className="text-sm text-sage-600 underline">{pick(locale, "← 我的", "← My account")}</Link>
        <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "隐私与数据", "Privacy & data")}</h1>
        {msg && <p className="rounded-lg bg-cream-100 p-2 text-sm text-sage-600">{msg}</p>}

        <section className="rounded-2xl border border-cream-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sage-600">{pick(locale, "营销通知", "Marketing notifications")}</p>
              <p className="text-xs text-clay-500">{data?.marketingEnabled ? pick(locale, "已开启", "On") : pick(locale, "已关闭", "Off")}{pick(locale, "（订单必要通知不受影响）", " (essential order notifications are unaffected)")}</p>
            </div>
            {data?.marketingEnabled && <button onClick={revokeMarketing} className="text-sm text-clay-500 underline">{pick(locale, "关闭", "Turn off")}</button>}
          </div>
        </section>

        <section className="rounded-2xl border border-cream-200 p-4">
          <p className="font-medium text-sage-600">{pick(locale, "我的数据", "My data")}</p>
          <div className="mt-2 flex gap-3">
            <button onClick={exportData} className="rounded-lg border border-cream-300 px-3 py-1.5 text-sm text-sage-600">{pick(locale, "导出我的数据", "Export my data")}</button>
            <button onClick={requestDelete} className="rounded-lg border border-clay-300 px-3 py-1.5 text-sm text-clay-600">{pick(locale, "申请删除账户", "Request account deletion")}</button>
          </div>
        </section>

        <section>
          <p className="font-medium text-sage-600">{pick(locale, "授权记录", "Consent history")}</p>
          <ul className="mt-2 space-y-1 text-sm text-sage-600">
            {(data?.consents ?? []).map((c, i) => (
              <li key={i}>{c.consentType} · {new Date(c.acceptedAt).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")} {c.revokedAt ? pick(locale, "（已撤回）", "(revoked)") : ""}</li>
            ))}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}
