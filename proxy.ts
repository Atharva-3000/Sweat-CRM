import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isValidToken } from "@/lib/session";

// Optimistic auth check: bounce visitors without a session to /login.
// Every page and server action also re-checks via requireAdmin().
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = isValidToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    if (authed) return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next();
  }
  if (!authed) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
