import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, getSessionTenantId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const tenantId = await getSessionTenantId();
        const companies = await prisma.company.findMany({
            where: { tenantId },
            include: { units: { include: { teams: true } } },
            orderBy: { nome: "asc" },
        });
        return NextResponse.json({ success: true, data: companies });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 401 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const tenantId = await getSessionTenantId();
        const body = await request.json();
        const { type, ...data } = body;

        if (type === "company") {
            const company = await prisma.company.create({ data: { ...data, tenantId } });
            return NextResponse.json({ success: true, data: company }, { status: 201 });
        }
        if (type === "unit") {
            if (!data.companyId) return NextResponse.json({ error: "companyId obrigatório" }, { status: 400 });
            const unit = await prisma.unit.create({ data: { nome: data.nome, companyId: data.companyId } });
            return NextResponse.json({ success: true, data: unit }, { status: 201 });
        }
        if (type === "team") {
            if (!data.unitId) return NextResponse.json({ error: "unitId obrigatório" }, { status: 400 });
            const team = await prisma.team.create({ data: { nome: data.nome, unitId: data.unitId } });
            return NextResponse.json({ success: true, data: team }, { status: 201 });
        }
        return NextResponse.json({ error: "type deve ser company | unit | team" }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        await getAuthSession();
        const body = await request.json();
        const { type, id, ...data } = body;
        if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

        if (type === "company") {
            const company = await prisma.company.update({ where: { id }, data });
            return NextResponse.json({ success: true, data: company });
        }
        if (type === "unit") {
            const unit = await prisma.unit.update({ where: { id }, data: { nome: data.nome } });
            return NextResponse.json({ success: true, data: unit });
        }
        if (type === "team") {
            const team = await prisma.team.update({ where: { id }, data: { nome: data.nome } });
            return NextResponse.json({ success: true, data: team });
        }
        return NextResponse.json({ error: "type inválido" }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await getAuthSession();
        const body = await request.json();
        const { type, id } = body;
        if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

        if (type === "company") await prisma.company.delete({ where: { id } });
        else if (type === "unit") await prisma.unit.delete({ where: { id } });
        else if (type === "team") await prisma.team.delete({ where: { id } });
        else return NextResponse.json({ error: "type inválido" }, { status: 400 });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
