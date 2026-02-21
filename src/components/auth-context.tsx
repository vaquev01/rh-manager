"use client";

import { createContext, useContext, ReactNode } from "react";
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";

export type AuthRole = "ADMIN" | "GERENTE" | "RH";

export type AuthUser = {
    id: string;
    email: string;
    nome: string;
    role: AuthRole;
    tenantId: string;
};

export function AuthProvider({ children }: { children: ReactNode }) {
    return <SessionProvider>{children}</SessionProvider>;
}

// Custom hook to adapt NextAuth `useSession` format to original `useAuth` signature for frontend compatibility
export function useAuth() {
    const { data: session, status } = useSession();

    const user = session?.user ? {
        id: (session.user as any).id,
        email: session.user.email || "",
        nome: session.user.name || "",
        role: (session.user as any).role as AuthRole,
        tenantId: (session.user as any).tenantId
    } as AuthUser : null;

    return {
        user,
        loading: status === "loading",
        login: async (email: string, senha: string) => {
            const res = await signIn("credentials", {
                email,
                password: senha,
                redirect: false
            });
            return res?.ok ?? false;
        },
        logout: () => signOut({ callbackUrl: "/landing" })
    };
}

// Permission helpers
const PERMISSIONS: Record<AuthRole, string[]> = {
    ADMIN: ["*"],
    GERENTE: [
        "VER_DASHBOARD", "EDITAR_ESCALA", "VER_EQUIPE", "EDITAR_EQUIPE",
        "VER_COMUNICADOS", "ENVIAR_COMUNICADOS", "VER_RECRUTAMENTO",
        "VER_DESENVOLVIMENTO", "VER_CONFIGURACOES",
    ],
    RH: [
        "VER_DASHBOARD", "VER_ESCALA", "VER_EQUIPE",
        "VER_COMUNICADOS", "VER_RECRUTAMENTO", "VER_DESENVOLVIMENTO",
    ],
};

export function hasPermission(role: AuthRole, permission: string): boolean {
    const perms = PERMISSIONS[role];
    return perms.includes("*") || perms.includes(permission);
}
