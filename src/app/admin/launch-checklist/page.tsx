import Link from "next/link";
import { runHealthChecks } from "@/lib/health/checks";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

const DOT: Record<string, string> = { ok: "bg-sage-500", warning: "bg-clay-400", critical: "bg-red-500" };

export default async function LaunchChecklistPage() {
  const locale = getLocale();
  const { status, checks } = await runHealthChecks();
  const label: Record<string, string> = {
    ok: pick(locale, "通过", "Pass"),
    warning: pick(locale, "提示", "Warning"),
    critical: pick(locale, "阻断", "Blocking"),
  };
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "上线前检查", "Launch checklist")}</h1>
      <div className={`mt-3 rounded-xl p-4 text-white ${status === "ok" ? "bg-sage-500" : status === "warning" ? "bg-clay-400" : "bg-red-500"}`}>
        {pick(locale, "总体：", "Overall: ")}
        {status === "ok"
          ? pick(locale, "可以上线", "Ready to launch")
          : status === "warning"
            ? pick(locale, "可上线但有提示项", "Can launch, with warnings")
            : pick(locale, "存在阻断项，暂不可上线", "Blocking issues — not ready to launch")}
      </div>
      <ul className="mt-4 space-y-2">
        {checks.map((c) => (
          <li key={c.key} className="rounded-xl border border-cream-200 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${DOT[c.status]}`} /> {c.label}</span>
              <span className="text-xs text-clay-500">{label[c.status]}</span>
            </div>
            <p className="mt-1 text-sm text-sage-600">{c.detail}</p>
            {c.fix && c.status !== "ok" && <p className="mt-1 text-xs text-clay-600">{pick(locale, "修复：", "Fix: ")}{c.fix}</p>}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-clay-500">{pick(locale, "健康检查 API：", "Health check API: ")}<Link href="/api/health" className="underline">/api/health</Link>{pick(locale, "（critical 返回 503，可用于部署监控）。", " (returns 503 on critical, for deploy monitoring).")}</p>
    </main>
  );
}
