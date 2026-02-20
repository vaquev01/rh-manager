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

    // Check auth cookie (set by client-side auth)
    const authToken = request.cookies.get("bpeople_auth");

    if (!authToken?.value) {
        const landingUrl = new URL("/landing", request.url);
        return NextResponse.redirect(landingUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
