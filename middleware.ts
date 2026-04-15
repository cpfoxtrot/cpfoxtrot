import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "auth_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas: login y API de auth
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const session = request.cookies.get(AUTH_COOKIE);
  const secret = process.env.AUTH_SECRET;

  if (secret && session?.value === secret) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
