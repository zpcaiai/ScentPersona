import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import TrustActions from "@/components/admin/TrustActions";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function OfferTrustPage({ params }: { params: { offerId: string } }) {
  const locale = getLocale();
  const offer = await db.productOffer.findUnique({ where: { id: params.offerId } });
  if (!offer) notFound();
  const trust = await db.productOfferTrustScore.findUnique({ where: { productOfferId: offer.id } });
  let reasons: string[] = []; let policy: Record<string, boolean> = {};
  if (trust) { try { reasons = JSON.parse(trust.reasonsJson || "[]"); } catch { /* */ } try { policy = JSON.parse(trust.recommendationPolicyJson || "{}"); } catch { /* */ } }
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/admin/offers" className="text-sm text-sage-600 underline">← {pick(locale, "商品报价", "Product offers")}</Link>
      <h1 className="mt-2 font-serif text-2xl text-sage-600">{pick(locale, "可信度评分", "Trust score")}</h1>
      <p className="text-sm">{offer.platform} · {offer.shopName} · {offer.title}</p>
      {trust ? (
        <div className="mt-3 rounded-xl border border-cream-200 p-3 text-sm">
          <p>{pick(locale, "分数", "Score")} <span className="font-serif text-xl text-sage-600">{trust.score}</span> · {pick(locale, "等级", "Level")} {trust.level} · {pick(locale, "审核", "Review")} {trust.reviewStatus}</p>
          <p className="mt-1 text-clay-600">{pick(locale, "原因", "Reasons")}：{reasons.join("；") || "—"}</p>
          <p className="mt-1 text-clay-500">{pick(locale, "可推荐", "Recommendable")} {String(policy.canRecommend)} · {pick(locale, "可作首推", "Can be top pick")} {String(policy.canBeBestOffer)} · {pick(locale, "需提示", "Needs warning")} {String(policy.needsUserWarning)}</p>
        </div>
      ) : <p className="mt-3 text-clay-500">{pick(locale, "尚未评分，点下方「重新评分」。", "Not scored yet — click \u201cRe-score\u201d below.")}</p>}
      <TrustActions offerId={offer.id} />
    </main>
  );
}
