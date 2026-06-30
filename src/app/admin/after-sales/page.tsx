import Link from "next/link";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function AdminAfterSalesPage({ searchParams }: { searchParams: { status?: string } }) {
  const locale = getLocale();
  const status = searchParams.status;
  const cases = await db.afterSalesCase.findMany({
    where: status ? { status } : {},
    orderBy: [{ riskScore: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "售后工单", "After-sales tickets")}</h1>
      <div className="mt-3 flex gap-2 text-sm">
        {[["", pick(locale, "全部", "All")], ["submitted", "submitted"], ["waiting_evidence", "waiting_evidence"], ["reviewing", "reviewing"], ["approved", "approved"], ["rejected", "rejected"], ["refunded", "refunded"]].map(([value, label]) => (
          <Link key={value || "all"} href={`/admin/after-sales${value ? `?status=${value}` : ""}`} className="rounded-full border border-cream-300 px-3 py-1 text-sage-600">{label}</Link>
        ))}
      </div>
      <table className="mt-4 w-full text-sm">
        <thead className="text-left text-clay-500"><tr><th className="py-2">{pick(locale, "工单", "Ticket")}</th><th>{pick(locale, "类型", "Type")}</th><th>{pick(locale, "风险", "Risk")}</th><th>{pick(locale, "状态", "Status")}</th><th></th></tr></thead>
        <tbody>
          {cases.map((c: { id: string; caseNo: string; type: string; riskScore: number; status: string }) => (
            <tr key={c.id} className="border-t border-cream-200">
              <td className="py-2 font-mono text-xs">{c.caseNo}</td>
              <td>{c.type}</td>
              <td>{c.riskScore >= 60 ? <span className="text-red-600">{c.riskScore}</span> : c.riskScore}</td>
              <td>{c.status}</td>
              <td><Link href={`/admin/after-sales/${c.id}`} className="text-sage-600 underline">{pick(locale, "处理", "Handle")}</Link></td>
            </tr>
          ))}
          {cases.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-clay-500">{pick(locale, "暂无工单", "No tickets yet")}</td></tr>}
        </tbody>
      </table>
    </main>
  );
}
