"use client";
import { useState } from "react";

function summarize(b: Record<string, unknown>): string {
  if (!b || typeof b !== "object") return "块";
  const type = typeof b.type === "string" && b.type ? b.type : b.cta ? "cta" : b.items ? "list" : b.text ? "text" : "block";
  let label = "";
  if (typeof b.title === "string" && b.title) label = b.title;
  else if (Array.isArray(b.productNames)) label = (b.productNames as string[]).join("、");
  else if (typeof b.family === "string") label = b.family;
  else if (typeof b.text === "string") label = b.text.slice(0, 24);
  return label ? `${type} · ${label}` : type;
}

/** Visual drag-and-drop reorder / delete for content blocks; edits the same JSON the textarea holds. */
export default function BlockListEditor({ value, onChange }: { value: string; onChange: (json: string) => void }) {
  const [drag, setDrag] = useState<number | null>(null);

  let blocks: Record<string, unknown>[] = [];
  let invalid = false;
  try {
    const parsed = JSON.parse(value || "[]") as unknown;
    if (Array.isArray(parsed)) blocks = parsed as Record<string, unknown>[];
    else invalid = true;
  } catch { invalid = value.trim() !== "" && value.trim() !== "[]"; }

  const commit = (next: unknown[]) => onChange(JSON.stringify(next, null, 2));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length) return;
    const n = [...blocks]; const [x] = n.splice(from, 1); n.splice(to, 0, x); commit(n);
  };
  const del = (i: number) => { const n = [...blocks]; n.splice(i, 1); commit(n); };

  if (invalid) return <p className="text-xs text-red-500">内容块 JSON 暂无法解析，可视化排序不可用（请在下方文本框修正）。</p>;
  if (blocks.length === 0) return <p className="text-xs text-stone-400">还没有内容块，用下方文本框或「聚合块生成器」添加。</p>;

  return (
    <ul className="space-y-1">
      {blocks.map((b, i) => (
        <li
          key={i}
          draggable
          onDragStart={() => setDrag(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => { if (drag !== null && drag !== i) move(drag, i); setDrag(null); }}
          onDragEnd={() => setDrag(null)}
          className={`flex items-center gap-2 rounded border px-2 py-1 text-xs ${drag === i ? "border-sage-400 bg-cream-100" : "border-cream-200 bg-white"}`}
        >
          <span className="cursor-grab select-none text-stone-400" title="拖拽排序">⋮⋮</span>
          <span className="flex-1 truncate text-stone-700">{summarize(b)}</span>
          <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="px-1 text-stone-400 hover:text-sage-600 disabled:opacity-30">↑</button>
          <button type="button" onClick={() => move(i, i + 1)} disabled={i === blocks.length - 1} className="px-1 text-stone-400 hover:text-sage-600 disabled:opacity-30">↓</button>
          <button type="button" onClick={() => del(i)} className="px-1 text-red-400 hover:text-red-600">删除</button>
        </li>
      ))}
    </ul>
  );
}
