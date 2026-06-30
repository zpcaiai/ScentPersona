"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

export default function NotificationsPage() {
  const { locale } = useLang();
  const [list, setList] = useState<{ id: string; type: string; title: string; content: string; readAt: string | null; createdAt: string }[]>([]);
  const [auth, setAuth] = useState(true);

  function load() { fetch("/api/account/notifications").then((r) => { if (r.status === 401) { setAuth(false); return null; } return r.json(); }).then((j) => j && setList(j.notifications)); }
  useEffect(load, []);
  async function read(id: string) { await fetch(`/api/account/notifications/${id}/read`, { method: "POST" }); load(); }

  if (!auth) return <PageShell><p className="text-sage-600">{pick(locale, "请先 ", "Please ")}<Link href="/account" className="underline">{pick(locale, "登录", "sign in")}</Link>{pick(locale, "。", ".")}</p></PageShell>;
  return (
    <PageShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "通知", "Notifications")}</h1>
          <button onClick={() => read("all")} className="text-sm text-sage-600 underline">{pick(locale, "全部已读", "Mark all read")}</button>
        </div>
        {list.length === 0 && <p className="text-sm text-clay-500">{pick(locale, "还没有通知。", "No notifications yet.")}</p>}
        {list.map((n) => (
          <div key={n.id} onClick={() => !n.readAt && read(n.id)} className={`rounded-xl border p-3 ${n.readAt ? "border-cream-200" : "border-sage-400 bg-cream-50"}`}>
            <div className="flex justify-between">
              <p className="font-medium text-sage-600">{n.title}</p>
              <span className="text-xs text-clay-500">{new Date(n.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")}</span>
            </div>
            <p className="text-sm text-sage-700">{n.content}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
