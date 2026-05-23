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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  for (const { prefix, roles } of PROTECTED) {
    if (pathname.startsWith(prefix)) {
      if (!session) {
        return NextResponse.redirect(loginUrlForPrefix(prefix.slice(1), request));
      }
      if (!roles.includes(session.role)) {
        const home = ROLE_HOME[session.role] ?? "/";
        return NextResponse.redirect(new URL(home, request.url));
      }
      return NextResponse.next();
    }
  }

  if (session && AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p))) {
    const home = ROLE_HOME[session.role] ?? "/";
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/teacher/:path*",
    "/admin/:path*",
    "/signup",
    "/login/:path*",
  ],
};
