import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminOperator, adminCan } from "@/lib/admin/auth";
import { auditAdminAction } from "@/lib/admin/audit";
import { isStorageConfigured, presignPost } from "@/lib/storage/s3";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = Number(process.env.MAX_UPLOAD_BYTES) || 5 * 1024 * 1024; // 5MB default
const THUMB_MAX_BYTES = 512 * 1024;

export async function POST(request: Request) {
  const operator = getAdminOperator(request);
  if (!adminCan(request, "product:edit")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const rl = await rateLimit(`presign:${operator}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited", retryAfterMs: rl.retryAfterMs }, { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } });

  if (!isStorageConfigured()) return NextResponse.json({ error: "storage_not_configured" }, { status: 501 });

  const body = (await request.json().catch(() => ({}))) as { contentType?: string; size?: number; withThumb?: boolean };
  const ct = String(body.contentType || "");
  const ext = EXT[ct];
  if (!ext) return NextResponse.json({ error: "unsupported_content_type", allowed: Object.keys(EXT) }, { status: 400 });
  if (typeof body.size === "number" && body.size > MAX_BYTES) {
    return NextResponse.json({ error: "file_too_large", maxBytes: MAX_BYTES }, { status: 413 });
  }

  const base = `content/hero/${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const full = presignPost(`${base}.${ext}`, { maxBytes: MAX_BYTES, contentType: ct });
  const thumb = body.withThumb === false ? null : presignPost(`${base}.thumb.${ext}`, { maxBytes: THUMB_MAX_BYTES, contentType: ct });
  if (!full) return NextResponse.json({ error: "storage_not_configured" }, { status: 501 });

  await auditAdminAction({ adminUserId: operator, action: "upload_presign", detail: `${base}.${ext}` });
  return NextResponse.json({ ok: true, full, thumb, maxBytes: MAX_BYTES });
}
