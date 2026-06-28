import PageShell from "@/components/layout/PageShell";
import { db } from "@/lib/db";
import { PERSONAS, getPersonaById } from "@/data/personas";
import { PRODUCTS, getProductById } from "@/data/products";
import { SITE_COPY } from "@/data/copy";
import { parseJsonArray } from "@/lib/utils";
import AdminOrderActions from "@/components/admin/AdminOrderActions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [sessions, intents, feedbacks, orders, deletionRequests] = await Promise.all([
    db.quizSession.findMany({
      orderBy: { createdAt: "desc" },
      select: { personaId: true, recommendedProductIdsJson: true, createdAt: true },
    }),
    db.purchaseIntent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.feedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.dataDeletionRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const totalSessions = await db.quizSession.count();
  const totalIntents = await db.purchaseIntent.count();
  const totalFeedbacks = await db.feedback.count();
  const totalOrders = await db.order.count();
  const paidOrders = await db.order.count({ where: { status: { in: ["paid", "processing", "shipped", "completed"] } } });
  const paidRevenue = await db.order.aggregate({
    _sum: { amount: true },
    where: { status: { in: ["paid", "processing", "shipped", "completed"] } },
  });

  const personaCounts: Record<string, number> = {};
  for (const session of sessions) {
    if (session.personaId) {
      personaCounts[session.personaId] = (personaCounts[session.personaId] || 0) + 1;
    }
  }

  const productCounts: Record<string, number> = {};
  for (const order of orders) {
    const ids = parseJsonArray<string>(order.productIdsJson);
    for (const id of ids) {
      productCounts[id] = (productCounts[id] || 0) + 1;
    }
  }

  const orderRate = totalSessions > 0
    ? Math.round((totalOrders / totalSessions) * 100)
    : 0;
  const paidRate = totalOrders > 0
    ? Math.round((paidOrders / totalOrders) * 100)
    : 0;
  const statusCounts = orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <PageShell>
      <div className="py-8">
        <h1 className="text-2xl font-serif text-stone-800 text-center">
          {SITE_COPY.admin.title}
        </h1>
        <div className="mt-4 text-center">
          <a
            href="/api/admin/export/orders"
            className="inline-flex rounded-full border border-sage-400 px-4 py-2 text-sm text-sage-600 hover:bg-sage-400/10"
          >
            导出订单 CSV
          </a>
        </div>
      </div>

      {/* Overview metrics */}
      <div className="grid grid-cols-2 gap-4 mt-4 sm:grid-cols-4">
        <div className="card text-center">
          <div className="text-3xl font-serif text-sage-600">{totalSessions}</div>
          <div className="text-xs text-stone-500 mt-1">测试完成数</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-serif text-clay-500">{totalOrders}</div>
          <div className="text-xs text-stone-500 mt-1">订单数</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-serif text-stone-700">{paidRate}%</div>
          <div className="text-xs text-stone-500 mt-1">支付率</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-serif text-sage-600">
            ¥{((paidRevenue._sum.amount || 0) / 100).toFixed(0)}
          </div>
          <div className="text-xs text-stone-500 mt-1">已支付收入</div>
        </div>
      </div>

      <div className="card mt-6">
        <h3 className="font-serif text-stone-700 mb-4">交易漏斗</h3>
        <div className="grid gap-3 text-sm text-stone-600">
          <div className="flex items-center justify-between">
            <span>测试完成 → 下单</span>
            <span>{totalOrders} 单 / {orderRate}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span>下单 → 支付</span>
            <span>{paidOrders} 单 / {paidRate}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span>反馈提交</span>
            <span>{totalFeedbacks} 条</span>
          </div>
          {totalIntents > 0 && (
            <div className="flex items-center justify-between text-stone-400">
              <span>历史购买意向</span>
              <span>{totalIntents} 条</span>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-6">
        <h3 className="font-serif text-stone-700 mb-4">订单状态</h3>
        <div className="grid grid-cols-2 gap-3 text-sm text-stone-600">
          {["pending", "paid", "processing", "shipped", "completed", "cancelled", "refunded"].map((status) => (
            <div key={status} className="flex items-center justify-between rounded-xl border border-cream-200 px-3 py-2">
              <span>{status}</span>
              <span>{statusCounts[status] || 0}</span>
            </div>
          ))}
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

      {/* Recent orders */}
      <div className="card mt-6">
        <h3 className="font-serif text-stone-700 mb-4">最近订单</h3>
        {orders.length === 0 ? (
          <p className="text-sm text-stone-400">暂无订单</p>
        ) : (
          <div className="grid gap-3">
            {orders.slice(0, 15).map((order) => (
              <div key={order.id} className="border border-cream-200 rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-stone-700">{order.orderNo}</div>
                    <div className="mt-1 text-xs text-stone-400">
                      {order.customerName} · {order.customerPhone}
                    </div>
                    <div className="mt-1 text-xs text-stone-400">
                      {new Date(order.createdAt).toLocaleString("zh-CN")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-clay-500">¥{(order.amount / 100).toFixed(1)}</div>
                    <div className="text-xs text-stone-400">{order.status}</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-stone-500">
                  {parseJsonArray<string>(order.productIdsJson).join(", ")}
                </div>
                <AdminOrderActions
                  orderId={order.id}
                  initialStatus={order.status}
                  initialTrackingNumber={order.trackingNumber || ""}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card mt-6">
        <h3 className="font-serif text-stone-700 mb-4">数据删除请求</h3>
        {deletionRequests.length === 0 ? (
          <p className="text-sm text-stone-400">暂无请求</p>
        ) : (
          <div className="grid gap-3">
            {deletionRequests.map((request) => (
              <div key={request.id} className="rounded-xl border border-cream-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-stone-700">{request.identifier}</div>
                    <div className="mt-1 text-xs text-stone-400">{request.contact}</div>
                  </div>
                  <div className="text-xs text-stone-400">{request.status}</div>
                </div>
                {request.reason && (
                  <p className="mt-2 text-sm text-stone-600">{request.reason}</p>
                )}
                <div className="mt-2 text-xs text-stone-400">
                  {new Date(request.createdAt).toLocaleString("zh-CN")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
