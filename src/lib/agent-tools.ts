import { prisma } from "@/lib/prisma";
import { getSessionTenantId } from "@/lib/auth";

// ── Tool Definitions (OpenAI function calling schema) ─────────────────────────

export const AGENT_TOOLS = [
    {
        type: "function" as const,
        function: {
            name: "get_headcount",
            description: "Retorna contagem de colaboradores por status (ATIVO, FERIAS, AFASTADO) e tipo (FIXO, FREELA). Use para responder perguntas sobre headcount total, quantos estão ativos, de férias, etc.",
            parameters: {
                type: "object",
                properties: {
                    unitName: { type: "string", description: "Nome da unidade para filtrar (opcional). Ex: 'São Paulo HQ'" },
                    teamName: { type: "string", description: "Nome do time para filtrar (opcional). Ex: 'Engenharia'" },
                },
                required: [],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "search_people",
            description: "Busca colaboradores por nome, cargo, time, unidade ou status. Retorna lista com dados principais.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Texto livre para buscar pelo nome do colaborador" },
                    status: { type: "string", enum: ["ATIVO", "FERIAS", "AFASTADO"], description: "Filtrar por status" },
                    tipo: { type: "string", enum: ["FIXO", "FREELA"], description: "Filtrar por tipo de contrato" },
                    teamName: { type: "string", description: "Nome do time para filtrar" },
                    unitName: { type: "string", description: "Nome da unidade para filtrar" },
                    cargoName: { type: "string", description: "Nome do cargo para filtrar" },
                },
                required: [],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "get_people_on_leave",
            description: "Lista colaboradores que estão de férias (FERIAS) ou afastados (AFASTADO) hoje ou em um período.",
            parameters: {
                type: "object",
                properties: {},
                required: [],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "get_burn_rate",
            description: "Calcula o burn rate mensal estimado (custo de pessoas) baseado em valorHora × horas trabalhadas por unidade ou total.",
            parameters: {
                type: "object",
                properties: {
                    unitName: { type: "string", description: "Nome da unidade (opcional, para filtrar)" },
                },
                required: [],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "get_open_vacancies",
            description: "Lista todas as vagas abertas ou em andamento, com título, prioridade e dias em aberto.",
            parameters: {
                type: "object",
                properties: {},
                required: [],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "get_org_structure",
            description: "Retorna a estrutura organizacional completa: empresas, unidades e times com contagem de pessoas.",
            parameters: {
                type: "object",
                properties: {},
                required: [],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "get_recent_hires",
            description: "Lista as admissões recentes, com nome, data de admissão, cargo e unidade.",
            parameters: {
                type: "object",
                properties: {
                    days: { type: "number", description: "Quantos dias atrás considerar como 'recente' (padrão: 90)" },
                },
                required: [],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "get_anniversary_alerts",
            description: "Lista colaboradores com aniversário de admissão ou de nascimento próximos (próximos 7 dias).",
            parameters: {
                type: "object",
                properties: {},
                required: [],
            },
        },
    },
    {
        type: "function" as const,
        function: {
            name: "create_vacancy",
            description: "Cria uma nova vaga de emprego no sistema.",
            parameters: {
                type: "object",
                properties: {
                    titulo: { type: "string", description: "Título da vaga" },
                    descricao: { type: "string", description: "Descrição detalhada da vaga" },
                    prioridade: { type: "string", enum: ["ALTA", "MEDIA", "BAIXA"], description: "Prioridade da vaga" },
                },
                required: ["titulo"],
            },
        },
    },
] as const;

// ── Tool Executor ─────────────────────────────────────────────────────────────

export type ToolName = typeof AGENT_TOOLS[number]["function"]["name"];

export async function executeTool(
    name: ToolName,
    args: Record<string, any>,
    tenantId: string
): Promise<string> {
    try {
        const result = await runTool(name, args, tenantId);
        return JSON.stringify(result);
    } catch (e: any) {
        return JSON.stringify({ error: e.message ?? "Tool execution failed" });
    }
}

async function getUnitIds(tenantId: string, unitName?: string): Promise<string[]> {
    const companies = await prisma.company.findMany({ where: { tenantId }, select: { id: true } });
    const units = await prisma.unit.findMany({
        where: {
            companyId: { in: companies.map((c) => c.id) },
            ...(unitName ? { nome: { contains: unitName, mode: "insensitive" } } : {}),
        },
        select: { id: true },
    });
    return units.map((u) => u.id);
}

async function runTool(name: ToolName, args: Record<string, any>, tenantId: string): Promise<any> {
    switch (name) {
        // ── get_headcount ─────────────────────────────────────────────────────────
        case "get_headcount": {
            const unitIds = await getUnitIds(tenantId, args.unitName);
            let teamIds: string[] | undefined;
            if (args.teamName) {
                const teams = await prisma.team.findMany({
                    where: { unitId: { in: unitIds }, nome: { contains: args.teamName, mode: "insensitive" } },
                    select: { id: true },
                });
                teamIds = teams.map((t) => t.id);
            }

            const where: any = { unitId: { in: unitIds } };
            if (teamIds) where.teamId = { in: teamIds };

            const counts = await prisma.person.groupBy({ by: ["status", "tipo"], where, _count: { id: true } });
            const total = await prisma.person.count({ where });

            const summary: Record<string, any> = { total };
            for (const c of counts) {
                summary[`${c.status}_${c.tipo}`] = c._count.id;
            }
            const ativo = counts.filter(c => c.status === "ATIVO").reduce((s, c) => s + c._count.id, 0);
            const ferias = counts.filter(c => c.status === "FERIAS").reduce((s, c) => s + c._count.id, 0);
            const afastado = counts.filter(c => c.status === "AFASTADO").reduce((s, c) => s + c._count.id, 0);
            const freelas = counts.filter(c => c.tipo === "FREELA" && c.status === "ATIVO").reduce((s, c) => s + c._count.id, 0);

            return { total, ativo, ferias, afastado, freelas, filtros: { unitName: args.unitName, teamName: args.teamName } };
        }

        // ── search_people ─────────────────────────────────────────────────────────
        case "search_people": {
            const unitIds = await getUnitIds(tenantId, args.unitName);
            const where: any = { unitId: { in: unitIds } };
            if (args.status) where.status = args.status;
            if (args.tipo) where.tipo = args.tipo;
            if (args.query) where.OR = [{ nome: { contains: args.query, mode: "insensitive" } }, { email: { contains: args.query, mode: "insensitive" } }];
            if (args.cargoName) where.cargo = { nome: { contains: args.cargoName, mode: "insensitive" } };
            if (args.teamName) {
                const teams = await prisma.team.findMany({ where: { unitId: { in: unitIds }, nome: { contains: args.teamName, mode: "insensitive" } }, select: { id: true } });
                where.teamId = { in: teams.map(t => t.id) };
            }

            const people = await prisma.person.findMany({
                where,
                include: { cargo: { select: { nome: true } }, unit: { select: { nome: true } }, team: { select: { nome: true } } },
                orderBy: { nome: "asc" },
                take: 20,
            });

            return people.map((p) => ({
                nome: p.nome, email: p.email, status: p.status, tipo: p.tipo,
                cargo: p.cargo?.nome, unidade: p.unit?.nome, time: p.team?.nome,
                valorHora: p.valorHora, dataAdmissao: p.dataAdmissao?.toISOString().split("T")[0],
            }));
        }

        // ── get_people_on_leave ───────────────────────────────────────────────────
        case "get_people_on_leave": {
            const unitIds = await getUnitIds(tenantId);
            const people = await prisma.person.findMany({
                where: { unitId: { in: unitIds }, status: { in: ["FERIAS", "AFASTADO"] } },
                include: { cargo: { select: { nome: true } }, unit: { select: { nome: true } }, team: { select: { nome: true } } },
                orderBy: { nome: "asc" },
            });
            return people.map((p) => ({ nome: p.nome, status: p.status, cargo: p.cargo?.nome, unidade: p.unit?.nome, time: p.team?.nome }));
        }

        // ── get_burn_rate ─────────────────────────────────────────────────────────
        case "get_burn_rate": {
            const unitIds = await getUnitIds(tenantId, args.unitName);
            const activePeople = await prisma.person.findMany({
                where: { unitId: { in: unitIds }, status: "ATIVO" },
                include: { unit: { select: { nome: true } } },
            });

            let totalBurn = 0;
            const byUnit: Record<string, number> = {};
            for (const p of activePeople) {
                const hours = p.tipo === "FREELA" ? 6 : 8;
                const monthly = (p.valorHora ?? 0) * hours * 22;
                totalBurn += monthly;
                const uNome = p.unit?.nome ?? "Desconhecida";
                byUnit[uNome] = (byUnit[uNome] ?? 0) + monthly;
            }

            return {
                burnRateMensal: Math.round(totalBurn),
                burnRateMensalFormatado: `R$ ${totalBurn.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`,
                porUnidade: Object.entries(byUnit).map(([nome, valor]) => ({ nome, valor: Math.round(valor) })),
                totalColaboradoresAtivos: activePeople.length,
            };
        }

        // ── get_open_vacancies ────────────────────────────────────────────────────
        case "get_open_vacancies": {
            const vacancies = await prisma.vacancy.findMany({
                where: { status: { in: ["ABERTA", "EM_ANDAMENTO"] } },
                include: { candidates: { select: { id: true } } },
                orderBy: { criadoEm: "asc" },
            });
            const today = new Date();
            return vacancies.map((v) => ({
                titulo: v.titulo, prioridade: v.prioridade, status: v.status,
                candidatos: v.candidates.length,
                diasEmAberto: Math.floor((today.getTime() - v.criadoEm.getTime()) / 86400000),
            }));
        }

        // ── get_org_structure ─────────────────────────────────────────────────────
        case "get_org_structure": {
            const companies = await prisma.company.findMany({
                where: { tenantId },
                orderBy: { nome: "asc" },
            });
            const result = [];
            for (const c of companies) {
                const units = await prisma.unit.findMany({ where: { companyId: c.id }, orderBy: { nome: "asc" } });
                const unidades = [];
                for (const u of units) {
                    const teams = await prisma.team.findMany({ where: { unitId: u.id }, orderBy: { nome: "asc" } });
                    const peopleCount = await prisma.person.count({ where: { unitId: u.id } });
                    const teamData = [];
                    for (const t of teams) {
                        const tCount = await prisma.person.count({ where: { teamId: t.id } });
                        teamData.push({ nome: t.nome, colaboradores: tCount });
                    }
                    unidades.push({ nome: u.nome, colaboradores: peopleCount, times: teamData });
                }
                result.push({ empresa: c.nome, cnpj: c.cnpj, unidades });
            }
            return result;
        }

        // ── get_recent_hires ──────────────────────────────────────────────────────
        case "get_recent_hires": {
            const days = args.days ?? 90;
            const since = new Date();
            since.setDate(since.getDate() - days);
            const unitIds = await getUnitIds(tenantId);
            const people = await prisma.person.findMany({
                where: { unitId: { in: unitIds }, dataAdmissao: { gte: since } },
                include: { cargo: { select: { nome: true } }, unit: { select: { nome: true } }, team: { select: { nome: true } } },
                orderBy: { dataAdmissao: "desc" },
            });
            return people.map((p) => ({
                nome: p.nome, cargo: p.cargo?.nome, unidade: p.unit?.nome, time: p.team?.nome,
                dataAdmissao: p.dataAdmissao?.toISOString().split("T")[0],
                diasNaEmpresa: p.dataAdmissao ? Math.floor((Date.now() - p.dataAdmissao.getTime()) / 86400000) : null,
            }));
        }

        // ── get_anniversary_alerts ────────────────────────────────────────────────
        case "get_anniversary_alerts": {
            const unitIds = await getUnitIds(tenantId);
            const people = await prisma.person.findMany({
                where: { unitId: { in: unitIds }, status: "ATIVO" },
                include: { cargo: { select: { nome: true } }, unit: { select: { nome: true } } },
            });
            const today = new Date();
            const soon: any[] = [];
            for (const p of people) {
                // Check birthday in next 7 days
                if (p.dataNascimento) {
                    const bday = new Date(p.dataNascimento);
                    const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
                    const diff = Math.floor((thisYear.getTime() - today.getTime()) / 86400000);
                    if (diff >= 0 && diff <= 7) soon.push({ nome: p.nome, tipo: "Aniversário", data: thisYear.toISOString().split("T")[0], dias: diff, cargo: p.cargo?.nome });
                }
                // Check work anniversary in next 7 days
                if (p.dataAdmissao) {
                    const ann = new Date(today.getFullYear(), p.dataAdmissao.getMonth(), p.dataAdmissao.getDate());
                    const diff = Math.floor((ann.getTime() - today.getTime()) / 86400000);
                    const anos = today.getFullYear() - p.dataAdmissao.getFullYear();
                    if (diff >= 0 && diff <= 7 && anos > 0) soon.push({ nome: p.nome, tipo: `Aniversário de ${anos} ano(s) na empresa`, data: ann.toISOString().split("T")[0], dias: diff, cargo: p.cargo?.nome });
                }
            }
            return soon.sort((a, b) => a.dias - b.dias);
        }

        // ── create_vacancy ────────────────────────────────────────────────────────
        case "create_vacancy": {
            const vacancy = await prisma.vacancy.create({
                data: { titulo: args.titulo, descricao: args.descricao, prioridade: args.prioridade ?? "MEDIA", status: "ABERTA" },
            });
            return { sucesso: true, id: vacancy.id, titulo: vacancy.titulo, mensagem: `Vaga "${vacancy.titulo}" criada com sucesso!` };
        }

        default:
            return { error: `Tool desconhecida: ${name}` };
    }
}
