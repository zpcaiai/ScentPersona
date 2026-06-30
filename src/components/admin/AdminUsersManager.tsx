"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";
export default function AdminUsersManager({ admins, roles }: { admins: { id: string; email: string; name: string | null; role: string; status: string }[]; roles: string[] }) {
  const router = useRouter();
  const { locale } = useLang();
  const [f, setF] = useState({ email: "", name: "", role: "operator", password: "" });
  const [msg, setMsg] = useState<string | null>(null);
  async function create() {
    const r = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json(); setMsg(r.ok ? pick(locale, "已创建", "Created") : j.error); if (r.ok) { setF({ ...f, email: "", password: "" }); router.refresh(); }
  }
  async function update(id: string, body: Record<string, unknown>) { await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); router.refresh(); }
  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-cream-200 bg-cream-50 p-4">
        <input className="rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "邮箱", "Email")} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input className="rounded border border-cream-300 px-2 py-1.5" placeholder={pick(locale, "姓名", "Name")} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <select className="rounded border border-cream-300 px-2 py-1.5" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{roles.map((r) => <option key={r}>{r}</option>)}</select>
        <input className="rounded border border-cream-300 px-2 py-1.5" type="password" placeholder={pick(locale, "初始密码", "Initial password")} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <button onClick={create} className="col-span-2 rounded-lg bg-sage-500 py-2 text-white">{pick(locale, "新增管理员", "Add admin")}</button>
        {msg && <p className="col-span-2 text-clay-600">{msg}</p>}
      </div>
      <table className="w-full">
        <thead className="text-left text-clay-500"><tr><th className="py-1">{pick(locale, "邮箱", "Email")}</th><th>{pick(locale, "角色", "Role")}</th><th>{pick(locale, "状态", "Status")}</th></tr></thead>
        <tbody>
          {admins.map((a) => (
            <tr key={a.id} className="border-t border-cream-200">
              <td className="py-1">{a.email}</td>
              <td><select defaultValue={a.role} onChange={(e) => update(a.id, { role: e.target.value })} className="rounded border border-cream-300 px-1 py-0.5">{roles.map((r) => <option key={r}>{r}</option>)}</select></td>
              <td><button onClick={() => update(a.id, { status: a.status === "active" ? "disabled" : "active" })} className="text-sage-600 underline">{a.status}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
