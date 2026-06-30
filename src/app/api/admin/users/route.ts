import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/admin/password";
import { getAdminRole, getAdminOperator } from "@/lib/admin/auth";
import { auditAdminAction } from "@/lib/admin/audit";
import { sanitizeText } from "@/lib/api-guards";
import { ROLE_PERMISSIONS } from "@/lib/admin/permissions";

export const runtime = "nodejs";

export async function GET() {
  const admins = await db.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, status: true, lastLoginAt: true },
  });
  return NextResponse.json({ admins, roles: Object.keys(ROLE_PERMISSIONS) });
}

export async function POST(request: Request) {
  if (getAdminRole(request) !== "owner") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const email = sanitizeText(body.email, 120)?.toLowerCase();
  const role = sanitizeText(body.role, 20) ?? "operator";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password || !(role in ROLE_PERMISSIONS)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const admin = await db.adminUser.create({
      data: { email, name: sanitizeText(body.name, 60), role, status: "active", passwordHash: hashPassword(password) },
    });
    await auditAdminAction({ adminUserId: getAdminOperator(request), action: "admin_user_create", detail: `${email} (${role})` });
    return NextResponse.json({ ok: true, id: admin.id });
  } catch {
    return NextResponse.json({ error: "email_exists" }, { status: 409 });
  }
}
