/**
 * Admin permission catalogue + default role mapping (Skill 41).
 * TODO(production): enforce these on every /admin surface using the
 * authenticated AdminUser's role (currently Basic-Auth only).
 */
export const PERMISSIONS = [
  "order:view",
  "order:view_sensitive",
  "order:update",
  "address:view",
  "address:view_full",
  "finance:view",
  "refund:process",
  "product:edit",
  "legal:edit",
  "admin:manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: [...PERMISSIONS],
  admin: [
    "order:view",
    "order:view_sensitive",
    "order:update",
    "address:view",
    "address:view_full",
    "finance:view",
    "refund:process",
    "product:edit",
  ],
  operator: ["order:view", "order:update", "address:view", "product:edit"],
  finance: ["order:view", "finance:view"],
  viewer: ["order:view"],
};

export function hasPermission(role: string | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}
