import { db } from "@/lib/db";
import LegalManager from "@/components/admin/LegalManager";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function AdminLegalPage() {
  const locale = getLocale();
  const docs = await db.legalDocument.findMany({ orderBy: [{ type: "asc" }, { createdAt: "desc" }], take: 100 });
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "协议与政策管理", "Agreements & policies")}</h1>
      <p className="text-sm text-clay-500">{pick(locale, "用户下单时会记录当时生效版本的快照。发布会自动停用同类型旧版本。", "A snapshot of the version in effect is recorded when a user places an order. Publishing automatically deactivates older versions of the same type.")}</p>
      <div className="mt-4">
        <LegalManager docs={docs.map((d: { id: string; type: string; version: string; title: string; isActive: boolean }) => ({ id: d.id, type: d.type, version: d.version, title: d.title, isActive: d.isActive }))} />
      </div>
    </main>
  );
}
