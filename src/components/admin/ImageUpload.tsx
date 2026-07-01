"use client";
import { useState } from "react";

/** Presign → PUT-to-storage uploader. Calls onUploaded(publicUrl) on success. */
export default function ImageUpload({ prefix = "hero", onUploaded }: { prefix?: string; onUploaded: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr(null);
    try {
      const pres = await fetch("/api/admin/uploads/presign", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, prefix }),
      });
      const j = await pres.json();
      if (!pres.ok) { setErr(j.error === "storage_not_configured" ? "对象存储未配置" : j.error === "unsupported_content_type" ? "不支持的图片格式" : (j.error || "presign_failed")); return; }
      const put = await fetch(j.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!put.ok) { setErr("上传失败 " + put.status); return; }
      onUploaded(j.publicUrl);
    } catch { setErr("网络错误"); }
    finally { setBusy(false); if (e.target) e.target.value = ""; }
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <label className="cursor-pointer rounded border border-cream-300 px-2 py-1 text-sage-600 hover:bg-cream-100">
        {busy ? "上传中…" : "上传图片"}
        <input type="file" accept="image/*" className="hidden" onChange={handle} disabled={busy} />
      </label>
      {err && <span className="text-red-500">{err}</span>}
    </div>
  );
}
