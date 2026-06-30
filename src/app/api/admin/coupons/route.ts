import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminOperator } from "@/lib/admin/auth";
import { auditAdminAction } from "@/lib/admin/audit";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";
const TYPES = ["fixed_amount", "percentage", "free_shipping", "sample_credit"];

export async function GET() {
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ coupons });
}

export async function POST(request: Request) {
  const operator = getAdminOperator(request);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const code = sanitizeText(body.code, 40);
  const type = sanitizeText(body.type, 20);
  const value = Number.isFinite(body.value) ? Math.round(Number(body.value)) : 0;
  if (!code || !type || !TYPES.includes(type)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const coupon = await db.coupon.create({
      data: {
        code, type, value,
        scope: sanitizeText(body.scope, 20) ?? "all",
        minOrderAmountCents: Number.isFinite(body.minOrderAmountCents) ? Number(body.minOrderAmountCents) : null,
        maxDiscountCents: Number.isFinite(body.maxDiscountCents) ? Number(body.maxDiscountCents) : null,
        usageLimit: Number.isFinite(body.usageLimit) ? Number(body.usageLimit) : null,
        perUserLimit: Number.isFinite(body.perUserLimit) ? Number(body.perUserLimit) : null,
        expiresAt: body.expiresAt ? new Date(String(body.expiresAt)) : null,
      },
    });
    await auditAdminAction({ adminUserId: operator, action: "coupon_create", detail: code });
    return NextResponse.json({ ok: true, id: coupon.id });
  } catch {
    return NextResponse.json({ error: "code_exists" }, { status: 409 });
  }
}
