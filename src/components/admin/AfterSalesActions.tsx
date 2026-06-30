"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

export default function AfterSalesActions({ caseId }: { caseId: string }) {
  const router = useRouter();
  const { locale } = useLang();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function call(path: string, body: Record<string, unknown>) {
    setBusy(true); setMsg(null);
    const r = await fetch(`/api/admin/after-sales/${caseId}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json();
    setBusy(false); setMsg(r.ok ? `✅ ${pick(locale, "已处理", "Done")}` : `❌ ${j.error || pick(locale, "失败", "Failed")}`);
    if (r.ok) router.refresh();
  }
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button disabled={busy} className="rounded-lg bg-sage-500 px-3 py-1.5 text-sm text-white" onClick={() => call("approve", { conclusion: window.prompt(pick(locale, "结论", "Conclusion")) || pick(locale, "通过", "Approved"), refund: window.confirm(pick(locale, "同时发起退款？", "Also issue a refund?")) })}>{pick(locale, "通过", "Approve")}</button>
      <button disabled={busy} className="rounded-lg border border-clay-300 px-3 py-1.5 text-sm text-clay-600" onClick={() => call("reject", { conclusion: window.prompt(pick(locale, "拒绝原因", "Reason for rejection")) || pick(locale, "未达到条件", "Conditions not met") })}>{pick(locale, "拒绝", "Reject")}</button>
      {msg && <span className="text-sm">{msg}</span>}
    </div>
  );
}
