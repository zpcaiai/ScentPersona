"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

interface Addr {
  id: string; recipientName: string; phone: string; province: string; city: string; district: string; addressLine1: string; isDefault: boolean;
}

export default function AddressesPage() {
  const { locale } = useLang();
  const [list, setList] = useState<Addr[]>([]);
  const [auth, setAuth] = useState(true);
  const [form, setForm] = useState({ recipientName: "", phone: "", province: "", city: "", district: "", addressLine1: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch("/api/account/addresses").then((r) => {
      if (r.status === 401) { setAuth(false); return null; }
      return r.json();
    }).then((j) => j && setList(j.addresses));
  }, []);
  useEffect(load, [load]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function add() {
    setBusy(true);
    const r = await fetch("/api/account/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setBusy(false);
    if (r.ok) { setForm({ recipientName: "", phone: "", province: "", city: "", district: "", addressLine1: "" }); load(); }
  }
  async function setDefault(id: string) { await fetch(`/api/account/addresses/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isDefault: true }) }); load(); }
  async function del(id: string) { await fetch(`/api/account/addresses/${id}`, { method: "DELETE" }); load(); }

  if (!auth) return <PageShell><p className="text-sage-600">{pick(locale, "请先 ", "Please ")}<Link href="/account" className="underline">{pick(locale, "登录", "sign in")}</Link>{pick(locale, "。", " first.")}</p></PageShell>;

  return (
    <PageShell>
      <div className="space-y-5">
        <Link href="/account" className="text-sm text-sage-600 underline">{pick(locale, "← 我的", "← My account")}</Link>
        <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "收货地址", "Shipping addresses")}</h1>

        <div className="space-y-2">
          {list.map((a) => (
            <div key={a.id} className="rounded-xl border border-cream-200 p-3 text-sm">
              <div className="flex justify-between">
                <span>{a.recipientName} · {a.phone}{a.isDefault && <span className="ml-2 rounded bg-sage-500 px-1.5 py-0.5 text-xs text-white">{pick(locale, "默认", "Default")}</span>}</span>
                <span className="space-x-3 text-xs">
                  {!a.isDefault && <button onClick={() => setDefault(a.id)} className="text-sage-600">{pick(locale, "设为默认", "Set as default")}</button>}
                  <button onClick={() => del(a.id)} className="text-clay-500">{pick(locale, "删除", "Delete")}</button>
                </span>
              </div>
              <p className="text-sage-600">{a.province}{a.city}{a.district} {a.addressLine1}</p>
            </div>
          ))}
          {list.length === 0 && <p className="text-sm text-clay-500">{pick(locale, "还没有地址。", "No addresses yet.")}</p>}
        </div>

        <div className="space-y-2 rounded-2xl border border-cream-200 bg-cream-50 p-4">
          <h2 className="font-medium text-sage-600">{pick(locale, "新增地址", "Add an address")}</h2>
          <div className="grid grid-cols-2 gap-2">
            <input className="rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "收件人", "Recipient")} value={form.recipientName} onChange={set("recipientName")} />
            <input className="rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "手机号", "Phone number")} value={form.phone} onChange={set("phone")} />
            <input className="rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "省", "Province")} value={form.province} onChange={set("province")} />
            <input className="rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "市", "City")} value={form.city} onChange={set("city")} />
            <input className="rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "区/县", "District")} value={form.district} onChange={set("district")} />
            <input className="col-span-2 rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "详细地址", "Street address")} value={form.addressLine1} onChange={set("addressLine1")} />
          </div>
          <button onClick={add} disabled={busy} className="w-full rounded-xl bg-sage-500 py-2.5 text-white disabled:opacity-50">{busy ? pick(locale, "保存中…", "Saving…") : pick(locale, "保存地址", "Save address")}</button>
        </div>
      </div>
    </PageShell>
  );
}
