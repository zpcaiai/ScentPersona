"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

function LoginInner() {
  const { locale } = useLang();
  const next = useSearchParams().get("next") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true); setErr(null);
    const r = await fetch("/api/admin/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    setBusy(false);
    if (r.ok) window.location.href = next;
    else { const j = await r.json(); setErr(j.error === "invalid_credentials" ? pick(locale, "邮箱或密码不正确", "Incorrect email or password") : j.error); }
  }
  return (
    <main style={{ maxWidth: 360, margin: "10vh auto", padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontFamily: "Georgia, serif", color: "#556648", fontSize: 24 }}>{pick(locale, "ScentPersona 后台登录", "ScentPersona admin login")}</h1>
      <input style={{ width: "100%", marginTop: 16, padding: 10, border: "1px solid #e4d8c0", borderRadius: 10 }} placeholder={pick(locale, "邮箱", "Email")} value={email} onChange={(e) => setEmail(e.target.value)} />
      <input style={{ width: "100%", marginTop: 10, padding: 10, border: "1px solid #e4d8c0", borderRadius: 10 }} type="password" placeholder={pick(locale, "密码", "Password")} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
      {err && <p style={{ color: "#c0392b", fontSize: 14 }}>{err}</p>}
      <button onClick={submit} disabled={busy} style={{ width: "100%", marginTop: 14, padding: 12, background: "#6b7d5e", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600 }}>{busy ? pick(locale, "登录中…", "Signing in…") : pick(locale, "登录", "Sign in")}</button>
      <p style={{ color: "#9a948c", fontSize: 12, marginTop: 12 }}>{pick(locale, "首次登录用环境变量 ADMIN_BOOTSTRAP_EMAIL（或 ADMIN_USERNAME）+ ADMIN_PASSWORD 自动创建 owner。", "On first login, the ADMIN_BOOTSTRAP_EMAIL (or ADMIN_USERNAME) + ADMIN_PASSWORD env vars auto-create the owner.")}</p>
    </main>
  );
}
export default function AdminLoginPage() {
  return <Suspense fallback={null}><LoginInner /></Suspense>;
}
