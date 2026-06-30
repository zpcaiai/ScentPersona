import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth/session";
import { normalizePhone, sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const addresses = await db.userAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ addresses });
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const recipientName = sanitizeText(body.recipientName, 40);
  const phone = normalizePhone(body.phone);
  const province = sanitizeText(body.province, 40);
  const city = sanitizeText(body.city, 40);
  const district = sanitizeText(body.district, 40);
  const addressLine1 = sanitizeText(body.addressLine1, 160);
  if (!recipientName || !phone || !province || !city || !district || !addressLine1) {
    return NextResponse.json({ error: "address_incomplete" }, { status: 400 });
  }
  const existing = await db.userAddress.count({ where: { userId } });
  const isDefault = existing === 0 || body.isDefault === true;
  if (isDefault) await db.userAddress.updateMany({ where: { userId }, data: { isDefault: false } });
  const address = await db.userAddress.create({
    data: {
      userId,
      recipientName,
      phone,
      province,
      city,
      district,
      addressLine1,
      addressLine2: sanitizeText(body.addressLine2, 160),
      postalCode: sanitizeText(body.postalCode, 12),
      isDefault,
    },
  });
  return NextResponse.json({ ok: true, address });
}
