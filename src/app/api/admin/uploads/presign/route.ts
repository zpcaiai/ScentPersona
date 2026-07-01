import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminOperator, adminCan } from "@/lib/admin/auth";
import { auditAdminAction } from "@/lib/admin/audit";
import { isStorageConfigured, presignPutUrl } from "@/lib/storage/s3";

export const runtime = "nodejs";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif",
};

export async function POST(request: Request) {
  const operator = getAdminOperator(request);
  if (!adminCan(request, "product:edit")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!isStorageConfigured()) return NextResponse.json({ error: "storage_not_configured" }, { status: 501 });

  const body = (await request.json().catch(() => ({}))) as { contentType?: string; prefix?: string };
  const ext = EXT[String(body.contentType || "")];
  if (!ext) return NextResponse.json({ error: "unsupported_content_type" }, { status: 400 });

  const prefix = body.prefix === "hero" ? "content/hero" : "content/upload";
  const key = `${prefix}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const signed = presignPutUrl(key);
  if (!signed) return NextResponse.json({ error: "storage_not_configured" }, { status: 501 });

  await auditAdminAction({ adminUserId: operator, action: "upload_presign", detail: key });
  return NextResponse.json({ ok: true, key, ...signed });
}
