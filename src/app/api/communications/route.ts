import { NextRequest, NextResponse } from "next/server";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * B People — Communications API
 * GET  /api/communications  — List dispatches
 * POST /api/communications  — Send communication
 */

export async function GET(request: NextRequest) {
    const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
    const rl = rateLimit(`api:comms:get:${ip}`, RATE_LIMITS.api);
    if (!rl.allowed) {
        return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
    }

    return NextResponse.json({
        success: true,
        data: [],
        meta: { total: 0 },
    });
}

export async function POST(request: NextRequest) {
    const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
    const rl = rateLimit(`api:comms:post:${ip}`, RATE_LIMITS.api);
    if (!rl.allowed) {
        return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
    }

    try {
        const body = await request.json();

        if (!body.conteudo) {
            return NextResponse.json(
                { success: false, error: "conteudo is required" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                id: `comm_${Date.now()}`,
                status: "ENVIADO",
                destinatarios: body.destinatarios ?? 0,
                ...body,
            },
        }, { status: 201 });
    } catch {
        return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }
}
