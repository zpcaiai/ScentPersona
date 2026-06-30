"use client";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";
export default function LogoutButton() {
  const { locale } = useLang();
  return (
    <button
      onClick={async () => { await fetch("/api/admin/auth/logout", { method: "POST" }); window.location.href = "/admin/login"; }}
      className="rounded-full border border-clay-300 px-3 py-1 text-clay-600"
    >{pick(locale, "退出", "Sign out")}</button>
  );
}
