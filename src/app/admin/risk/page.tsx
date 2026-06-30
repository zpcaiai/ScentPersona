import Link from "next/link";
import { db } from "@/lib/db";
import RiskReviewActions from "@/components/admin/RiskReviewActions";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function AdminRiskPage() {
  const locale = getLocale();
  const assessments = await db.riskAssessment.findMany({
    where: { level: { in: ["high", "blocked"] } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const flags = await db.orderRiskFlag.findMany({ where: { resolved: false }, orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "风控", "Risk")}</h1>
      <p className="text-sm text-clay-500">{pick(locale, "风控仅辅助人工，不误伤正常用户。放行将清除拦截，允许该订单支付。", "Risk controls assist human review and should not flag normal users. Approving clears the block and lets the order be paid.")}</p>

      <h2 className="mt-5 font-medium text-clay-600">{pick(locale, `高风险评估（${assessments.length}）`, `High-risk assessments (${assessments.length})`)}</h2>
      <table className="mt-2 w-full text-sm">
        <thead className="text-left text-clay-500"><tr><th className="py-1">{pick(locale, "对象", "Target")}</th><th>{pick(locale, "等级", "Level")}</th><th>{pick(locale, "分", "Score")}</th><th>{pick(locale, "原因", "Reasons")}</th><th></th></tr></thead>
        <tbody>
          {assessments.map((a: { id: string; targetType: string; targetId: string; level: string; score: number; reasonsJson: string }) => {
            let reasons: string[] = []; try { reasons = JSON.parse(a.reasonsJson || "[]"); } catch { /* */ }
            return (
              <tr key={a.id} className="border-t border-cream-200">
                <td className="py-1">{a.targetType === "order" ? <Link href={`/admin/proxy-orders/${a.targetId}`} className="text-sage-600 underline">{pick(locale, "订单", "Order")}</Link> : a.targetType}</td>
                <td className={a.level === "blocked" ? "text-red-600" : "text-clay-600"}>{a.level}</td>
                <td>{a.score}</td>
                <td className="max-w-[200px] truncate">{reasons.join(pick(locale, "；", "; "))}</td>
                <td>{a.targetType === "order" && <RiskReviewActions assessmentId={a.id} />}</td>
              </tr>
            );
          })}
          {assessments.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-clay-500">{pick(locale, "暂无高风险", "No high-risk items")}</td></tr>}
        </tbody>
      </table>

      <h2 className="mt-6 font-medium text-clay-600">{pick(locale, `未处理订单风险标记（${flags.length}）`, `Unresolved order risk flags (${flags.length})`)}</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {flags.map((f: { id: string; orderId: string; riskType: string; reason: string; severity: string }) => (
          <li key={f.id} className="flex justify-between border-b border-cream-200 py-1">
            <span><Link href={`/admin/proxy-orders/${f.orderId}`} className="text-sage-600 underline">{f.riskType}</Link> · {f.reason}</span>
            <span className={f.severity === "blocked" ? "text-red-600" : "text-clay-600"}>{f.severity}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
