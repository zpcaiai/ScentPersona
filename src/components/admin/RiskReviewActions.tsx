"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";
export default function RiskReviewActions({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const { locale } = useLang();
  const [busy, setBusy] = useState(false);
  async function review(status: string) {
    setBusy(true);
    await fetch(`/api/admin/risk/${assessmentId}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, note: window.prompt(pick(locale, "备注", "Note")) || "" }) });
    setBusy(false); router.refresh();
  }
  return (
    <span className="space-x-2">
      <button disabled={busy} onClick={() => review("approved")} className="text-sage-600 underline">{pick(locale, "放行", "Allow")}</button>
      <button disabled={busy} onClick={() => review("rejected")} className="text-clay-600 underline">{pick(locale, "维持拦截", "Keep blocked")}</button>
    </span>
  );
}
