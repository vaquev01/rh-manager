import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, getSessionTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * B People — Schedule CRUD API (Phase 16: real Prisma)
 * GET  /api/schedules  — List schedule entries by date range / unit / person
 * POST /api/schedules  — Upsert a schedule entry (create or update)
 */

export async function GET(request: NextRequest) {
    const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
    const rl = rateLimit(`api:schedules:get:${ip}`, RATE_LIMITS.api);
    if (!rl.allowed) return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });

    try {
        const tenantId = await getSessionTenantId();

        const { searchParams } = request.nextUrl;
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const unitId = searchParams.get("unitId");
        const personId = searchParams.get("personId");

        // Resolve unit IDs belonging to this tenant
        const companies = await prisma.company.findMany({
            where: { tenantId },
            select: { id: true },
        });
        const tenantUnits = await prisma.unit.findMany({
            where: { companyId: { in: companies.map((c) => c.id) } },
            select: { id: true },
        });
        const allowedUnitIds = tenantUnits.map((u) => u.id);

        const where: any = {
            unitId: { in: unitId ? [unitId] : allowedUnitIds },
        };

        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        } else if (startDate) {
            where.date = { gte: new Date(startDate) };
        } else if (endDate) {
            where.date = { lte: new Date(endDate) };
        }

        if (personId) where.personId = personId;

        const entries = await prisma.scheduleEntry.findMany({
            where,
            include: {
                person: { select: { id: true, nome: true, foto: true, cargoId: true, cargo: true } },
                unit: { select: { id: true, nome: true } },
            },
            orderBy: [{ date: "asc" }, { inicio: "asc" }],
        });

        return NextResponse.json({ success: true, data: entries });
    } catch (e: any) {
        const status = e.message === "Não autenticado" ? 401 : 500;
        return NextResponse.json({ success: false, error: e.message }, { status });
    }
}

export async function POST(request: NextRequest) {
    const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
    const rl = rateLimit(`api:schedules:post:${ip}`, RATE_LIMITS.api);
    if (!rl.allowed) return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });

    try {
        await getSessionTenantId();
        const body = await request.json();

        if (!body.personId || !body.date || !body.turno || !body.unitId) {
            return NextResponse.json(
                { success: false, error: "personId, date, turno e unitId são obrigatórios" },
                { status: 400 }
            );
        }

        const entry = await prisma.scheduleEntry.upsert({
            where: {
                personId_date: { personId: body.personId, date: new Date(body.date) },
            },
            update: {
                turno: body.turno,
                inicio: body.inicio ?? "00:00",
                fim: body.fim ?? "00:00",
                unitId: body.unitId,
            },
            create: {
                personId: body.personId,
                unitId: body.unitId,
                date: new Date(body.date),
                turno: body.turno,
                inicio: body.inicio ?? "00:00",
                fim: body.fim ?? "00:00",
            },
            include: {
                person: { select: { id: true, nome: true, foto: true } },
                unit: { select: { id: true, nome: true } },
            },
        });

        return NextResponse.json({ success: true, data: entry }, { status: 201 });
    } catch (err: any) {
        console.error("POST /api/schedules error:", err);
        return NextResponse.json({ success: false, error: err.message ?? "Erro interno" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await getAuthSession();
        const body = await request.json();
        const { personId, date } = body;

        if (!personId || !date) {
            return NextResponse.json({ error: "personId e date obrigatórios" }, { status: 400 });
        }

        await prisma.scheduleEntry.delete({
            where: { personId_date: { personId, date: new Date(date) } },
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
