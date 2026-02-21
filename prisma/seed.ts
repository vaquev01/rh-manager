import { PrismaClient } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    const adminPassword = await hash('wardogs', 10)
    const rhPassword = await hash('bpeople', 10)

    // Criar Tenant Teste
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'wardogs' },
        update: {},
        create: {
            slug: 'wardogs',
            nome: 'Wardogs Corp',
            plano: 'enterprise',
        }
    })

    // Criar Admin
    await prisma.user.upsert({
        where: {
            tenantId_email: { tenantId: tenant.id, email: 'admin@wardogs.com' }
        },
        update: {},
        create: {
            tenantId: tenant.id,
            email: 'admin@wardogs.com',
            senhaHash: adminPassword,
            nome: 'Admin Wardogs',
            role: 'ADMIN',
        }
    })

    // Criar RH
    await prisma.user.upsert({
        where: {
            tenantId_email: { tenantId: tenant.id, email: 'rh@bpeople.com' }
        },
        update: {},
        create: {
            tenantId: tenant.id,
            email: 'rh@bpeople.com',
            senhaHash: rhPassword,
            nome: 'RH B People',
            role: 'RH',
        }
    })

    console.log('Seed concluído com sucesso!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
