import { NextRequest, NextResponse } from "next/server";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * B People — Export API
 * POST /api/export — Generate export (CSV data)
 * 
 * Accepts: { type: "pix" | "schedule" | "team", filters: {...} }
 * Returns: { success: true, csv: "..." }
 */

export async function POST(request: NextRequest) {
    const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
    const rl = rateLimit(`api:export:${ip}`, RATE_LIMITS.export);
    if (!rl.allowed) {
        return NextResponse.json(
            { success: false, error: "Export rate limit exceeded. Try again later." },
            { status: 429 }
        );
    }

    try {
        const body = await request.json();
        const { type } = body;

        if (!type || !["pix", "schedule", "team"].includes(type)) {
            return NextResponse.json(
                { success: false, error: "type must be 'pix', 'schedule', or 'team'" },
                { status: 400 }
            );
        }

        // Mock: in production, query DB and generate CSV
        const mockCSV = {
            pix: "Nome,Tipo,Horas,Total,PIX\n",
            schedule: "Nome,Cargo,Dia,Turno,Horário\n",
            team: "Nome,Email,Cargo,Contrato,Status,Unidade\n",
        }[type as string] ?? "";

        return NextResponse.json({
            success: true,
            data: {
                csv: mockCSV,
                type,
                rows: 0,
                generatedAt: new Date().toISOString(),
            },
        });
    } catch {
        return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }
}
