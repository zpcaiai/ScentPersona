"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";
export default function TrustActions({ offerId }: { offerId: string }) {
  const router = useRouter();
  const { locale } = useLang();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function call(action?: string) {
    setBusy(true); setMsg(null);
    const r = await fetch(`/api/admin/offers/${offerId}/trust`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action ? { action } : {}) });
    const j = await r.json();
    setBusy(false); setMsg(r.ok ? `✅ ${j.trust?.level} (${j.trust?.score})` : pick(locale, "失败", "Failed"));
    router.refresh();
  }
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button disabled={busy} onClick={() => call()} className="rounded-lg border border-cream-300 px-3 py-1.5 text-sm text-sage-600">{pick(locale, "重新评分", "Rescore")}</button>
      <button disabled={busy} onClick={() => call("approve")} className="rounded-lg bg-sage-500 px-3 py-1.5 text-sm text-white">{pick(locale, "通过", "Approve")}</button>
      <button disabled={busy} onClick={() => call("needs_review")} className="rounded-lg border border-clay-300 px-3 py-1.5 text-sm text-clay-600">{pick(locale, "待复核", "Needs review")}</button>
      <button disabled={busy} onClick={() => call("reject")} className="rounded-lg border border-clay-300 px-3 py-1.5 text-sm text-clay-600">{pick(locale, "拒绝", "Reject")}</button>
      {msg && <span className="text-sm">{msg}</span>}
    </div>
  );
}
