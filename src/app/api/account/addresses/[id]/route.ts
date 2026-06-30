import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth/session";
import { normalizePhone, sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

async function owned(userId: string, id: string) {
  const a = await db.userAddress.findUnique({ where: { id } });
  return a && a.userId === userId ? a : null;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await owned(userId, params.id))) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  if (body.isDefault === true) {
    await db.userAddress.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  const data: Record<string, unknown> = {};
  const name = sanitizeText(body.recipientName, 40); if (name) data.recipientName = name;
  const phone = normalizePhone(body.phone); if (phone) data.phone = phone;
  const province = sanitizeText(body.province, 40); if (province) data.province = province;
  const city = sanitizeText(body.city, 40); if (city) data.city = city;
  const district = sanitizeText(body.district, 40); if (district) data.district = district;
  const line1 = sanitizeText(body.addressLine1, 160); if (line1) data.addressLine1 = line1;
  if ("addressLine2" in body) data.addressLine2 = sanitizeText(body.addressLine2, 160);
  if ("postalCode" in body) data.postalCode = sanitizeText(body.postalCode, 12);
  if (typeof body.isDefault === "boolean") data.isDefault = body.isDefault;

  const address = await db.userAddress.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true, address });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await owned(userId, params.id))) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await db.userAddress.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

// wx.request has no PATCH — accept POST as an alias.
export async function POST(request: Request, ctx: { params: { id: string } }) {
  return PATCH(request, ctx);
}
