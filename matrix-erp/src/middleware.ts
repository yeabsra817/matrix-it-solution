import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ROLE_HOME, type Role } from "./lib/constants";
import { roleFromDashboardSegment } from "./lib/rbac";

const publicPaths = [
  "/login",
  "/api/auth/login",
  "/api/auth/validate-school",
  "/api/auth/session",
  "/api/health",
  "/api/public/",
];
const passwordExempt = ["/change-password", "/api/auth/change-password", "/api/auth/logout"];

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || process.env.JWT_SECRET || "matrix-dev-secret"
);

async function readSession(req: NextRequest) {
  const token = req.cookies.get("matrix_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as {
      role: Role;
      mustChangePwd?: boolean;
      schoolCode?: string | null;
    };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  if (
    publicPaths.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/school/")
  ) {
    return NextResponse.next();
  }

  const session = await readSession(req);
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (
    session.mustChangePwd &&
    session.role !== "SUPER_ADMIN" &&
    !passwordExempt.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.redirect(new URL("/change-password", req.url));
  }

  if (pathname.startsWith("/super-admin") && session.role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], req.url));
  }

  const legacyDashboardRedirects: Record<string, string> = {
    "school-officer": "/dashboard/school-assistant",
    "it-admin": "/dashboard/it-support",
  };
  if (pathname.startsWith("/dashboard/")) {
    const segment = pathname.split("/")[2] || "";
    const legacy = legacyDashboardRedirects[segment];
    if (legacy) {
      const rest = pathname.split("/").slice(3).join("/");
      const target = rest ? `${legacy}/${rest}` : legacy;
      return NextResponse.redirect(new URL(target, req.url));
    }
    const requiredRole = roleFromDashboardSegment(segment);
    if (requiredRole && session.role !== requiredRole) {
      return NextResponse.redirect(new URL(ROLE_HOME[session.role], req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
