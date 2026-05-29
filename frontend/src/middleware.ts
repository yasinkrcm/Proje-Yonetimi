import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import type { JwtPayload } from "@/types/auth";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const COOKIE_NAME = "auth_token";
const LOGIN_PATH = "/auth/login";

// TextEncoder result is cached at module load — not re-encoded per request
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  console.log(`[Middleware] Path: ${pathname}`);

  // Auth routes and static assets are always public
  if (pathname.startsWith("/auth") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  console.log(`[Middleware] Token Present: ${!!token}`);

  if (!token) {
    console.log(`[Middleware] Redirecting to login (no token)`);
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  try {
    // jwtVerify validates signature AND expiry — no manual exp check needed
    await jwtVerify<JwtPayload>(token, JWT_SECRET);
    console.log(`[Middleware] Token Verified Successfully`);
    return NextResponse.next();
  } catch (err) {
    console.log(`[Middleware] Token Verification Failed:`, err);
    // Token is invalid or expired: clear the stale cookie to avoid redirect loops
    const response = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    response.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return response;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Matcher — excludes static files and Next.js internals
// favicon.ico must be explicitly excluded or the browser request loops
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
