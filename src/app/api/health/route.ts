import { NextResponse } from "next/server";
import { runHealthChecks } from "@/lib/health/checks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public deployment health. Returns per-check status only (no config detail).
export async function GET() {
  const { status, checks } = await runHealthChecks();
  return NextResponse.json(
    { status, checks: checks.map((c) => ({ key: c.key, status: c.status })) },
    { status: status === "critical" ? 503 : 200 }
  );
}
