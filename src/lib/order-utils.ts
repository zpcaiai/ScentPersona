import crypto from "crypto";

export function generateOrderNo(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `SP${y}${m}${d}${rand}`;
}

export function generateOrderAccessToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

export function isOrderAccessAuthorized(
  orderToken: string,
  providedToken: unknown
): boolean {
  if (typeof providedToken !== "string" || providedToken.length === 0) return false;

  const expected = Buffer.from(orderToken);
  const provided = Buffer.from(providedToken);
  if (expected.length !== provided.length) return false;

  return crypto.timingSafeEqual(expected, provided);
}
