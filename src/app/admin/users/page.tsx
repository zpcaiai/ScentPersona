import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin/session";
import AdminUsersManager from "@/components/admin/AdminUsersManager";
import { ROLE_PERMISSIONS } from "@/lib/admin/permissions";
import { getLocale } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const locale = getLocale();
  const session = getAdminSession();
  if (session?.role !== "owner") {
    return <main className="mx-auto max-w-2xl px-4 py-8"><p className="text-clay-600">{pick(locale, "仅 owner 可管理管理员账号。", "Only an owner can manage admin accounts.")}</p></main>;
  }
  const admins = await db.adminUser.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, email: true, name: true, role: true, status: true } });
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-serif text-2xl text-sage-600">{pick(locale, "管理员与权限", "Admins & permissions")}</h1>
      <p className="text-sm text-clay-500">{pick(locale, "角色权限：owner 全部；admin 运营+财务+退款；operator 基础运营；finance 仅财务；viewer 只读。", "Role permissions: owner = all; admin = ops + finance + refunds; operator = basic ops; finance = finance only; viewer = read-only.")}</p>
      <div className="mt-4"><AdminUsersManager admins={admins} roles={Object.keys(ROLE_PERMISSIONS)} /></div>
    </main>
  );
}
