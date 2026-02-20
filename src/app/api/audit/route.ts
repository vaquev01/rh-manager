import { NextResponse } from "next/server";

/**
 * B People — Audit Log API
 * GET /api/audit — Retrieve audit entries (mock)
 * 
 * In production: query from DB with tenant isolation.
 */
export async function GET() {
    return NextResponse.json({
        success: true,
        data: [],
        meta: { total: 0, page: 1, limit: 50 },
    });
}
