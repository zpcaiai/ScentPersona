import PageShell from "@/components/layout/PageShell";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const locale = getLocale();
  const groups = await db.userProductEvent.groupBy({
    by: ["eventType"],
    _count: { _all: true },
  });
  const recent = await db.userProductEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <PageShell>
      <div className="py-8">
        <h1 className="text-2xl font-serif text-stone-800 text-center">{pick(locale, "商品行为数据", "Product event data")}</h1>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {groups.map((group) => (
          <div key={group.eventType} className="card text-center">
            <div className="text-2xl font-serif text-sage-600">{group._count._all}</div>
            <div className="mt-1 text-xs text-stone-500">{group.eventType}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-3">
        {recent.map((event) => (
          <div key={event.id} className="card text-sm text-stone-600">
            {event.eventType} · {event.productId || "-"} · {event.createdAt.toLocaleString("zh-CN")}
          </div>
        ))}
      </div>
    </PageShell>
  );
}
