import { getServerSession, NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcrypt";

// ── NextAuth type augmentation ───────────────────────────────────────────────

export interface AppSession {
    user: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role: string;
        tenantId: string;
    };
}

// ── authOptions ───────────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Senha", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email e senha obrigatórios.");
                }

                const user = await prisma.user.findFirst({
                    where: { email: credentials.email },
                });

                if (!user || !user.senhaHash) {
                    throw new Error("Nenhum usuário encontrado com este email.");
                }

                const isPasswordValid = await compare(credentials.password, user.senhaHash);
                if (!isPasswordValid) {
                    throw new Error("Senha incorreta.");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.nome,
                    role: user.role as string,
                    tenantId: user.tenantId,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.tenantId = (user as any).tenantId;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).tenantId = token.tenantId;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development_rh_manager",
};

// ── Typed session helpers ─────────────────────────────────────────────────────

/** Returns the current session as AppSession or throws if unauthenticated. */
export async function getAuthSession(): Promise<AppSession> {
    const session = (await getServerSession(authOptions)) as AppSession | null;
    if (!session?.user?.id) throw new Error("Não autenticado");
    return session;
}

/** Returns the tenantId from the current session or throws. */
export async function getSessionTenantId(): Promise<string> {
    const session = await getAuthSession();
    return session.user.tenantId;
}
