/**
 * Sensitive-data masking helpers (Skill 36 / 41).
 * Used everywhere user PII is shown in lists, admin views, packing slips, etc.
 * Full values are only revealed on dedicated detail surfaces that log access.
 */

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\s+/g, "");
  if (digits.length < 7) return "***";
  return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
}

export function phoneLast4(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D+/g, "");
  return digits.slice(-4);
}

export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return email ? "***" : "";
  const [name, domain] = email.split("@");
  const head = name.length <= 1 ? name : name[0];
  return `${head}${"*".repeat(Math.max(1, Math.min(name.length - 1, 3)))}@${domain}`;
}

export function maskName(name: string | null | undefined): string {
  if (!name) return "";
  const chars = Array.from(name.trim());
  if (chars.length <= 1) return chars[0] ?? "";
  if (chars.length === 2) return `${chars[0]}*`;
  return `${chars[0]}${"*".repeat(chars.length - 2)}${chars[chars.length - 1]}`;
}

/** Mask a free-text address line, keeping a short readable prefix. */
export function maskAddressLine(line: string | null | undefined, keep = 4): string {
  if (!line) return "";
  const chars = Array.from(line.trim());
  if (chars.length <= keep) return `${chars[0] ?? ""}***`;
  return `${chars.slice(0, keep).join("")}****`;
}

/** Structured address → list-safe summary that keeps region but hides the door. */
export function maskAddress(addr: {
  province?: string | null;
  city?: string | null;
  district?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
} | null | undefined): string {
  if (!addr) return "";
  const region = [addr.province, addr.city, addr.district].filter(Boolean).join("");
  const detail = [addr.addressLine1, addr.addressLine2].filter(Boolean).join(" ");
  return `${region} ${maskAddressLine(detail)}`.trim();
}

export function maskOrderNo(orderNo: string | null | undefined): string {
  if (!orderNo) return "";
  if (orderNo.length <= 8) return orderNo;
  return `${orderNo.slice(0, 4)}****${orderNo.slice(-4)}`;
}
