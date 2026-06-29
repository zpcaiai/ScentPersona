import { notFound } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import PersonaHero from "@/components/result/PersonaHero";
import ScentProfileCard from "@/components/result/ScentProfileCard";
import RecommendedSamples from "@/components/result/RecommendedSamples";
import ShareCard from "@/components/result/ShareCard";
import TrackEvent from "@/components/common/TrackEvent";
import { db } from "@/lib/db";
import { getPersonaById } from "@/data/personas";
import { getProductById } from "@/data/products";
import { parseJsonArray, parseJsonRecord } from "@/lib/utils";
import { matchPersona } from "@/lib/scoring/matchPersona";
import { recommendProducts } from "@/lib/scoring/recommendProducts";
import { SITE_COPY } from "@/data/copy";
import type { PersonaId, ScentTag, ProductRecommendation } from "@/lib/scoring/types";

interface ResultPageProps {
  params: { sessionId: string };
}

export default async function ResultPage({ params }: ResultPageProps) {
  const session = await db.quizSession.findUnique({
    where: { id: params.sessionId },
  });

  if (!session || !session.personaId) {
    return (
      <PageShell>
        <div className="text-center py-16">
          <h1 className="text-xl font-serif text-stone-700">
            未找到测试结果
          </h1>
          <p className="mt-2 text-stone-500">
            可能链接已失效，试试重新测试。
          </p>
          <Link href="/quiz" className="btn-primary mt-6 inline-flex">
            重新测试
          </Link>
        </div>
      </PageShell>
    );
  }

  const persona = getPersonaById(session.personaId);
  if (!persona) {
    notFound();
  }
  const p = persona!;

  const tagScores = parseJsonRecord<number>(session.tagScoresJson);
  const recommendedProductIds = parseJsonArray<string>(session.recommendedProductIdsJson);

  const personaScores = parseJsonRecord<number>(session.tagScoresJson);

  const matched = matchPersona({
    tagScores: tagScores as Record<ScentTag, number>,
    personaScores: personaScores as Record<PersonaId, number>,
  });

  const recommended = recommendProducts({
    personaId: session.personaId as PersonaId,
    tagScores: tagScores as Record<ScentTag, number>,
  });

  const recommendations: ProductRecommendation[] = recommendedProductIds.length > 0
    ? recommendedProductIds.map((id, i) => {
        const rec = recommended.recommendations.find((r) => r.productId === id);
        const product = getProductById(id);
        return rec ?? {
          productId: id,
          score: 0,
          role: i === 0 ? "本命香候选" : i === 1 ? "安全款" : "惊喜尝试",
          reason: product?.plainDescription ?? "推荐尝试",
        };
      })
    : recommended.recommendations;

  return (
    <PageShell>
      <TrackEvent
        eventName="result_view"
        path={`/result/${session.id}`}
        sessionId={session.id}
        personaId={session.personaId}
      />
      <PersonaHero persona={p} confidence={matched.confidence} />

      <div className="card mt-4">
        <h3 className="font-serif text-lg text-stone-800">人格描述</h3>
        <p className="mt-2 text-sm text-stone-600 leading-relaxed">
          {p.reportSections.identity}
        </p>
      </div>

      <ScentProfileCard persona={p} />

      <div className="card mt-6">
        <h3 className="font-serif text-lg text-stone-800">适合场景</h3>
        <p className="mt-2 text-sm text-stone-600 leading-relaxed">
          {p.reportSections.scenes}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {p.idealScenes.map((scene) => (
            <span
              key={scene}
              className="text-xs bg-cream-100 text-stone-500 px-3 py-1 rounded-full"
            >
              {scene}
            </span>
          ))}
        </div>
      </div>

      <RecommendedSamples recommendations={recommendations} sessionId={session.id} />

      <ShareCard persona={p} />

      <div className="text-center py-8">
        <p className="text-sm text-stone-500 mb-4">
          {p.reportSections.closing}
        </p>
        <Link href="/quiz" className="btn-secondary">
          {SITE_COPY.result.retakeCta}
        </Link>
      </div>
    </PageShell>
  );
}
