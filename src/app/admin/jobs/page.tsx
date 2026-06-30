import PageShell from "@/components/layout/PageShell";
import { db } from "@/lib/db";
import RunJobForm from "./RunJobForm";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  const locale = getLocale();
  const jobs = await db.productSyncJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <PageShell>
      <div className="py-8">
        <h1 className="text-2xl font-serif text-stone-800 text-center">{pick(locale, "商品同步任务", "Product sync jobs")}</h1>
      </div>
      <RunJobForm />
      <div className="mt-6 grid gap-3">
        {jobs.map((job) => (
          <div key={job.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-stone-700">{job.type} · {job.platform || "all"}</div>
                <div className="mt-1 text-xs text-stone-400">{job.query || "-"} · {job.createdAt.toLocaleString("zh-CN")}</div>
                {job.errorMessage && <div className="mt-2 text-xs text-red-600">{job.errorMessage}</div>}
              </div>
              <div className="text-xs text-stone-500">{job.status}</div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
