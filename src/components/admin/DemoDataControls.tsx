"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Owner/admin-only button to wipe + reseed demo data. Visibility gated by ENABLE_DEMO_TOOLS on the server. */
export default function DemoDataControls() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function reset() {
    if (!window.confirm("确定清空并重播演示数据？只影响 DEMO- 标记记录，不动真实业务数据。")) return;
    setBusy(true); setMsg(null);
    const r = await fetch("/api/admin/demo/reset", { method: "POST" });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) { setMsg(`已重置：清除订单 ${j.removed?.orders ?? 0}、用户 ${j.removed?.users ?? 0}，重播 ${j.seeded?.orders ?? 0} 单`); router.refresh(); }
    else setMsg(j.error === "demo_tools_disabled" ? "演示工具未启用（ENABLE_DEMO_TOOLS）" : j.error === "forbidden" ? "无权限（需 admin:manage）" : (j.error || "失败"));
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <button onClick={reset} disabled={busy} className="rounded-full border border-clay-300 px-3 py-1 text-xs text-clay-600 hover:bg-cream-100 disabled:opacity-50">
        {busy ? "重置中…" : "重置演示数据"}
      </button>
      {msg && <span className="text-xs text-clay-500">{msg}</span>}
    </div>
  );
}
