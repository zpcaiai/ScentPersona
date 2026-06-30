import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import AfterSalesActions from "@/components/admin/AfterSalesActions";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function AdminAfterSalesDetail({ params }: { params: { caseId: string } }) {
  const locale = getLocale();
  const c = await db.afterSalesCase.findUnique({ where: { id: params.caseId }, include: { evidence: true } });
  if (!c) notFound();
  let flags: string[] = [];
  try { flags = JSON.parse(c.riskFlagsJson || "[]"); } catch { /* ignore */ }
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/admin/after-sales" className="text-sm text-sage-600 underline">{pick(locale, "← 列表", "← List")}</Link>
      <h1 className="mt-2 font-serif text-2xl text-sage-600">{c.caseNo}</h1>
      <p className="text-sage-600">{pick(locale, "类型", "Type")} {c.type} · {pick(locale, "状态", "Status")} {c.status} · {pick(locale, "风险分", "Risk score")} {c.riskScore}</p>
      {flags.length > 0 && <p className="text-sm text-clay-600">{pick(locale, "风险标记：", "Risk flags: ")}{flags.join(pick(locale, "、", ", "))}{pick(locale, "（仅辅助人工，不自动拒绝）", " (advisory only — never auto-rejects)")}</p>}
      <Link href={`/admin/proxy-orders/${c.orderId}`} className="text-sm text-sage-600 underline">{pick(locale, "查看关联订单 →", "View linked order →")}</Link>

      <section className="mt-4 rounded-xl border border-cream-200 p-3">
        <p className="font-medium text-sage-600">{pick(locale, "用户描述", "User description")}</p>
        <p className="text-sm">{c.userDescription}</p>
      </section>
      <section className="mt-3 rounded-xl border border-cream-200 p-3">
        <p className="font-medium text-sage-600">{pick(locale, "证据", "Evidence")} {pick(locale, "（", "(")}{c.evidence.length}{pick(locale, "）", ")")}</p>
        <ul className="mt-1 space-y-1 text-sm">
          {c.evidence.map((e: { id: string; evidenceType: string; text: string | null; fileUrl: string | null }) => <li key={e.id}>· {e.evidenceType}: {e.text || e.fileUrl}</li>)}
          {c.evidence.length === 0 && <li className="text-clay-500">{pick(locale, "用户暂未提供证据", "No evidence provided yet")}</li>}
        </ul>
      </section>
      {c.adminConclusion && <p className="mt-3 text-sm">{pick(locale, "结论：", "Conclusion: ")}{c.adminConclusion}</p>}
      {!c.closedAt && <AfterSalesActions caseId={c.id} />}
    </main>
  );
}
