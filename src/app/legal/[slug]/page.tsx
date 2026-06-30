import PageShell from "@/components/layout/PageShell";
import { getActiveDocument } from "@/lib/legal/getActiveDocument";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

const TITLES_ZH: Record<string, string> = {
  terms: "服务协议", privacy: "隐私政策", proxy_order_agreement: "代下单授权说明",
  refund_policy: "退款政策", shipping_policy: "物流政策",
};
const TITLES_EN: Record<string, string> = {
  terms: "Terms of Service", privacy: "Privacy Policy", proxy_order_agreement: "Proxy Order Authorization",
  refund_policy: "Refund Policy", shipping_policy: "Shipping Policy",
};

export default async function LegalPage({ params }: { params: { slug: string } }) {
  const locale = getLocale();
  const titles = locale === "en" ? TITLES_EN : TITLES_ZH;
  const doc = await getActiveDocument(params.slug);
  return (
    <PageShell>
      <article className="prose-sm space-y-3">
        <h1 className="font-serif text-2xl text-sage-600">{doc?.title ?? titles[params.slug] ?? pick(locale, "条款", "Terms")}</h1>
        {doc ? (
          <>
            <p className="text-xs text-clay-500">{pick(locale, "版本", "Version")} {doc.version} · {pick(locale, "生效于", "Effective")} {doc.publishedAt ? new Date(doc.publishedAt).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN") : "—"}</p>
            <div className="whitespace-pre-wrap text-sm text-sage-700">{doc.content}</div>
          </>
        ) : (
          <p className="text-sm text-clay-500">{pick(locale, "该文档尚未发布，请稍后查看，或在后台「协议管理」发布。", "This document hasn't been published yet. Check back later, or publish it in Admin → Legal.")}</p>
        )}
      </article>
    </PageShell>
  );
}
