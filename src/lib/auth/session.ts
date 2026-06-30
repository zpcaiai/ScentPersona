import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

/**
 * Lightweight signed-cookie session (Skill 38, MVP).
 * TODO(production): replace with a real auth provider (OTP / OAuth / WeChat
 * login) — this only proves possession of a userId via HMAC, no password.
 */
const COOKIE = "sp_user";
const SECRET = process.env.SESSION_SECRET || "dev_session_secret_change_me";
const MAX_AGE = 60 * 60 * 24 * 30;

export function signSession(userId: string): string {
  const payload = Buffer.from(userId).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token: string): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

/** For route handlers (reads the raw Cookie header). */
export function getUserIdFromRequest(request: Request): string | null {
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)sp_user=([^;]+)/);
  if (!m) return null;
  return verifySession(decodeURIComponent(m[1]));
}

/** For server components / pages. */
export function getCurrentUserId(): string | null {
  const token = cookies().get(COOKIE)?.value;
  return token ? verifySession(token) : null;
}

export async function getCurrentUser() {
  const id = getCurrentUserId();
  if (!id) return null;
  return db.user.findUnique({ where: { id } });
}

export function buildSessionCookie(userId: string): string {
  return `${COOKIE}=${encodeURIComponent(signSession(userId))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
