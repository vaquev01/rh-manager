import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

// Helper: find or create (no unique constraint needed)
async function findOrCreate<T>(
    finder: () => Promise<T | null>,
    creator: () => Promise<T>
): Promise<T> {
    const existing = await finder()
    return existing ?? creator()
}

async function main() {
    console.log('🌱 Iniciando seed expandido...')

    // ── Tenant ────────────────────────────────────────────────────────────────
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'wardogs' },
        update: { nome: 'Wardogs Corp' },
        create: { slug: 'wardogs', nome: 'Wardogs Corp', plano: 'enterprise' },
    })

    // ── Users ─────────────────────────────────────────────────────────────────
    const adminPass = await hash('wardogs', 10)
    const rhPass = await hash('bpeople', 10)

    await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: 'admin@wardogs.com' } },
        update: {},
        create: { tenantId: tenant.id, email: 'admin@wardogs.com', senhaHash: adminPass, nome: 'Admin Wardogs', role: 'ADMIN' },
    })
    await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: 'rh@bpeople.com' } },
        update: {},
        create: { tenantId: tenant.id, email: 'rh@bpeople.com', senhaHash: rhPass, nome: 'RH B People', role: 'RH' },
    })

    // ── Companies ─────────────────────────────────────────────────────────────
    const compW = await findOrCreate(
        () => prisma.company.findFirst({ where: { tenantId: tenant.id, nome: 'Wardogs Corp' } }),
        () => prisma.company.create({ data: { tenantId: tenant.id, nome: 'Wardogs Corp', cnpj: '12.345.678/0001-90', segmento: 'Tecnologia' } })
    )
    const compBP = await findOrCreate(
        () => prisma.company.findFirst({ where: { tenantId: tenant.id, nome: 'B People Consulting' } }),
        () => prisma.company.create({ data: { tenantId: tenant.id, nome: 'B People Consulting', cnpj: '98.765.432/0001-10', segmento: 'Consultoria' } })
    )

    // ── Units ─────────────────────────────────────────────────────────────────
    async function findOrCreateUnit(companyId: string, nome: string) {
        return findOrCreate(
            () => prisma.unit.findFirst({ where: { companyId, nome } }),
            () => prisma.unit.create({ data: { companyId, nome } })
        )
    }

    const uSP = await findOrCreateUnit(compW.id, 'São Paulo HQ')
    const uRJ = await findOrCreateUnit(compW.id, 'Rio de Janeiro')
    const uCWB = await findOrCreateUnit(compW.id, 'Curitiba')
    const uCentral = await findOrCreateUnit(compBP.id, 'Escritório Central')
    const uPOA = await findOrCreateUnit(compBP.id, 'Porto Alegre')

    // ── Teams ─────────────────────────────────────────────────────────────────
    async function findOrCreateTeam(unitId: string, nome: string) {
        return findOrCreate(
            () => prisma.team.findFirst({ where: { unitId, nome } }),
            () => prisma.team.create({ data: { unitId, nome } })
        )
    }

    const tEng = await findOrCreateTeam(uSP.id, 'Engenharia')
    const tProd = await findOrCreateTeam(uSP.id, 'Produto')
    const tDes = await findOrCreateTeam(uSP.id, 'Design')
    const tVen = await findOrCreateTeam(uSP.id, 'Vendas')
    const tOps = await findOrCreateTeam(uRJ.id, 'Operações')
    const tSup = await findOrCreateTeam(uRJ.id, 'Suporte')
    const tDev = await findOrCreateTeam(uCWB.id, 'DevOps')
    const tQA = await findOrCreateTeam(uCWB.id, 'QA')
    const tRH = await findOrCreateTeam(uCentral.id, 'RH & Talent')

    // ── Job Roles ─────────────────────────────────────────────────────────────
    async function findOrCreateRole(nome: string, nivel?: string, area?: string) {
        return findOrCreate(
            () => prisma.jobRole.findFirst({ where: { nome } }),
            () => prisma.jobRole.create({ data: { nome, nivel, area } })
        )
    }

    const roles = {
        engPleno: await findOrCreateRole('Engenheiro de Software Pleno', 'Pleno', 'Engenharia'),
        engSenior: await findOrCreateRole('Engenheiro de Software Sênior', 'Sênior', 'Engenharia'),
        techLead: await findOrCreateRole('Tech Lead', 'Lead', 'Engenharia'),
        pm: await findOrCreateRole('Product Manager', 'Sênior', 'Produto'),
        ux: await findOrCreateRole('Designer UX/UI', 'Pleno', 'Design'),
        vendasAna: await findOrCreateRole('Analista de Vendas', 'Júnior', 'Vendas'),
        vendasGer: await findOrCreateRole('Gerente de Vendas', 'Gerência', 'Vendas'),
        opsAna: await findOrCreateRole('Analista de Operações', 'Pleno', 'Operações'),
        suporte: await findOrCreateRole('Agente de Suporte', 'Júnior', 'Suporte'),
        devops: await findOrCreateRole('DevOps Engineer', 'Sênior', 'Infraestrutura'),
        qa: await findOrCreateRole('QA Engineer', 'Pleno', 'Qualidade'),
        rhCons: await findOrCreateRole('Consultor de RH', 'Pleno', 'RH'),
        rhRec: await findOrCreateRole('Analista de Recrutamento', 'Júnior', 'RH'),
        freela: await findOrCreateRole('Freelancer Técnico', 'Externo', 'Engenharia'),
    }

    // ── People (25) ───────────────────────────────────────────────────────────
    const people = [
        { nome: 'Lucas Ferreira', email: 'lucas.ferreira@wardogs.com', tipo: 'FIXO', status: 'ATIVO', unit: uSP, team: tEng, role: roles.techLead, vh: 120, pix: 'lucas.ferreira@pix.com', da: '2021-03-15', dn: '1990-07-22' },
        { nome: 'Beatriz Costa', email: 'beatriz.costa@wardogs.com', tipo: 'FIXO', status: 'ATIVO', unit: uSP, team: tEng, role: roles.engSenior, vh: 95, pix: 'beatriz.costa@pix.com', da: '2022-01-10', dn: '1993-04-11' },
        { nome: 'Rafael Sousa', email: 'rafael.sousa@wardogs.com', tipo: 'FIXO', status: 'ATIVO', unit: uSP, team: tEng, role: roles.engPleno, vh: 75, pix: 'rafael.sousa@pix.com', da: '2023-06-01', dn: '1995-11-30' },
        { nome: 'Camila Rodrigues', email: 'camila.rodrigues@wardogs.com', tipo: 'FIXO', status: 'FERIAS', unit: uSP, team: tEng, role: roles.engPleno, vh: 75, pix: 'camila@pix.com', da: '2023-09-12', dn: '1996-02-14' },
        { nome: 'Diego Almeida', email: 'diego.almeida@wardogs.com', tipo: 'FREELA', status: 'ATIVO', unit: uSP, team: tEng, role: roles.freela, vh: 110, pix: 'diego.almeida@pix.com', da: '2024-01-15', dn: '1988-09-05' },
        { nome: 'Ana Paula Mendes', email: 'ana.mendes@wardogs.com', tipo: 'FIXO', status: 'ATIVO', unit: uSP, team: tProd, role: roles.pm, vh: 105, pix: 'ana.mendes@pix.com', da: '2020-08-20', dn: '1989-12-03' },
        { nome: 'Thiago Neves', email: 'thiago.neves@wardogs.com', tipo: 'FIXO', status: 'ATIVO', unit: uSP, team: tProd, role: roles.opsAna, vh: 70, pix: 'thiago.neves@pix.com', da: '2022-11-07', dn: '1994-06-18' },
        { nome: 'Mariana Lima', email: 'mariana.lima@wardogs.com', tipo: 'FIXO', status: 'ATIVO', unit: uSP, team: tDes, role: roles.ux, vh: 85, pix: 'mariana.lima@pix.com', da: '2021-10-05', dn: '1992-08-27' },
        { nome: 'Pedro Carvalho', email: 'pedro.carvalho@wardogs.com', tipo: 'FREELA', status: 'ATIVO', unit: uSP, team: tDes, role: roles.ux, vh: 90, pix: 'pedro.carvalho@pix.com', da: '2024-03-01', dn: '1997-01-09' },
        { nome: 'Patricia Oliveira', email: 'patricia.oliveira@wardogs.com', tipo: 'FIXO', status: 'ATIVO', unit: uSP, team: tVen, role: roles.vendasGer, vh: 100, pix: 'patricia.oliveira@pix.com', da: '2019-05-20', dn: '1985-03-15' },
        { nome: 'Bruno Andrade', email: 'bruno.andrade@wardogs.com', tipo: 'FIXO', status: 'ATIVO', unit: uSP, team: tVen, role: roles.vendasAna, vh: 60, pix: 'bruno.andrade@pix.com', da: '2023-02-28', dn: '1999-10-01' },
        { nome: 'Fernanda Castro', email: 'fernanda.castro@wardogs.com', tipo: 'FIXO', status: 'AFASTADO', unit: uSP, team: tVen, role: roles.vendasAna, vh: 62, pix: 'fernanda.castro@pix.com', da: '2022-07-14', dn: '1998-05-21' },
        { nome: 'Eduardo Martins', email: 'eduardo.martins@wardogs.com', tipo: 'FIXO', status: 'ATIVO', unit: uRJ, team: tOps, role: roles.opsAna, vh: 72, pix: 'eduardo.martins@pix.com', da: '2021-01-25', dn: '1991-07-30' },
        { nome: 'Isabella Teixeira', email: 'isabella.teixeira@wardogs.com', tipo: 'FIXO', status: 'ATIVO', unit: uRJ, team: tOps, role: roles.opsAna, vh: 68, pix: 'isabella@pix.com', da: '2022-04-11', dn: '1995-09-17' },
        { nome: 'Gabriel Torres', email: 'gabriel.torres@wardogs.com', tipo: 'FIXO', status: 'ATIVO', unit: uRJ, team: tSup, role: roles.suporte, vh: 50, pix: 'gabriel.torres@pix.com', da: '2023-08-01', dn: '2000-02-14' },
        { nome: 'Juliana Pereira', email: 'juliana.pereira@wardogs.com', tipo: 'FIXO', status: 'ATIVO', unit: uRJ, team: tSup, role: roles.suporte, vh: 50, pix: 'juliana.pereira@pix.com', da: '2023-11-20', dn: '2001-06-08' },
        { nome: 'Carlos Barbosa', email: 'carlos.barbosa@wardogs.com', tipo: 'FIXO', status: 'ATIVO', unit: uCWB, team: tDev, role: roles.devops, vh: 105, pix: 'carlos.barbosa@pix.com', da: '2020-09-10', dn: '1988-12-25' },
        { nome: 'Larissa Ribeiro', email: 'larissa.ribeiro@wardogs.com', tipo: 'FIXO', status: 'ATIVO', unit: uCWB, team: tDev, role: roles.devops, vh: 98, pix: 'larissa.ribeiro@pix.com', da: '2021-06-14', dn: '1992-04-02' },
        { nome: 'Mateus Silva', email: 'mateus.silva@wardogs.com', tipo: 'FIXO', status: 'ATIVO', unit: uCWB, team: tQA, role: roles.qa, vh: 78, pix: 'mateus.silva@pix.com', da: '2022-10-03', dn: '1994-08-19' },
        { nome: 'Priscila Gomes', email: 'priscila.gomes@wardogs.com', tipo: 'FIXO', status: 'ATIVO', unit: uCWB, team: tQA, role: roles.qa, vh: 75, pix: 'priscila.gomes@pix.com', da: '2023-05-22', dn: '1996-11-04' },
        { nome: 'Adriana Fonseca', email: 'adriana.fonseca@bpeople.com', tipo: 'FIXO', status: 'ATIVO', unit: uCentral, team: tRH, role: roles.rhCons, vh: 88, pix: 'adriana.fonseca@pix.com', da: '2020-02-17', dn: '1987-05-30' },
        { nome: 'Roberto Campos', email: 'roberto.campos@bpeople.com', tipo: 'FIXO', status: 'ATIVO', unit: uCentral, team: tRH, role: roles.rhRec, vh: 65, pix: 'roberto.campos@pix.com', da: '2021-09-08', dn: '1993-10-16' },
        { nome: 'Tatiane Rocha', email: 'tatiane.rocha@bpeople.com', tipo: 'FIXO', status: 'ATIVO', unit: uCentral, team: tRH, role: roles.rhRec, vh: 63, pix: 'tatiane.rocha@pix.com', da: '2022-03-28', dn: '1996-07-12' },
        { nome: 'Marcos Pires', email: 'marcos.pires@bpeople.com', tipo: 'FREELA', status: 'ATIVO', unit: uPOA, team: null, role: roles.freela, vh: 80, pix: 'marcos.pires@pix.com', da: '2024-01-08', dn: '1990-01-27' },
        { nome: 'Viviane Santos', email: 'viviane.santos@bpeople.com', tipo: 'FIXO', status: 'FERIAS', unit: uCentral, team: tRH, role: roles.rhCons, vh: 85, pix: 'viviane.santos@pix.com', da: '2020-11-03', dn: '1986-09-09' },
    ]

    let personCount = 0
    for (const p of people) {
        await findOrCreate(
            () => prisma.person.findFirst({ where: { email: p.email } }),
            () => prisma.person.create({
                data: {
                    nome: p.nome,
                    email: p.email,
                    tipo: p.tipo as any,
                    status: p.status as any,
                    unitId: p.unit.id,
                    teamId: p.team?.id ?? null,
                    cargoId: p.role.id,
                    valorHora: p.vh,
                    pix: p.pix,
                    dataAdmissao: new Date(p.da),
                    dataNascimento: new Date(p.dn),
                }
            })
        )
        personCount++
    }

    // ── Vacancies ─────────────────────────────────────────────────────────────
    const vacancyData = [
        { titulo: 'Engenheiro de Software Pleno — Back-end', prioridade: 'ALTA', status: 'ABERTA', unitId: uSP.id, cargoId: roles.engPleno.id },
        { titulo: 'Designer UX Sênior', prioridade: 'MEDIA', status: 'ABERTA', unitId: uSP.id, cargoId: roles.ux.id },
        { titulo: 'DevOps Engineer', prioridade: 'ALTA', status: 'EM_ANDAMENTO', unitId: uCWB.id, cargoId: roles.devops.id },
        { titulo: 'Agente de Suporte N2', prioridade: 'BAIXA', status: 'ABERTA', unitId: uRJ.id, cargoId: roles.suporte.id },
    ]
    for (const v of vacancyData) {
        const existing = await prisma.vacancy.findFirst({ where: { titulo: v.titulo } })
        if (!existing) await prisma.vacancy.create({ data: v })
    }

    console.log(`\n✅ Seed completo!`)
    console.log(`   - 1 tenant (Wardogs Corp)`)
    console.log(`   - 2 empresas`)
    console.log(`   - 5 unidades`)
    console.log(`   - 9 times`)
    console.log(`   - 14 cargos`)
    console.log(`   - ${personCount} colaboradores`)
    console.log(`   - 4 vagas abertas`)
    console.log(`\nCredenciais:`)
    console.log(`  admin@wardogs.com  /  wardogs`)
    console.log(`  rh@bpeople.com     /  bpeople`)
}

main()
    .catch((e) => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })
