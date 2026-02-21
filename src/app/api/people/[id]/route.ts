import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        await getAuthSession();
        const person = await prisma.person.findUnique({
            where: { id: params.id },
            include: { cargo: true, unit: true, team: true },
        });
        if (!person) return NextResponse.json({ success: false, error: "Não encontrado" }, { status: 404 });
        return NextResponse.json({ success: true, data: person });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 401 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await getAuthSession();
        const body = await request.json();

        const updated = await prisma.person.update({
            where: { id: params.id },
            data: {
                ...(body.nome !== undefined && { nome: body.nome }),
                ...(body.email !== undefined && { email: body.email }),
                ...(body.telefone !== undefined && { telefone: body.telefone }),
                ...(body.cpf !== undefined && { cpf: body.cpf }),
                ...(body.tipo !== undefined && { tipo: body.tipo }),
                ...(body.status !== undefined && { status: body.status }),
                ...(body.unitId !== undefined && { unitId: body.unitId }),
                ...(body.cargoId !== undefined && { cargoId: body.cargoId }),
                ...(body.valorHora !== undefined && { valorHora: body.valorHora }),
                ...(body.pix !== undefined && { pix: body.pix }),
                ...(body.foto !== undefined && { foto: body.foto }),
                ...("teamId" in body && { teamId: body.teamId === "null" || body.teamId === null ? null : body.teamId }),
                ...(body.dataAdmissao !== undefined && { dataAdmissao: body.dataAdmissao ? new Date(body.dataAdmissao) : null }),
                ...(body.dataNascimento !== undefined && { dataNascimento: body.dataNascimento ? new Date(body.dataNascimento) : null }),
            } as any,
            include: { cargo: true, unit: true, team: true },
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (e: any) {
        console.error("PATCH /api/people/[id] error:", e);
        return NextResponse.json({ success: false, error: e.message ?? "Erro interno" }, { status: 500 });
    }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
    try {
        await getAuthSession();
        await prisma.person.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message ?? "Erro interno" }, { status: 500 });
    }
}
