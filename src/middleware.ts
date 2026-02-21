import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/landing", "/login", "/onboarding", "/pricing", "/terms", "/privacy", "/api", "/_next", "/favicon"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public paths
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // Allow static files
    if (pathname.includes(".")) {
        return NextResponse.next();
    }

    // Check NextAuth JWT session cookie (primary auth method)
    // NextAuth sets: "next-auth.session-token" in development, "__Secure-next-auth.session-token" in production
    const nextAuthToken =
        request.cookies.get("next-auth.session-token") ??
        request.cookies.get("__Secure-next-auth.session-token");

    // Fallback: legacy bpeople_auth cookie (set by REST /api/auth/login)
    const legacyToken = request.cookies.get("bpeople_auth");

    if (!nextAuthToken?.value && !legacyToken?.value) {
        const landingUrl = new URL("/landing", request.url);
        return NextResponse.redirect(landingUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
