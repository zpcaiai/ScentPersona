import { db } from "@/lib/db";
import { adapters } from "@/lib/platforms";
import { importPlatformProducts } from "@/lib/products/importCatalog";
import type { Platform } from "@/lib/platforms/types";

export async function runProductSearchJob(input: {
  platform?: Platform;
  query: string;
}) {
  const job = await db.productSyncJob.create({
    data: {
      type: "search_products",
      platform: input.platform || "mock",
      query: input.query,
      status: "running",
      startedAt: new Date(),
    },
  });

  try {
    const selected = adapters.filter((adapter) =>
      input.platform ? adapter.platform === input.platform : adapter.platform === "mock"
    );
    const raw = [];
    for (const adapter of selected) {
      if (!adapter.isConfigured()) continue;
      const rows = await adapter.searchProducts({ keyword: input.query });
      raw.push(...rows);
    }
    const result = await importPlatformProducts(raw);
    await db.productSyncJob.update({
      where: { id: job.id },
      data: {
        status: "succeeded",
        finishedAt: new Date(),
        resultJson: JSON.stringify(result),
      },
    });
    return result;
  } catch (err) {
    await db.productSyncJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        errorMessage: err instanceof Error ? err.message : "Job failed",
      },
    });
    throw err;
  }
}
