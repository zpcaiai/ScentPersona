"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

const yuan = (c?: number | null) => (c == null ? "—" : `¥${(c / 100).toFixed(2)}`);

interface Me {
  user: { id: string; phone: string; displayName: string | null };
  scentProfile: { currentPersonaId: string | null } | null;
  addressCount: number;
  favorites: { id: string }[];
  orders: { id: string; orderNo: string; orderType: string; status: string; amount: number; finalTotalCents: number | null; productTitle: string | null; createdAt: string }[];
}

export default function AccountPage() {
  const { locale } = useLang();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function load() {
    fetch("/api/account/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe)
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function login() {
    setBusy(true);
    setErr(null);
    try {
      const sessionId = window.localStorage.getItem("sp_session_id") || undefined;
      const r = await fetch("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, sessionId }),
      });
      const j = await r.json();
      if (!r.ok) setErr(j.error === "invalid_phone" ? pick(locale, "请输入有效手机号", "Please enter a valid phone number") : j.error);
      else load();
    } catch {
      setErr(pick(locale, "网络错误", "Network error"));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/account/logout", { method: "POST" });
    setMe(null);
  }

  if (loading) return <PageShell><p className="text-sage-600">{pick(locale, "加载中…", "Loading…")}</p></PageShell>;

  if (!me) {
    return (
      <PageShell>
        <div className="space-y-4">
          <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "登录 / 注册", "Sign in / Sign up")}</h1>
          <p className="text-sm text-sage-600">{pick(locale, "用手机号即可沉淀你的气味人格、订单、收藏与复购推荐。匿名测试记录会自动合并。", "Use your phone number to keep your scent persona, orders, favorites, and repurchase picks. Anonymous quiz records merge automatically.")}</p>
          <input className="w-full rounded-lg border border-cream-300 px-3 py-2" placeholder={pick(locale, "手机号", "Phone number")} value={phone} onChange={(e) => setPhone(e.target.value)} />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button onClick={login} disabled={busy} className="w-full rounded-xl bg-sage-500 py-3 font-medium text-white disabled:opacity-50">{busy ? pick(locale, "登录中…", "Signing in…") : pick(locale, "登录 / 注册", "Sign in / Sign up")}</button>
          <p className="text-xs text-clay-500">{pick(locale, "登录即表示同意隐私政策与服务协议。", "By signing in you agree to the Privacy Policy and Terms of Service.")}</p>
        </div>
      </PageShell>
    );
  }

  const navLinks: [string, string][] = [
    ["/account/wardrobe", pick(locale, "香味衣橱", "Wardrobe")],
    ["/account/coupons", pick(locale, "我的券", "Coupons")],
    ["/account/referrals", pick(locale, "邀请", "Referrals")],
    ["/account/membership", pick(locale, "会员", "Membership")],
    ["/account/notifications", pick(locale, "通知", "Notifications")],
    ["/account/invoices", pick(locale, "发票", "Invoices")],
  ];

  return (
    <PageShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-sage-600">{me.user.displayName || me.user.phone}</h1>
            <p className="text-sm text-clay-500">{me.user.phone}</p>
          </div>
          <button onClick={logout} className="text-sm text-clay-500 underline">{pick(locale, "退出", "Sign out")}</button>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <Link href="/account/scent-profile" className="rounded-xl border border-cream-200 p-3">
            <p className="font-serif text-lg text-sage-600">{pick(locale, "气味资产", "Scent assets")}</p>
            <p className="text-xs text-clay-500">{me.scentProfile?.currentPersonaId ? pick(locale, "已生成", "Ready") : pick(locale, "去测试", "Take quiz")}</p>
          </Link>
          <Link href="/account/addresses" className="rounded-xl border border-cream-200 p-3">
            <p className="font-serif text-lg text-sage-600">{me.addressCount}</p>
            <p className="text-xs text-clay-500">{pick(locale, "收货地址", "Addresses")}</p>
          </Link>
          <Link href="/account/privacy" className="rounded-xl border border-cream-200 p-3">
            <p className="font-serif text-lg text-sage-600">{pick(locale, "隐私", "Privacy")}</p>
            <p className="text-xs text-clay-500">{pick(locale, "授权与数据", "Consent & data")}</p>
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          {navLinks.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-full border border-cream-300 px-3 py-1 text-sage-600">{label}</Link>
          ))}
        </div>

        <section>
          <h2 className="font-medium text-sage-600">{pick(locale, "我的订单", "My orders")}</h2>
          <div className="mt-2 space-y-2">
            {me.orders.length === 0 && <p className="text-sm text-clay-500">{pick(locale, "还没有订单。", "No orders yet.")}</p>}
            {me.orders.map((o) => (
              <Link
                key={o.id}
                href={o.orderType === "proxy" ? `/orders/${o.orderNo}` : `/order/${o.id}`}
                className="block rounded-xl border border-cream-200 p-3"
              >
                <div className="flex justify-between text-sm">
                  <span className="font-mono text-xs text-clay-500">{o.orderNo}</span>
                  <span>{yuan(o.finalTotalCents ?? o.amount)}</span>
                </div>
                <p className="truncate text-sm">{o.productTitle || (o.orderType === "proxy" ? pick(locale, "代下单", "Proxy order") : pick(locale, "小样套装", "Sample kit"))}</p>
                <p className="text-xs text-clay-500">{o.status}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
