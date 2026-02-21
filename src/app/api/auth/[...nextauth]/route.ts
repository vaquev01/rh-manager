import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma"; // Assuming a prisma client instance here
import { compare } from "bcrypt";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any, // Type assertion for compatibility if needed
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Senha", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email e senha obrigatórios.");
                }

                const user = await prisma.user.findFirst({
                    where: { email: credentials.email }
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
                    role: user.role,
                    tenantId: user.tenantId
                };
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
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
        }
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development_rh_manager"
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
