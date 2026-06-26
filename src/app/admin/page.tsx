import PageShell from "@/components/layout/PageShell";
import { db } from "@/lib/db";
import { PERSONAS, getPersonaById } from "@/data/personas";
import { PRODUCTS, getProductById } from "@/data/products";
import { SITE_COPY } from "@/data/copy";
import { parseJsonArray } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [sessions, intents, feedbacks] = await Promise.all([
    db.quizSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.purchaseIntent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.feedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const totalSessions = await db.quizSession.count();
  const totalIntents = await db.purchaseIntent.count();
  const totalFeedbacks = await db.feedback.count();

  const personaCounts: Record<string, number> = {};
  for (const session of sessions) {
    if (session.personaId) {
      personaCounts[session.personaId] = (personaCounts[session.personaId] || 0) + 1;
    }
  }

  const productCounts: Record<string, number> = {};
  for (const intent of intents) {
    const ids = parseJsonArray<string>(intent.productIdsJson);
    for (const id of ids) {
      productCounts[id] = (productCounts[id] || 0) + 1;
    }
  }

  const conversionRate = totalSessions > 0
    ? Math.round((totalIntents / totalSessions) * 100)
    : 0;

  return (
    <PageShell>
      <div className="py-8">
        <h1 className="text-2xl font-serif text-stone-800 text-center">
          {SITE_COPY.admin.title}
        </h1>
      </div>

      {/* Overview metrics */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="card text-center">
          <div className="text-3xl font-serif text-sage-600">{totalSessions}</div>
          <div className="text-xs text-stone-500 mt-1">测试完成数</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-serif text-clay-500">{totalIntents}</div>
          <div className="text-xs text-stone-500 mt-1">购买意向数</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-serif text-stone-700">{conversionRate}%</div>
          <div className="text-xs text-stone-500 mt-1">转化率</div>
        </div>
      </div>

      {/* Persona distribution */}
      <div className="card mt-6">
        <h3 className="font-serif text-stone-700 mb-4">人格分布</h3>
        <div className="grid gap-2">
          {PERSONAS.map((persona) => {
            const count = personaCounts[persona.id] || 0;
            const maxCount = Math.max(1, ...Object.values(personaCounts));
            const percent = Math.round((count / maxCount) * 100);
            return (
              <div key={persona.id} className="flex items-center gap-3">
                <span className="text-sm text-stone-600 w-32 truncate">
                  {persona.name}
                </span>
                <div className="flex-1 h-6 bg-cream-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sage-400 rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-sm text-stone-500 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Product popularity */}
      <div className="card mt-6">
        <h3 className="font-serif text-stone-700 mb-4">产品热度</h3>
        <div className="grid gap-2">
          {PRODUCTS.map((product) => {
            const count = productCounts[product.id] || 0;
            const maxCount = Math.max(1, ...Object.values(productCounts));
            const percent = Math.round((count / maxCount) * 100);
            return (
              <div key={product.id} className="flex items-center gap-3">
                <span className="text-sm text-stone-600 w-32 truncate">
                  {product.name}
                </span>
                <div className="flex-1 h-6 bg-cream-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-clay-400 rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-sm text-stone-500 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent feedback */}
      <div className="card mt-6">
        <h3 className="font-serif text-stone-700 mb-4">最近反馈</h3>
        {feedbacks.length === 0 ? (
          <p className="text-sm text-stone-400">暂无反馈</p>
        ) : (
          <div className="grid gap-3">
            {feedbacks.slice(0, 10).map((fb) => {
              const persona = fb.personaId ? getPersonaById(fb.personaId) : null;
              const favorite = fb.favoriteProductId ? getProductById(fb.favoriteProductId) : null;
              return (
                <div key={fb.id} className="border border-cream-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs text-stone-400">
                    <span>{new Date(fb.createdAt).toLocaleDateString("zh-CN")}</span>
                    {persona && <span>· {persona.name}</span>}
                    {favorite && <span>· 最喜欢: {favorite.name}</span>}
                    {fb.boughtFullSize && <span className="text-sage-500">· 已购正装</span>}
                  </div>
                  {fb.comment && (
                    <p className="mt-2 text-sm text-stone-600">{fb.comment}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent purchase intents */}
      <div className="card mt-6">
        <h3 className="font-serif text-stone-700 mb-4">最近购买意向</h3>
        {intents.length === 0 ? (
          <p className="text-sm text-stone-400">暂无购买意向</p>
        ) : (
          <div className="grid gap-2">
            {intents.slice(0, 10).map((intent) => (
              <div key={intent.id} className="flex items-center justify-between border border-cream-200 rounded-xl p-3">
                <div>
                  <div className="text-sm text-stone-700">{intent.customerName}</div>
                  <div className="text-xs text-stone-400">{intent.customerPhone}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-clay-500">¥{(intent.price / 100).toFixed(1)}</div>
                  <div className="text-xs text-stone-400">{intent.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
