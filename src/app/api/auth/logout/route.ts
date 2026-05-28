import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";
import { withApiErrorHandler } from "@/lib/api/error";
import { verifyCsrf } from "@/lib/api/csrf";

export async function POST(request: Request) {
  return withApiErrorHandler(async (req) => {
    verifyCsrf(req);
    await clearSessionCookie();
    return NextResponse.redirect(new URL("/", req.url));
  }, request);
}
