import { NextRequest, NextResponse } from "next/server";

/**
 * B People — Auth API
 * POST /api/auth/login
 * 
 * In production, this will validate against DB and return JWT.
 * Currently validates against mock users.
 */

const USERS = [
    { email: "admin@wardogs.com", senha: "wardogs", role: "ADMIN", tenant: "wardogs", nome: "Admin Wardogs" },
    { email: "gerente@wardogs.com", senha: "wardogs", role: "GERENTE", tenant: "wardogs", nome: "Gerente Wardogs" },
    { email: "rh@bpeople.com", senha: "bpeople", role: "RH", tenant: "bpeople", nome: "RH B People" },
];

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

        const user = USERS.find(
            (u) => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
        );

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Credenciais inválidas" },
                { status: 401 }
            );
        }

        // In production: generate JWT, set httpOnly cookie
        const response = NextResponse.json({
            success: true,
            data: {
                email: user.email,
                nome: user.nome,
                role: user.role,
                tenant: user.tenant,
            },
        });

        // Set auth cookie (for middleware)
        response.cookies.set("bpeople_auth", "1", {
            httpOnly: false, // needs client-side access for now
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 604800, // 7 days
            path: "/",
        });

        return response;
    } catch {
        return NextResponse.json(
            { success: false, error: "Erro interno" },
            { status: 500 }
        );
    }
}
