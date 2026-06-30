import crypto from "crypto";
import { cookies } from "next/headers";

/**
 * Signed admin-session cookie (HMAC-SHA256). Verified in middleware (Web Crypto)
 * and in route handlers / RSC (node:crypto here). No DB lookup needed to auth.
 */
export const ADMIN_COOKIE = "sp_admin";
const SECRET = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || "dev_admin_secret_change_me";
const TTL = 7 * 24 * 60 * 60;

export interface AdminSession {
  id: string;
  role: string;
  exp: number;
}

export function signAdminSession(input: { id: string; role: string }, ttlSec = TTL): string {
  const obj = { id: input.id, role: input.role, exp: Math.floor(Date.now() / 1000) + ttlSec };
  const payload = Buffer.from(JSON.stringify(obj)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyAdminSession(token: string): AdminSession | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const obj = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
    if (obj.exp && obj.exp * 1000 < Date.now()) return null;
    return obj;
  } catch {
    return null;
  }
}

export function getAdminSessionFromRequest(request: Request): AdminSession | null {
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)sp_admin=([^;]+)/);
  return m ? verifyAdminSession(decodeURIComponent(m[1])) : null;
}

export function getAdminSession(): AdminSession | null {
  const t = cookies().get(ADMIN_COOKIE)?.value;
  return t ? verifyAdminSession(t) : null;
}

export function buildAdminCookie(token: string): string {
  return `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TTL}`;
}

export function clearAdminCookie(): string {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
