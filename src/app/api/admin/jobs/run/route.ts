import { NextRequest, NextResponse } from "next/server";
import { runProductSearchJob } from "@/lib/jobs/productSyncJob";
import type { Platform } from "@/lib/platforms/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === "string" && body.query.trim() ? body.query.trim() : "白茶";
    const platform = typeof body.platform === "string" ? body.platform as Platform : "mock";
    const result = await runProductSearchJob({ platform, query });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Job failed" },
      { status: 500 }
    );
  }
}
