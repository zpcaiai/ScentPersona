import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth/session";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";
const gen = () => `R${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let code = await db.referralCode.findUnique({ where: { userId } });
  if (!code) code = await db.referralCode.create({ data: { userId, code: gen() } });
  const rewards = await db.referralReward.findMany({ where: { referrerUserId: userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ code: code.code, rewards });
}

// Redeem someone else's referral code (anti-abuse: no self, once per user).
export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const code = sanitizeText(body.code, 40);
  if (!code) return NextResponse.json({ error: "code_required" }, { status: 400 });

  const ref = await db.referralCode.findUnique({ where: { code } });
  if (!ref) return NextResponse.json({ error: "code_not_found" }, { status: 404 });
  if (ref.userId === userId) return NextResponse.json({ error: "cannot_self_refer" }, { status: 400 });

  const already = await db.referralReward.findFirst({ where: { referredUserId: userId } });
  if (already) return NextResponse.json({ error: "already_referred" }, { status: 409 });

  // Reward is issued after the referred user's first completed order (kept pending here).
  await db.referralReward.create({
    data: { referrerUserId: ref.userId, referredUserId: userId, referralCode: code, rewardType: "coupon", rewardValue: 1000, status: "pending" },
  });
  return NextResponse.json({ ok: true });
}
