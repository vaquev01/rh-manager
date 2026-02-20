import { NextResponse } from "next/server";

/**
 * B People — Health Check API
 * GET /api/health
 */
export async function GET() {
    return NextResponse.json({
        status: "ok",
        service: "bpeople",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        uptime: process.uptime(),
    });
}
