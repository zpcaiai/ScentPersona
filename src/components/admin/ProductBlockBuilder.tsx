"use client";
import { useEffect, useState } from "react";

type Opts = { families: string[]; products: { name: string; family: string }[] };

/** Visual builder for a {type:"products"} content block — no hand-written JSON. */
export default function ProductBlockBuilder({ onInsert }: { onInsert: (block: Record<string, unknown>) => void }) {
  const [opts, setOpts] = useState<Opts>({ families: [], products: [] });
  const [mode, setMode] = useState<"family" | "products">("family");
  const [family, setFamily] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    fetch("/api/admin/products/options")
      .then((r) => r.json())
      .then((j: Opts) => { if (j.families) { setOpts(j); setFamily(j.families[0] || ""); } })
      .catch(() => {});
  }, []);

  function toggle(name: string) {
    setPicked((p) => (p.includes(name) ? p.filter((x) => x !== name) : [...p, name]));
  }
  function insert() {
    const block: Record<string, unknown> = { type: "products" };
    if (title.trim()) block.title = title.trim();
    if (mode === "family") { if (!family) return; block.family = family; }
    else { if (picked.length === 0) return; block.productNames = picked; }
    onInsert(block);
    setPicked([]); setTitle("");
  }

  return (
    <div className="space-y-2 rounded-lg border border-cream-300 bg-white p-2 text-xs">
      <div className="font-medium text-clay-600">商品聚合块生成器（无需手写 JSON）</div>
      <div className="flex gap-3">
        <label className="flex items-center gap-1"><input type="radio" checked={mode === "family"} onChange={() => setMode("family")} /> 按香型</label>
        <label className="flex items-center gap-1"><input type="radio" checked={mode === "products"} onChange={() => setMode("products")} /> 指定商品</label>
      </div>
      <input className="w-full rounded border border-cream-300 px-2 py-1" placeholder="小标题（可选，如 这个方向的推荐）" value={title} onChange={(e) => setTitle(e.target.value)} />
      {mode === "family" ? (
        <select className="w-full rounded border border-cream-300 px-2 py-1" value={family} onChange={(e) => setFamily(e.target.value)}>
          {opts.families.length === 0 && <option value="">（加载中…）</option>}
          {opts.families.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      ) : (
        <div className="max-h-40 overflow-auto rounded border border-cream-200 p-1">
          {opts.products.length === 0 && <span className="text-stone-400">加载中…</span>}
          {opts.products.map((p) => (
            <label key={p.name} className="flex items-center gap-1 py-0.5">
              <input type="checkbox" checked={picked.includes(p.name)} onChange={() => toggle(p.name)} />
              <span>{p.name}</span><span className="text-stone-400">· {p.family}</span>
            </label>
          ))}
        </div>
      )}
      <button type="button" onClick={insert} className="rounded bg-sage-500 px-2 py-1 text-white">追加聚合块到内容</button>
    </div>
  );
}
