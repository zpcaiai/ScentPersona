import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/admin/password";
import { signAdminSession, buildAdminCookie } from "@/lib/admin/session";
import { rateLimit, getClientKey, sanitizeText } from "@/lib/api-guards";

export const runtime = "nodejs";

// First-ever login bootstraps the owner from env (reusing ADMIN_PASSWORD).
export async function POST(request: Request) {
  if (!rateLimit(getClientKey(request, "admin-login"), 10, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const email = sanitizeText(body.email, 120)?.toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) return NextResponse.json({ error: "missing_credentials" }, { status: 400 });

  let admin = await db.adminUser.findUnique({ where: { email } });

  if (!admin) {
    const count = await db.adminUser.count();
    const bootstrapEmail = (process.env.ADMIN_BOOTSTRAP_EMAIL || process.env.ADMIN_USERNAME || "admin@scentpersona.local").toLowerCase();
    const bootstrapPassword = process.env.ADMIN_PASSWORD || "";
    if (count === 0 && email === bootstrapEmail && bootstrapPassword && password === bootstrapPassword) {
      admin = await db.adminUser.create({
        data: { email, name: "Owner", role: "owner", status: "active", passwordHash: hashPassword(password) },
      });
    } else {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }
  }

  if (admin.status !== "active" || !verifyPassword(password, admin.passwordHash)) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  await db.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  const res = NextResponse.json({ ok: true, role: admin.role, name: admin.name });
  res.headers.set("Set-Cookie", buildAdminCookie(signAdminSession({ id: admin.id, role: admin.role })));
  return res;
}
