import { NextResponse, type NextRequest } from "next/server";

const SECRET = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || "dev_admin_secret_change_me";

function b64urlFromBytes(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  return atob(b64 + pad);
}

// Edge-compatible HMAC-SHA256 verify (matches node:crypto signing in lib/admin/session.ts).
async function verifyEdge(token: string): Promise<{ id: string; role: string; exp: number } | null> {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  if (b64urlFromBytes(new Uint8Array(mac)) !== sig) return null;
  try {
    const obj = JSON.parse(b64urlDecode(payload)) as { id: string; role: string; exp: number };
    if (obj.exp && obj.exp * 1000 < Date.now()) return null;
    return obj;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAdminArea = path.startsWith("/admin") || path.startsWith("/api/admin");
  const isExempt = path === "/admin/login" || path.startsWith("/api/admin/auth");
  if (isAdminArea && !isExempt) {
    const token = request.cookies.get("sp_admin")?.value;
    const session = token ? await verifyEdge(token) : null;
    if (!session) {
      if (path.startsWith("/api/")) {
        return new NextResponse(JSON.stringify({ error: "admin_unauthorized" }), {
          status: 401, headers: { "content-type": "application/json" },
        });
      }
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
