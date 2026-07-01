"use client";
import { useState } from "react";

const MAX_BYTES = 5 * 1024 * 1024;
const MIN_DIM = 200;
const MAX_DIM = 6000;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

function loadImage(file: File): Promise<HTMLImageElement | null> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { setTimeout(() => URL.revokeObjectURL(url), 8000); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

function makeThumb(img: HTMLImageElement, type: string, maxW = 480): Promise<Blob | null> {
  const scale = Math.min(1, maxW / img.naturalWidth);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, 0.82));
}

async function postForm(url: string, fields: Record<string, string>, body: Blob, filename: string) {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v)); // fields first
  fd.append("file", body, filename);                            // file must be last for S3 POST
  return fetch(url, { method: "POST", body: fd });
}

export default function ImageUpload({ prefix = "hero", onUploaded }: { prefix?: string; onUploaded: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr(null);
    try {
      if (!ALLOWED.includes(file.type)) { setErr("仅支持 JPG / PNG / WebP"); return; }
      if (file.size > MAX_BYTES) { setErr(`图片过大（需 ≤ ${(MAX_BYTES / 1048576).toFixed(0)}MB）`); return; }
      const img = await loadImage(file);
      if (!img) { setErr("无法读取图片"); return; }
      if (img.naturalWidth < MIN_DIM || img.naturalHeight < MIN_DIM) { setErr(`尺寸过小（需 ≥ ${MIN_DIM}px）`); return; }
      if (img.naturalWidth > MAX_DIM || img.naturalHeight > MAX_DIM) { setErr(`尺寸过大（需 ≤ ${MAX_DIM}px）`); return; }

      const pres = await fetch("/api/admin/uploads/presign", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, size: file.size, prefix }),
      });
      const j = await pres.json();
      if (!pres.ok) {
        setErr(j.error === "storage_not_configured" ? "对象存储未配置"
          : j.error === "rate_limited" ? "操作过于频繁，请稍候再试"
          : j.error === "file_too_large" ? "图片超过大小上限"
          : j.error === "unsupported_content_type" ? "不支持的格式"
          : (j.error || "presign_failed"));
        return;
      }
      const ext = file.type.split("/")[1];
      const putFull = await postForm(j.full.url, j.full.fields, file, `hero.${ext}`);
      if (!putFull.ok) { setErr("上传失败（" + putFull.status + "）"); return; }
      if (j.thumb) {
        const thumb = await makeThumb(img, file.type);
        if (thumb) await postForm(j.thumb.url, j.thumb.fields, thumb, `thumb.${ext}`).catch(() => {});
      }
      onUploaded(j.full.publicUrl);
    } catch { setErr("网络错误"); }
    finally { setBusy(false); if (e.target) e.target.value = ""; }
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <label className="cursor-pointer whitespace-nowrap rounded border border-cream-300 px-2 py-1 text-sage-600 hover:bg-cream-100">
        {busy ? "上传中…" : "上传图片"}
        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handle} disabled={busy} />
      </label>
      {err && <span className="text-red-500">{err}</span>}
    </div>
  );
}
