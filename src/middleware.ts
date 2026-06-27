import { NextResponse, type NextRequest } from "next/server";

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="ScentPersona Admin"',
    },
  });
}

function isAdminAuthorized(request: NextRequest): boolean {
  const password = process.env.ADMIN_PASSWORD;
  const username = process.env.ADMIN_USERNAME || "admin";

  if (!password) {
    return process.env.NODE_ENV !== "production";
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;

  try {
    const decoded = atob(header.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex < 0) return false;

    const providedUsername = decoded.slice(0, separatorIndex);
    const providedPassword = decoded.slice(separatorIndex + 1);

    return providedUsername === username && providedPassword === password;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin") && !isAdminAuthorized(request)) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
