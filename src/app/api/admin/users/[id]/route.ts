import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminRole, getAdminOperator } from "@/lib/admin/auth";
import { auditAdminAction } from "@/lib/admin/audit";
import { sanitizeText } from "@/lib/api-guards";
import { ROLE_PERMISSIONS } from "@/lib/admin/permissions";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (getAdminRole(request) !== "owner") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  const role = sanitizeText(body.role, 20);
  if (role && role in ROLE_PERMISSIONS) data.role = role;
  if (body.status === "active" || body.status === "disabled") data.status = body.status;
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  await db.adminUser.update({ where: { id: params.id }, data });
  await auditAdminAction({ adminUserId: getAdminOperator(request), action: "admin_user_update", detail: `${params.id} ${JSON.stringify(data)}` });
  return NextResponse.json({ ok: true });
}
