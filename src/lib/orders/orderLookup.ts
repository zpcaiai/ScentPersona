import crypto from "crypto";
import { phoneLast4 } from "@/lib/privacy/masking";

/**
 * Order lookup protection (Skill 36).
 * A bare orderNo must NOT reveal sensitive data. Access requires either the
 * order's access token (deep link) or the last 4 digits of the bound phone.
 */

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function verifyOrderLookup(
  order: { accessToken: string; customerPhone: string | null },
  provided: { token?: unknown; phoneLast4?: unknown }
): boolean {
  if (typeof provided.token === "string" && provided.token.length > 0) {
    if (safeEqual(order.accessToken, provided.token)) return true;
  }
  if (typeof provided.phoneLast4 === "string" && provided.phoneLast4.length === 4) {
    const expected = phoneLast4(order.customerPhone);
    if (expected.length === 4 && safeEqual(expected, provided.phoneLast4)) return true;
  }
  return false;
}
