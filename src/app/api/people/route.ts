import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, getSessionTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * B People — People CRUD API (Phase 16: real Prisma)
 */

async function getTenantUnitIds(tenantId: string): Promise<string[]> {
    const companies = await prisma.company.findMany({
        where: { tenantId },
        select: { id: true },
    });
    const units = await prisma.unit.findMany({
        where: { companyId: { in: companies.map((c) => c.id) } },
        select: { id: true },
    });
    return units.map((u) => u.id);
}

export async function GET(request: NextRequest) {
    const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
    const rl = rateLimit(`api:people:get:${ip}`, RATE_LIMITS.api);
    if (!rl.allowed) {
        return NextResponse.json(
            { success: false, error: "Rate limit exceeded", retryAfterMs: rl.retryAfterMs },
            { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
        );
    }

    try {
        const session = await getAuthSession();
        const tenantId = session.user.tenantId;

        const { searchParams } = request.nextUrl;
        const unitIdFilter = searchParams.get("unitId");
        const teamIdFilter = searchParams.get("teamId");
        const statusFilter = searchParams.get("status");
        const search = searchParams.get("q");
        const page = parseInt(searchParams.get("page") ?? "1");
        const limit = Math.min(parseInt(searchParams.get("limit") ?? "200"), 200);

        const allUnitIds = await getTenantUnitIds(tenantId);
        const unitIds = unitIdFilter ? [unitIdFilter] : allUnitIds;

        const where: any = { unitId: { in: unitIds } };
        if (teamIdFilter) where.teamId = teamIdFilter;
        if (statusFilter) where.status = statusFilter;
        if (search) {
            where.OR = [
                { nome: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        const [people, total] = await Promise.all([
            prisma.person.findMany({
                where,
                include: { cargo: true, unit: true, team: true },
                orderBy: { nome: "asc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.person.count({ where }),
        ]);

        return NextResponse.json({ success: true, data: people, meta: { total, page, limit } });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: e.message === "Não autenticado" ? 401 : 500 });
    }
}

export async function POST(request: NextRequest) {
    const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
    const rl = rateLimit(`api:people:post:${ip}`, RATE_LIMITS.api);
    if (!rl.allowed) return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });

    try {
        await getSessionTenantId();
        const body = await request.json();

        if (!body.nome || !body.tipo || !body.unitId || !body.cargoId) {
            return NextResponse.json(
                { success: false, error: "nome, tipo, unitId e cargoId são obrigatórios" },
                { status: 400 }
            );
        }

        const person = await prisma.person.create({
            data: {
                nome: body.nome,
                email: body.email,
                telefone: body.telefone,
                cpf: body.cpf,
                tipo: body.tipo,
                unitId: body.unitId,
                teamId: body.teamId || null,
                cargoId: body.cargoId,
                valorHora: body.valorHora ?? 0,
                pix: body.pix,
                foto: body.foto,
                dataAdmissao: body.dataAdmissao ? new Date(body.dataAdmissao) : null,
                dataNascimento: body.dataNascimento ? new Date(body.dataNascimento) : null,
            },
            include: { cargo: true, unit: true, team: true },
        });

        return NextResponse.json({ success: true, data: person }, { status: 201 });
    } catch (err: any) {
        console.error("POST /api/people error:", err);
        return NextResponse.json({ success: false, error: err.message ?? "Erro interno" }, { status: 500 });
    }
}
