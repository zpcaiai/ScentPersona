import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let membership = await db.userMembership.findUnique({ where: { userId } });
  if (!membership) membership = await db.userMembership.create({ data: { userId } });

  const tiers = await db.membershipTier.findMany({ orderBy: { level: "asc" } });
  const current = [...tiers].reverse().find((t: { minSpendCents: number }) => membership!.totalSpendCents >= t.minSpendCents) ?? null;
  const next = tiers.find((t: { minSpendCents: number }) => t.minSpendCents > membership!.totalSpendCents) ?? null;

  return NextResponse.json({
    points: membership.points,
    totalSpendCents: membership.totalSpendCents,
    currentTier: current ? { name: current.name, level: current.level } : null,
    nextTier: next ? { name: next.name, level: next.level, minSpendCents: next.minSpendCents } : null,
  });
}
