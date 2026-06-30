import Link from "next/link";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function CompliancePage() {
  const locale = getLocale();
  const products = await db.product.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
  const checks = await db.cosmeticComplianceCheck.findMany({ where: { productId: { in: products.map((p) => p.id) } } });
  const map = new Map(checks.map((c: { productId: string; checkStatus: string }) => [c.productId, c.checkStatus]));
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "商品合规审核", "Product compliance review")}</h1>
      <p className="text-sm text-clay-500">{pick(locale, "failed 不可推荐；warning 可展示但提示信息有限；needs_review 不作首推。不编造备案/成分/生产商。", "failed: not recommendable; warning: shown with limited info; needs_review: not a top pick. Never fabricate filing numbers, ingredients, or manufacturers.")}</p>
      <table className="mt-4 w-full text-sm">
        <thead className="text-left text-clay-500"><tr><th className="py-2">{pick(locale, "商品", "Product")}</th><th>{pick(locale, "品牌", "Brand")}</th><th>{pick(locale, "合规状态", "Compliance status")}</th><th></th></tr></thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-t border-cream-200">
              <td className="max-w-[240px] truncate py-2">{p.normalizedName}</td>
              <td>{p.brand}</td>
              <td>{map.get(p.id) ?? "pending"}</td>
              <td><Link href={`/admin/compliance/products/${p.id}`} className="text-sage-600 underline">{pick(locale, "审核", "Review")}</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
