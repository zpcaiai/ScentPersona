import { getAdminSessionFromRequest } from "./session";
import { hasPermission, type Permission } from "./permissions";

/** Admin operator id from the signed session (replaces Basic-Auth decoding). */
export function getAdminOperator(request: Request): string {
  return getAdminSessionFromRequest(request)?.id ?? "system";
}

export function getAdminRole(request: Request): string | undefined {
  return getAdminSessionFromRequest(request)?.role;
}

/** Permission gate for API routes. */
export function adminCan(request: Request, permission: Permission): boolean {
  return hasPermission(getAdminRole(request), permission);
}
