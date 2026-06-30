/**
 * Proxy-order service fee (Skill 25).
 * Tiers are based on the TOTAL product price (unit price × quantity), in cents.
 *   < ¥200      → ¥9.9
 *   ¥200–¥499   → ¥19.9
 *   ≥ ¥500      → 5% of product price, min ¥29.9
 * "priority" service applies a 1.5× multiplier (TODO: make configurable via CostRule).
 */
export type ServiceLevel = "standard" | "priority";

export function computeServiceFeeCents(
  productTotalCents: number,
  level: ServiceLevel = "standard"
): number {
  if (!Number.isFinite(productTotalCents) || productTotalCents <= 0) return 0;
  let base: number;
  if (productTotalCents < 19900) base = 990;
  else if (productTotalCents < 49900) base = 1990;
  else base = Math.max(Math.round(productTotalCents * 0.05), 2990);
  if (level === "priority") base = Math.round(base * 1.5);
  return base;
}
