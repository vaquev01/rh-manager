import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcrypt";

/**
 * B People — Auth Login API (Phase 16: real Prisma)
 * POST /api/auth/login
 *
 * Note: Primary login uses NextAuth at /api/auth/[...nextauth].
 * This route is kept as a compatibility layer / direct REST login endpoint.
 */

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, senha } = body;

        if (!email || !senha) {
            return NextResponse.json(
                { success: false, error: "Email e senha obrigatórios" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
            include: { tenant: true },
        });

        if (!user || !user.senhaHash) {
            return NextResponse.json({ success: false, error: "Credenciais inválidas" }, { status: 401 });
        }

        const valid = await compare(senha, user.senhaHash);
        if (!valid) {
            return NextResponse.json({ success: false, error: "Credenciais inválidas" }, { status: 401 });
        }

        // Update last login timestamp
        await prisma.user.update({
            where: { id: user.id },
            data: { ultimoLogin: new Date() },
        });

        const response = NextResponse.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                nome: user.nome,
                role: user.role,
                tenantId: user.tenantId,
                tenant: user.tenant.nome,
            },
        });

        // Set auth cookie for middleware compatibility
        response.cookies.set("bpeople_auth", "1", {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days (matches NextAuth JWT)
            path: "/",
        });

        return response;
    } catch (err: any) {
        console.error("POST /api/auth/login error:", err);
        return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
    }
}
