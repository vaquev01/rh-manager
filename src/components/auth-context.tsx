"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

type AuthUser = {
    email: string;
    nome: string;
    role: "ADMIN" | "GERENTE" | "RH";
    tenant: string;
};

type AuthCtx = {
    user: AuthUser | null;
    login: (email: string, senha: string) => boolean;
    logout: () => void;
};

const AuthContext = createContext<AuthCtx>({
    user: null,
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
        email: "rh@bpeople.com",
        senha: "bpeople",
        user: { email: "rh@bpeople.com", nome: "RH B People", role: "RH", tenant: "bpeople" },
    },
];

const STORAGE_KEY = "bpeople_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setUser(JSON.parse(saved));
        } catch { /* noop */ }
    }, []);

    const login = useCallback((email: string, senha: string) => {
        const found = USERS.find(
            (u) => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
        );
        if (!found) return false;
        setUser(found.user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(found.user));
        return true;
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
