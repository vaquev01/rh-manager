"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type AuthRole = "ADMIN" | "GERENTE" | "RH";

export type AuthUser = {
    email: string;
    nome: string;
    role: AuthRole;
    tenant: string;
};

type AuthCtx = {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, senha: string) => boolean;
    logout: () => void;
};

const AuthContext = createContext<AuthCtx>({
    user: null,
    loading: true,
    login: () => false,
    logout: () => { },
});

// Mock user database — multi-tenant
const USERS: { email: string; senha: string; user: AuthUser }[] = [
    {
        email: "admin@wardogs.com",
        senha: "wardogs",
        user: { email: "admin@wardogs.com", nome: "Admin Wardogs", role: "ADMIN", tenant: "wardogs" },
    },
    {
        email: "gerente@wardogs.com",
        senha: "wardogs",
        user: { email: "gerente@wardogs.com", nome: "Gerente Wardogs", role: "GERENTE", tenant: "wardogs" },
    },
    {
        email: "rh@bpeople.com",
        senha: "bpeople",
        user: { email: "rh@bpeople.com", nome: "RH B People", role: "RH", tenant: "bpeople" },
    },
];

const STORAGE_KEY = "bpeople_auth";
const COOKIE_NAME = "bpeople_auth";

function setCookie(name: string, value: string, days: number) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as AuthUser;
                setUser(parsed);
                setCookie(COOKIE_NAME, "1", 7);
            }
        } catch { /* noop */ }
        setLoading(false);
    }, []);

    const login = useCallback((email: string, senha: string) => {
        const found = USERS.find(
            (u) => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
        );
        if (!found) return false;
        setUser(found.user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(found.user));
        setCookie(COOKIE_NAME, "1", 7);
        return true;
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
        deleteCookie(COOKIE_NAME);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
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
