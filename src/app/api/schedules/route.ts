import { NextRequest, NextResponse } from "next/server";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * B People — Schedule CRUD API
 * GET  /api/schedules     — List schedule entries (by date range)
 * POST /api/schedules     — Create/update schedule entry
 */

export async function GET(request: NextRequest) {
    const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
    const rl = rateLimit(`api:schedules:get:${ip}`, RATE_LIMITS.api);
    if (!rl.allowed) {
        return NextResponse.json(
            { success: false, error: "Rate limit exceeded" },
            { status: 429 }
        );
    }

    const { searchParams } = request.nextUrl;
    const filters = {
        startDate: searchParams.get("startDate"),
        endDate: searchParams.get("endDate"),
        unitId: searchParams.get("unitId"),
        personId: searchParams.get("personId"),
    };

    return NextResponse.json({
        success: true,
        data: [],
        meta: { filters },
    });
}

export async function POST(request: NextRequest) {
    const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
    const rl = rateLimit(`api:schedules:post:${ip}`, RATE_LIMITS.api);
    if (!rl.allowed) {
        return NextResponse.json(
            { success: false, error: "Rate limit exceeded" },
            { status: 429 }
        );
    }

    try {
        const body = await request.json();

        if (!body.personId || !body.date || !body.turno) {
            return NextResponse.json(
                { success: false, error: "personId, date, and turno are required" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { id: `sched_${Date.now()}`, ...body },
        }, { status: 201 });
    } catch {
        return NextResponse.json(
            { success: false, error: "Invalid request body" },
            { status: 400 }
        );
    }
}
