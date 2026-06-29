import { PERSONAS } from "@/data/personas";
import { PRODUCTS } from "@/data/products";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count += 1;
  return true;
}

export function getClientKey(request: Request, scope: string): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip");
  return `${scope}:${forwardedFor || realIp || "unknown"}`;
}

export function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const phone = value.trim();
  return /^1\d{10}$/.test(phone) ? phone : null;
}

export function isKnownProductId(value: unknown): value is string {
  return typeof value === "string" && PRODUCTS.some((product) => product.id === value);
}

export function isKnownPersonaId(value: unknown): value is string {
  return typeof value === "string" && PERSONAS.some((persona) => persona.id === value);
}

export function sanitizeText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim().slice(0, maxLength);
  return text.length > 0 ? text : null;
}
