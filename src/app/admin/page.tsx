import PageShell from "@/components/layout/PageShell";
import { db } from "@/lib/db";
import { getPersonas, getPersonaById } from "@/data/personas";
import { getProducts, getProductById } from "@/data/products";
import { getSiteCopy } from "@/data/copy";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";
import { parseJsonArray } from "@/lib/utils";
import AdminOrderActions from "@/components/admin/AdminOrderActions";
import AdminNav from "@/components/admin/AdminNav";
import { createdAtWhere, parseAdminDateRange } from "@/lib/admin-date-range";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const locale = getLocale();
  const copy = getSiteCopy(locale);
  const personas = getPersonas(locale);
  const products = getProducts(locale);
  const dateRange = parseAdminDateRange(searchParams);
  const rangeWhere = createdAtWhere(dateRange);
  const paidStatusWhere = { status: { in: ["paid", "processing", "shipped", "completed"] } };

  const [
    sessions,
    intents,
    feedbacks,
    orders,
    deletionRequests,
    productOrders,
    analyticsGroups,
    totalSessions,
    totalIntents,
    totalFeedbacks,
    fullSizeConversions,
    totalOrders,
    paidOrders,
    paidRevenue,
  ] = await Promise.all([
    db.quizSession.findMany({
      where: rangeWhere,
      orderBy: { createdAt: "desc" },
      select: { personaId: true, recommendedProductIdsJson: true, createdAt: true },
    }),
    db.purchaseIntent.findMany({
      where: rangeWhere,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.feedback.findMany({
      where: rangeWhere,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.order.findMany({
      where: rangeWhere,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.dataDeletionRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.order.findMany({
      where: rangeWhere,
      select: { productIdsJson: true },
    }),
    db.analyticsEvent.groupBy({
      by: ["eventName"],
      where: rangeWhere,
      _count: { _all: true },
    }),
    db.quizSession.count({ where: rangeWhere }),
    db.purchaseIntent.count({ where: rangeWhere }),
    db.feedback.count({ where: rangeWhere }),
    db.feedback.count({ where: { ...rangeWhere, boughtFullSize: true } }),
    db.order.count({ where: rangeWhere }),
    db.order.count({ where: { ...rangeWhere, ...paidStatusWhere } }),
    db.order.aggregate({
      _sum: { amount: true },
      where: { ...rangeWhere, ...paidStatusWhere },
    }),
  ]);

  const personaCounts: Record<string, number> = {};
  for (const session of sessions) {
    if (session.personaId) {
      personaCounts[session.personaId] = (personaCounts[session.personaId] || 0) + 1;
    }
  }

  const productCounts: Record<string, number> = {};
  for (const order of productOrders) {
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
  const eventCounts = analyticsGroups.reduce<Record<string, number>>((acc, group) => {
    acc[group.eventName] = group._count._all;
    return acc;
  }, {});
  const pageViews = eventCounts.page_view || 0;
  const quizStarts = eventCounts.quiz_start || 0;
  const resultViews = eventCounts.result_view || 0;
  const checkoutViews = eventCounts.checkout_view || 0;
  const checkoutSubmits = eventCounts.checkout_submit || totalOrders;
  const statusCounts = orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});
  const exportHref = dateRange.queryString
    ? `/api/admin/export/orders?${dateRange.queryString}`
    : "/api/admin/export/orders";

  return (
    <PageShell>
      <div className="py-8">
        <AdminNav />
        <h1 className="text-2xl font-serif text-stone-800 text-center">
          {copy.admin.title}
        </h1>
        <p className="mt-2 text-center text-sm text-stone-500">
          {pick(locale, "当前范围", "Current range")}：{dateRange.label}
        </p>
        <div className="mt-5 grid gap-3 rounded-2xl border border-cream-200 bg-white/80 p-4">
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <a href="/admin?range=7d" className="rounded-full border border-cream-200 px-3 py-1 text-stone-600 hover:border-sage-400">
              {pick(locale, "最近 7 天", "Last 7 days")}
            </a>
            <a href="/admin" className="rounded-full border border-cream-200 px-3 py-1 text-stone-600 hover:border-sage-400">
              {pick(locale, "最近 30 天", "Last 30 days")}
            </a>
            <a href="/admin?range=all" className="rounded-full border border-cream-200 px-3 py-1 text-stone-600 hover:border-sage-400">
              {pick(locale, "全部", "All")}
            </a>
          </div>
          <form action="/admin" className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <label className="grid gap-1 text-xs text-stone-500">
              {pick(locale, "开始日期", "Start date")}
              <input
                type="date"
                name="from"
                defaultValue={dateRange.fromInput}
                className="rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-stone-700"
              />
            </label>
            <label className="grid gap-1 text-xs text-stone-500">
              {pick(locale, "结束日期", "End date")}
              <input
                type="date"
                name="to"
                defaultValue={dateRange.toInput}
                className="rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm text-stone-700"
              />
            </label>
            <button type="submit" className="rounded-lg bg-sage-600 px-4 py-2 text-sm font-medium text-cream-50 sm:self-end">
              {pick(locale, "筛选", "Filter")}
            </button>
          </form>
        </div>
        <div className="mt-4 text-center">
          <a
            href={exportHref}
            className="inline-flex rounded-full border border-sage-400 px-4 py-2 text-sm text-sage-600 hover:bg-sage-400/10"
          >
            {pick(locale, "导出订单 CSV", "Export orders CSV")}
          </a>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm">
          <a href="/admin/import" className="rounded-full border border-cream-200 px-3 py-1 text-stone-600 hover:border-sage-400">{pick(locale, "商品导入", "Import products")}</a>
          <a href="/admin/products" className="rounded-full border border-cream-200 px-3 py-1 text-stone-600 hover:border-sage-400">{pick(locale, "商品管理", "Products")}</a>
          <a href="/admin/offers" className="rounded-full border border-cream-200 px-3 py-1 text-stone-600 hover:border-sage-400">{pick(locale, "Offer 审核", "Offer review")}</a>
          <a href="/admin/data-sources" className="rounded-full border border-cream-200 px-3 py-1 text-stone-600 hover:border-sage-400">{pick(locale, "数据源", "Data sources")}</a>
          <a href="/admin/jobs" className="rounded-full border border-cream-200 px-3 py-1 text-stone-600 hover:border-sage-400">{pick(locale, "同步任务", "Sync jobs")}</a>
          <a href="/admin/events" className="rounded-full border border-cream-200 px-3 py-1 text-stone-600 hover:border-sage-400">{pick(locale, "商品事件", "Product events")}</a>
        </div>
      </div>

      {/* Overview metrics */}
      <div className="grid grid-cols-2 gap-4 mt-4 sm:grid-cols-5">
        <div className="card text-center">
          <div className="text-3xl font-serif text-sage-600">{totalSessions}</div>
          <div className="text-xs text-stone-500 mt-1">{pick(locale, "测试完成数", "Quizzes completed")}</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-serif text-clay-500">{totalOrders}</div>
          <div className="text-xs text-stone-500 mt-1">{pick(locale, "订单数", "Orders")}</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-serif text-stone-700">{paidRate}%</div>
          <div className="text-xs text-stone-500 mt-1">{pick(locale, "支付率", "Paid rate")}</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-serif text-sage-600">
            ¥{((paidRevenue._sum.amount || 0) / 100).toFixed(0)}
          </div>
          <div className="text-xs text-stone-500 mt-1">{pick(locale, "已支付收入", "Paid revenue")}</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-serif text-clay-500">{fullSizeConversions}</div>
          <div className="text-xs text-stone-500 mt-1">{pick(locale, "正装意向", "Full-size intent")}</div>
        </div>
      </div>

      <div className="card mt-6">
        <h3 className="font-serif text-stone-700 mb-4">{pick(locale, "交易漏斗", "Conversion funnel")}</h3>
        <div className="grid gap-3 text-sm text-stone-600">
          <div className="flex items-center justify-between">
            <span>{pick(locale, "访问", "Visits")}</span>
            <span>{pageViews}{pick(locale, " 次", "")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{pick(locale, "开始测试", "Quiz started")}</span>
            <span>{quizStarts}{pick(locale, " 次", "")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{pick(locale, "完成测试", "Quiz completed")}</span>
            <span>{totalSessions}{pick(locale, " 次", "")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{pick(locale, "查看结果", "Result viewed")}</span>
            <span>{resultViews}{pick(locale, " 次", "")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{pick(locale, "进入结账", "Checkout entered")}</span>
            <span>{checkoutViews}{pick(locale, " 次", "")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{pick(locale, "提交订单", "Order submitted")}</span>
            <span>{checkoutSubmits}{pick(locale, ` 次 / 测试后下单率 ${orderRate}%`, ` / post-quiz order rate ${orderRate}%`)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{pick(locale, "下单 → 支付", "Order → paid")}</span>
            <span>{paidOrders}{pick(locale, ` 单 / ${paidRate}%`, ` / ${paidRate}%`)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{pick(locale, "反馈提交", "Feedback submitted")}</span>
            <span>{totalFeedbacks}{pick(locale, " 条", "")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{pick(locale, "正装意向", "Full-size intent")}</span>
            <span>{fullSizeConversions}{pick(locale, " 条", "")}</span>
          </div>
          {totalIntents > 0 && (
            <div className="flex items-center justify-between text-stone-400">
              <span>{pick(locale, "历史购买意向", "Historical purchase intent")}</span>
              <span>{totalIntents}{pick(locale, " 条", "")}</span>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-6">
        <h3 className="font-serif text-stone-700 mb-4">{pick(locale, "订单状态", "Order status")}</h3>
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
        <h3 className="font-serif text-stone-700 mb-4">{pick(locale, "人格分布", "Persona distribution")}</h3>
        <div className="grid gap-2">
          {personas.map((persona) => {
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
        <h3 className="font-serif text-stone-700 mb-4">{pick(locale, "产品热度", "Product popularity")}</h3>
        <div className="grid gap-2">
          {products.map((product) => {
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
        <h3 className="font-serif text-stone-700 mb-4">{pick(locale, "最近反馈", "Recent feedback")}</h3>
        {feedbacks.length === 0 ? (
          <p className="text-sm text-stone-400">{pick(locale, "暂无反馈", "No feedback yet")}</p>
        ) : (
          <div className="grid gap-3">
            {feedbacks.slice(0, 10).map((fb) => {
              const persona = fb.personaId ? getPersonaById(fb.personaId, locale) : null;
              const favorite = fb.favoriteProductId ? getProductById(fb.favoriteProductId, locale) : null;
              return (
                <div key={fb.id} className="border border-cream-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs text-stone-400">
                    <span>{new Date(fb.createdAt).toLocaleDateString("zh-CN")}</span>
                    {persona && <span>· {persona.name}</span>}
                    {favorite && <span>· {pick(locale, "最喜欢", "Favorite")}: {favorite.name}</span>}
                    {fb.boughtFullSize && <span className="text-sage-500">· {pick(locale, "已购正装", "Bought full size")}</span>}
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
        <h3 className="font-serif text-stone-700 mb-4">{pick(locale, "最近订单", "Recent orders")}</h3>
        {orders.length === 0 ? (
          <p className="text-sm text-stone-400">{pick(locale, "暂无订单", "No orders yet")}</p>
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
        <h3 className="font-serif text-stone-700 mb-4">{pick(locale, "数据删除请求", "Data deletion requests")}</h3>
        {deletionRequests.length === 0 ? (
          <p className="text-sm text-stone-400">{pick(locale, "暂无请求", "No requests")}</p>
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
