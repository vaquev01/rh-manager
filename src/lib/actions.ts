"use server";

import { getAuthSession, getSessionTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ── People ────────────────────────────────────────────────────────────────────

export async function getPeople(filters?: {
    unitId?: string;
    teamId?: string;
    status?: string;
    search?: string;
}) {
    const tenantId = await getSessionTenantId();

    const companies = await prisma.company.findMany({
        where: { tenantId },
        select: { id: true },
    });
    const companyIds = companies.map((c) => c.id);

    const units = await prisma.unit.findMany({
        where: { companyId: { in: companyIds } },
        select: { id: true },
    });
    const unitIds = filters?.unitId
        ? [filters.unitId]
        : units.map((u) => u.id);

    const where: any = { unitId: { in: unitIds } };
    if (filters?.teamId) where.teamId = filters.teamId;
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
        where.OR = [
            { nome: { contains: filters.search, mode: "insensitive" } },
            { email: { contains: filters.search, mode: "insensitive" } },
        ];
    }

    return prisma.person.findMany({
        where,
        include: { cargo: true, unit: true, team: true },
        orderBy: { nome: "asc" },
    });
}

export async function createPerson(data: {
    nome: string;
    email?: string;
    telefone?: string;
    cpf?: string;
    tipo: "FIXO" | "FREELA";
    unitId: string;
    teamId?: string;
    cargoId: string;
    valorHora?: number;
    pix?: string;
    foto?: string;
    dataAdmissao?: string;
    dataNascimento?: string;
}) {
    await getSessionTenantId();
    const person = await prisma.person.create({
        data: {
            nome: data.nome,
            email: data.email,
            telefone: data.telefone,
            cpf: data.cpf,
            tipo: data.tipo,
            unitId: data.unitId,
            teamId: data.teamId || null,
            cargoId: data.cargoId,
            valorHora: data.valorHora ?? 0,
            pix: data.pix,
            foto: data.foto,
            dataAdmissao: data.dataAdmissao ? new Date(data.dataAdmissao) : null,
            dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : null,
        },
    });
    revalidatePath("/equipe");
    return person;
}

export async function updatePerson(id: string, data: Partial<{
    nome: string;
    email: string;
    telefone: string;
    cpf: string;
    tipo: string;
    status: string;
    unitId: string;
    teamId: string | null;
    cargoId: string;
    valorHora: number;
    pix: string;
    foto: string;
    dataAdmissao: string;
    dataNascimento: string;
}>) {
    await getSessionTenantId();
    const updated = await prisma.person.update({
        where: { id },
        data: {
            ...data,
            teamId: data.teamId === "null" ? null : data.teamId,
            dataAdmissao: data.dataAdmissao ? new Date(data.dataAdmissao) : undefined,
            dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : undefined,
        } as any,
    });
    revalidatePath("/equipe");
    revalidatePath("/escala");
    return updated;
}

export async function deletePerson(id: string) {
    await getSessionTenantId();
    await prisma.person.delete({ where: { id } });
    revalidatePath("/equipe");
}

// ── Companies ─────────────────────────────────────────────────────────────────

export async function getCompanies() {
    const tenantId = await getSessionTenantId();
    return prisma.company.findMany({
        where: { tenantId },
        include: { units: { include: { teams: true } } },
        orderBy: { nome: "asc" },
    });
}

export async function createCompany(data: { nome: string; cnpj?: string; segmento?: string }) {
    const tenantId = await getSessionTenantId();
    const company = await prisma.company.create({ data: { ...data, tenantId } });
    revalidatePath("/configuracoes");
    return company;
}

export async function updateCompany(id: string, data: { nome?: string; cnpj?: string; segmento?: string }) {
    await getSessionTenantId();
    const company = await prisma.company.update({ where: { id }, data });
    revalidatePath("/configuracoes");
    return company;
}

export async function deleteCompany(id: string) {
    await getSessionTenantId();
    await prisma.company.delete({ where: { id } });
    revalidatePath("/configuracoes");
}

// ── Units ─────────────────────────────────────────────────────────────────────

export async function createUnit(data: { nome: string; companyId: string }) {
    await getSessionTenantId();
    const unit = await prisma.unit.create({ data });
    revalidatePath("/configuracoes");
    return unit;
}

export async function updateUnit(id: string, data: { nome?: string }) {
    await getSessionTenantId();
    const unit = await prisma.unit.update({ where: { id }, data });
    revalidatePath("/configuracoes");
    return unit;
}

export async function deleteUnit(id: string) {
    await getSessionTenantId();
    await prisma.unit.delete({ where: { id } });
    revalidatePath("/configuracoes");
}

// ── Teams ─────────────────────────────────────────────────────────────────────

export async function createTeam(data: { nome: string; unitId: string }) {
    await getSessionTenantId();
    const team = await prisma.team.create({ data });
    revalidatePath("/configuracoes");
    revalidatePath("/equipe");
    return team;
}

export async function updateTeam(id: string, data: { nome?: string }) {
    await getSessionTenantId();
    const team = await prisma.team.update({ where: { id }, data });
    revalidatePath("/configuracoes");
    revalidatePath("/equipe");
    return team;
}

export async function deleteTeam(id: string) {
    await getSessionTenantId();
    await prisma.team.delete({ where: { id } });
    revalidatePath("/configuracoes");
    revalidatePath("/equipe");
}

// ── JobRoles ──────────────────────────────────────────────────────────────────

export async function getJobRoles() {
    await getSessionTenantId();
    return prisma.jobRole.findMany({ orderBy: { nome: "asc" } });
}

export async function createJobRole(data: { nome: string; nivel?: string; area?: string }) {
    await getSessionTenantId();
    return prisma.jobRole.create({ data });
}

// ── Schedules ─────────────────────────────────────────────────────────────────

export async function getSchedules(date: string) {
    await getSessionTenantId();
    return prisma.scheduleEntry.findMany({
        where: { date: new Date(date) },
        include: { person: true, unit: true },
    });
}

export async function upsertSchedule(data: {
    personId: string;
    unitId: string;
    date: string;
    turno: string;
    inicio: string;
    fim: string;
}) {
    await getSessionTenantId();
    const entry = await prisma.scheduleEntry.upsert({
        where: { personId_date: { personId: data.personId, date: new Date(data.date) } },
        update: { turno: data.turno, inicio: data.inicio, fim: data.fim, unitId: data.unitId },
        create: {
            personId: data.personId,
            unitId: data.unitId,
            date: new Date(data.date),
            turno: data.turno,
            inicio: data.inicio,
            fim: data.fim,
        },
    });
    revalidatePath("/escala");
    return entry;
}

// ── Audit ─────────────────────────────────────────────────────────────────────

export async function logAudit(data: {
    acao: string;
    recurso: string;
    recursoId?: string;
    detalhes?: object;
}) {
    try {
        const session = await getAuthSession();
        await prisma.auditLog.create({
            data: {
                tenantId: session.user.tenantId,
                userId: session.user.id,
                userEmail: session.user.email ?? "",
                acao: data.acao,
                recurso: data.recurso,
                recursoId: data.recursoId,
                detalhes: data.detalhes ? (data.detalhes as any) : undefined,
            },
        });
    } catch {
        // Non-blocking — audit failure should never break the main flow
    }
}

export async function getAuditLogs(limit = 50) {
    const tenantId = await getSessionTenantId();
    return prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { criadoEm: "desc" },
        take: limit,
    });
}

// ── Vacancies ─────────────────────────────────────────────────────────────────

export async function getVacancies() {
    await getSessionTenantId();
    return prisma.vacancy.findMany({
        include: { candidates: true },
        orderBy: { criadoEm: "desc" },
    });
}

export async function createVacancy(data: {
    titulo: string;
    descricao?: string;
    prioridade?: string;
    cargoId?: string;
    unitId?: string;
}) {
    await getSessionTenantId();
    const vacancy = await prisma.vacancy.create({ data });
    revalidatePath("/recrutamento");
    return vacancy;
}

export async function updateVacancyStatus(id: string, status: string) {
    await getSessionTenantId();
    const vacancy = await prisma.vacancy.update({ where: { id }, data: { status } });
    revalidatePath("/recrutamento");
    return vacancy;
}

export async function createCandidate(data: {
    vagaId: string;
    nome: string;
    email?: string;
    telefone?: string;
}) {
    await getSessionTenantId();
    const candidate = await prisma.candidate.create({ data });
    revalidatePath("/recrutamento");
    return candidate;
}

export async function updateCandidateStage(id: string, etapa: string) {
    await getSessionTenantId();
    const candidate = await prisma.candidate.update({ where: { id }, data: { etapa } });
    revalidatePath("/recrutamento");
    return candidate;
}
