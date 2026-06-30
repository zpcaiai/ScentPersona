import Link from "next/link";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";
export const dynamic = "force-dynamic";
export default async function AdminSupportPage({ searchParams }: { searchParams: { status?: string } }) {
  const locale = getLocale();
  const status = searchParams.status;
  const tickets = await db.supportTicket.findMany({ where: status ? { status } : {}, orderBy: { updatedAt: "desc" }, take: 100 });
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "客服工单", "Support tickets")}</h1>
      <div className="mt-3 flex gap-2 text-sm">
        {[["", pick(locale, "全部", "All")], ["waiting_admin", "waiting_admin"], ["waiting_user", "waiting_user"], ["resolved", "resolved"], ["closed", "closed"]].map(([value, label]) => (
          <Link key={value || "all"} href={`/admin/support${value ? `?status=${value}` : ""}`} className="rounded-full border border-cream-300 px-3 py-1 text-sage-600">{label}</Link>
        ))}
      </div>
      <table className="mt-4 w-full text-sm">
        <thead className="text-left text-clay-500"><tr><th className="py-2">{pick(locale, "工单", "Ticket")}</th><th>{pick(locale, "主题", "Subject")}</th><th>{pick(locale, "分类", "Category")}</th><th>{pick(locale, "优先级", "Priority")}</th><th>{pick(locale, "状态", "Status")}</th><th></th></tr></thead>
        <tbody>
          {tickets.map((t: { id: string; ticketNo: string; subject: string; category: string; priority: string; status: string }) => (
            <tr key={t.id} className="border-t border-cream-200">
              <td className="py-2 font-mono text-xs">{t.ticketNo}</td>
              <td className="max-w-[200px] truncate">{t.subject}</td>
              <td>{t.category}</td>
              <td>{t.priority === "high" ? <span className="text-red-600">{pick(locale, "高", "High")}</span> : t.priority}</td>
              <td>{t.status}</td>
              <td><Link href={`/admin/support/${t.id}`} className="text-sage-600 underline">{pick(locale, "处理", "Handle")}</Link></td>
            </tr>
          ))}
          {tickets.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-clay-500">{pick(locale, "暂无工单", "No tickets yet")}</td></tr>}
        </tbody>
      </table>
    </main>
  );
}
