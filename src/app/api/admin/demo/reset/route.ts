import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminOperator, adminCan } from "@/lib/admin/auth";
import { auditAdminAction } from "@/lib/admin/audit";
import { resetDemoData, seedDemoData } from "@/lib/dev/demoData";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const operator = getAdminOperator(request);
  if (!adminCan(request, "admin:manage")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (process.env.ENABLE_DEMO_TOOLS !== "1") return NextResponse.json({ error: "demo_tools_disabled" }, { status: 403 });

  const removed = await resetDemoData(db);
  const seeded = await seedDemoData(db);
  await auditAdminAction({ adminUserId: operator, action: "demo_reset", detail: JSON.stringify({ removed, seeded }) });
  return NextResponse.json({ ok: true, removed, seeded });
}
