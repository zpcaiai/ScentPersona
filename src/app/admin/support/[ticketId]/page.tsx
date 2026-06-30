import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import SupportReply from "@/components/admin/SupportReply";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";
export const dynamic = "force-dynamic";
export default async function AdminTicketDetail({ params }: { params: { ticketId: string } }) {
  const locale = getLocale();
  const t = await db.supportTicket.findUnique({ where: { id: params.ticketId }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  if (!t) notFound();
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/admin/support" className="text-sm text-sage-600 underline">{pick(locale, "← 列表", "← List")}</Link>
      <h1 className="mt-2 font-serif text-xl text-sage-600">{t.subject}</h1>
      <p className="text-xs text-clay-500">{t.ticketNo} · {t.category} · {t.status}{t.orderId ? <> · <Link href={`/admin/proxy-orders/${t.orderId}`} className="underline">{pick(locale, "关联订单", "Linked order")}</Link></> : null}</p>
      <div className="mt-4 space-y-2">
        {t.messages.map((m: { id: string; senderType: string; message: string; createdAt: Date }) => (
          <div key={m.id} className={`max-w-[80%] rounded-xl p-2 text-sm ${m.senderType === "admin" ? "ml-auto bg-sage-500 text-white" : m.senderType === "system" ? "mx-auto bg-cream-200 text-clay-600" : "bg-cream-100"}`}>
            {m.message}
          </div>
        ))}
      </div>
      {t.status !== "closed" && <SupportReply ticketId={t.id} />}
    </main>
  );
}
