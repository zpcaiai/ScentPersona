import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth/session";
import { suggestNextScene, ROLE_LABELS, WARDROBE_ROLES } from "@/lib/wardrobe/suggestions";
import { sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

async function ensureWardrobe(userId: string) {
  let w = await db.scentWardrobe.findUnique({ where: { userId } });
  if (!w) w = await db.scentWardrobe.create({ data: { userId } });
  return w;
}

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const w = await ensureWardrobe(userId);
  const items = await db.scentWardrobeItem.findMany({ where: { wardrobeId: w.id }, orderBy: { createdAt: "desc" } });
  const roles = items.map((i: { role: string }) => i.role);
  return NextResponse.json({ items, roleLabels: ROLE_LABELS, allRoles: WARDROBE_ROLES, suggestions: suggestNextScene(roles) });
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const productId = sanitizeText(body.productId, 60);
  const role = sanitizeText(body.role, 20);
  if (!productId || !role) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const w = await ensureWardrobe(userId);
  const item = await db.scentWardrobeItem.create({
    data: { wardrobeId: w.id, productId, role, source: sanitizeText(body.source, 20) ?? "manual", note: sanitizeText(body.note, 200) },
  });
  return NextResponse.json({ ok: true, id: item.id });
}
