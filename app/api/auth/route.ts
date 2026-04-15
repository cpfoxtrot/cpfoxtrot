import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "auth_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!process.env.AUTH_SECRET || password !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, process.env.AUTH_SECRET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(AUTH_COOKIE);
  return response;
}
