import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminCan } from "@/lib/admin/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!adminCan(request, "product:edit")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const rows = await db.product.findMany({
    where: { reviewStatus: "approved" },
    select: { normalizedName: true, scentFamily: true },
    orderBy: { normalizedName: "asc" },
    take: 300,
  });
  const families = Array.from(new Set(rows.map((r) => r.scentFamily).filter(Boolean))) as string[];
  return NextResponse.json({ families, products: rows.map((r) => ({ name: r.normalizedName, family: r.scentFamily })) });
}
