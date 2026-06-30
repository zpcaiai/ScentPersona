import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ComplianceForm from "@/components/admin/ComplianceForm";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function ComplianceDetail({ params }: { params: { productId: string } }) {
  const locale = getLocale();
  const product = await db.product.findUnique({ where: { id: params.productId } });
  if (!product) notFound();
  const check = await db.cosmeticComplianceCheck.findUnique({ where: { productId: product.id } });
  let flags: string[] = []; if (check) { try { flags = JSON.parse(check.riskFlagsJson || "[]"); } catch { /* */ } }
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/admin/compliance/products" className="text-sm text-sage-600 underline">{pick(locale, "← 列表", "← Back to list")}</Link>
      <h1 className="mt-2 font-serif text-2xl text-sage-600">{product.normalizedName}</h1>
      <p className="text-sage-600">{pick(locale, "当前状态：", "Current status: ")}{check?.checkStatus ?? "pending"}</p>
      {flags.length > 0 && <p className="text-sm text-clay-600">{pick(locale, "文案风险：", "Copy risks: ")}{flags.join(pick(locale, "、", ", "))}</p>}
      <ComplianceForm
        productId={product.id}
        initial={check ? { filingNo: check.filingNo ?? "", manufacturer: check.manufacturer ?? "", importer: check.importer ?? "", originCountry: check.originCountry ?? "", batchNo: check.batchNo ?? "", shelfLife: check.shelfLife ?? "", allergenNotice: check.allergenNotice ?? "", checkStatus: check.checkStatus } : undefined}
      />
    </main>
  );
}
