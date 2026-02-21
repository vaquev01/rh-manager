import { NextRequest, NextResponse } from "next/server";
import { getSessionTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * B People — Real-time HR Metrics API
 * GET /api/metrics — headcount, status breakdown, burn rate, turnover
 */

export async function GET(request: NextRequest) {
    const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
    const rl = rateLimit(`api:metrics:get:${ip}`, RATE_LIMITS.api);
    if (!rl.allowed) return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });

    try {
        const tenantId = await getSessionTenantId();

        // Get all company/unit IDs for this tenant
        const companies = await prisma.company.findMany({
            where: { tenantId },
            select: { id: true },
        });
        const companyIds = companies.map((c) => c.id);
        const units = await prisma.unit.findMany({
            where: { companyId: { in: companyIds } },
            select: { id: true },
        });
        const unitIds = units.map((u) => u.id);

        // Headcount by status
        const statusCounts = await prisma.person.groupBy({
            by: ["status"],
            where: { unitId: { in: unitIds } },
            _count: { id: true },
        });

        const headcount: Record<string, number> = {};
        let total = 0;
        for (const sc of statusCounts) {
            headcount[sc.status] = sc._count.id;
            total += sc._count.id;
        }

        // Burn rate — sum of valorHora for ATIVO people × 22 working days × 8 hours
        const activePeople = await prisma.person.findMany({
            where: { unitId: { in: unitIds }, status: "ATIVO" },
            select: { valorHora: true, tipo: true },
        });
        const burnRateMonthly = activePeople.reduce((sum, p) => {
            const dailyHours = p.tipo === "FREELA" ? 6 : 8;
            return sum + (p.valorHora ?? 0) * dailyHours * 22;
        }, 0);

        // People by type
        const typeCounts = await prisma.person.groupBy({
            by: ["tipo"],
            where: { unitId: { in: unitIds }, status: "ATIVO" },
            _count: { id: true },
        });

        // People by unit (headcount per unit)
        const unitHeadcount = await prisma.person.groupBy({
            by: ["unitId"],
            where: { unitId: { in: unitIds }, status: "ATIVO" },
            _count: { id: true },
        });

        // Recent hires (last 90 days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const recentHires = await prisma.person.count({
            where: {
                unitId: { in: unitIds },
                dataAdmissao: { gte: ninetyDaysAgo },
            },
        });

        // Open vacancies
        const openVacancies = await prisma.vacancy.count({
            where: { status: { in: ["ABERTA", "EM_ANDAMENTO"] } },
        });

        // Turnover-ish: % desligado (DESLIGADO / total)
        const desligado = headcount["DESLIGADO"] ?? 0;
        const turnoverPct = total > 0 ? Math.round((desligado / total) * 100) : 0;

        return NextResponse.json({
            success: true,
            data: {
                headcount: {
                    total,
                    ativo: headcount["ATIVO"] ?? 0,
                    ferias: headcount["FERIAS"] ?? 0,
                    afastado: headcount["AFASTADO"] ?? 0,
                    desligado,
                },
                burnRateMonthly: Math.round(burnRateMonthly),
                turnoverPct,
                recentHires,
                openVacancies,
                byTipo: typeCounts.map((t) => ({ tipo: t.tipo, count: t._count.id })),
                byUnit: unitHeadcount.map((u) => ({ unitId: u.unitId, count: u._count.id })),
            },
        });
    } catch (e: any) {
        const status = e.message === "Não autenticado" ? 401 : 500;
        return NextResponse.json({ success: false, error: e.message }, { status });
    }
}
