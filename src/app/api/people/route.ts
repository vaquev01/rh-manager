import { NextRequest, NextResponse } from "next/server";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * B People — People CRUD API
 * GET  /api/people      — List people (with filters)
 * POST /api/people      — Create person
 * 
 * In production: Prisma queries with tenant isolation.
 * Currently returns mock response structure.
 */

export async function GET(request: NextRequest) {
    const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
    const rl = rateLimit(`api:people:get:${ip}`, RATE_LIMITS.api);
    if (!rl.allowed) {
        return NextResponse.json(
            { success: false, error: "Rate limit exceeded", retryAfterMs: rl.retryAfterMs },
            { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
        );
    }

    const { searchParams } = request.nextUrl;
    const filters = {
        companyId: searchParams.get("companyId"),
        unitId: searchParams.get("unitId"),
        teamId: searchParams.get("teamId"),
        type: searchParams.get("type"),
        status: searchParams.get("status"),
        search: searchParams.get("q"),
        page: parseInt(searchParams.get("page") ?? "1"),
        limit: Math.min(parseInt(searchParams.get("limit") ?? "50"), 100),
    };

    // Mock: In production replace with Prisma query
    return NextResponse.json({
        success: true,
        data: [],
        meta: {
            total: 0,
            page: filters.page,
            limit: filters.limit,
            filters,
        },
    });
}

export async function POST(request: NextRequest) {
    const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
    const rl = rateLimit(`api:people:post:${ip}`, RATE_LIMITS.api);
    if (!rl.allowed) {
        return NextResponse.json(
            { success: false, error: "Rate limit exceeded" },
            { status: 429 }
        );
    }

    try {
        const body = await request.json();

        // Validate with Zod (import from schemas when wired to DB)
        if (!body.nome || !body.type) {
            return NextResponse.json(
                { success: false, error: "nome and type are required" },
                { status: 400 }
            );
        }

        // Mock: In production replace with Prisma create
        return NextResponse.json({
            success: true,
            data: { id: `person_${Date.now()}`, ...body },
        }, { status: 201 });
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid request body" },
            { status: 400 }
        );
    }
}
