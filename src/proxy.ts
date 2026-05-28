import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth/jwt";
import { ROLE_HOME, ROLE_LOGIN, SESSION_COOKIE } from "@/lib/constants";
import type { UserRole } from "@/types/user";

const PROTECTED: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/student", roles: ["student"] },
  { prefix: "/teacher", roles: ["teacher"] },
  { prefix: "/admin", roles: ["admin"] },
];

const AUTH_PATHS = ["/signup", "/login/student", "/login/teacher", "/login/admin"];

function loginUrlForPrefix(prefix: string, request: NextRequest): URL {
  const path = ROLE_LOGIN[prefix.replace("/", "")] ?? "/login/student";
  const url = new URL(path, request.url);
  url.searchParams.set("from", prefix);
  return url;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  let response = NextResponse.next();

  for (const { prefix, roles } of PROTECTED) {
    if (pathname.startsWith(prefix)) {
      if (!session) {
        response = NextResponse.redirect(loginUrlForPrefix(prefix.slice(1), request));
        break;
      }
      if (!roles.includes(session.role)) {
        const home = ROLE_HOME[session.role] ?? "/";
        response = NextResponse.redirect(new URL(home, request.url));
        break;
      }
      break;
    }
  }

  if (session && AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p))) {
    const home = ROLE_HOME[session.role] ?? "/";
    response = NextResponse.redirect(new URL(home, request.url));
  }

  // Add security headers to all responses
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  // Apply to all API routes and page routes, exclude static files, _next, etc.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
