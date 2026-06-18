import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

import { resolveMenuPermissionFromPath, resolveDefaultDashboardPath } from "@/types/menu-permissions";

export const config = {
  matcher: ["/dashboard/:path*", "/cuadrillas/:path*"],
};

async function fetchMenuPermissions(
  req: NextRequest,
): Promise<string[] | null> {
  const cookie = req.headers.get("cookie");
  const response = await fetch(new URL("/api/user/menu-permissions", req.url), {
    headers: cookie ? { cookie } : {},
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Menu permissions request failed: ${response.status}`);
  }

  const payload = (await response.json()) as { menuPermissions?: string[] };
  return payload.menuPermissions ?? [];
}

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const requiredPermission = resolveMenuPermissionFromPath(
    req.nextUrl.pathname,
  );
  if (requiredPermission) {
    try {
      const menuPermissions = await fetchMenuPermissions(req);

      if (!menuPermissions) {
        return NextResponse.redirect(new URL("/", req.url));
      }

      if (!menuPermissions.includes(requiredPermission)) {
        return NextResponse.redirect(
          new URL(resolveDefaultDashboardPath(menuPermissions), req.url),
        );
      }
    } catch (error) {
      console.error("Error resolving menu permissions in middleware:", error);
    }
  }

  const res = NextResponse.next();

  if (!req.headers.get("origin")) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto =
      req.headers.get("x-forwarded-proto") ||
      req.nextUrl.protocol.replace(":", "");
    if (host) {
      res.headers.set("origin", `${proto}://${host}`);
    }
  }

  return res;
}
