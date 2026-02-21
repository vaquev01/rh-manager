"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-context";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const ok = await login(email, senha);
            if (ok) {
                router.push("/");
            } else {
                setError("E-mail ou senha incorretos.");
            }
        } catch (err) {
            setError("Ocorreu um erro ao tentar fazer login.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(173,80%,97%)] via-white to-[hsl(173,60%,95%)] px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/landing" className="inline-flex items-center gap-2.5 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-[hsl(173,80%,40%)] flex items-center justify-center shadow-lg shadow-[hsl(173,80%,40%)]/25">
                            <span className="text-white font-black text-lg">B</span>
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-slate-900">B People</span>
                    </Link>
                    <p className="text-sm text-slate-500 mt-1">Acesse sua Central Operacional</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                                E-mail
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-11 px-4 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(173,80%,40%)]/40 focus:border-[hsl(173,80%,40%)] transition-all"
                                placeholder="seu@email.com"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                                Senha
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    className="w-full h-11 px-4 pr-11 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(173,80%,40%)]/40 focus:border-[hsl(173,80%,40%)] transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-[hsl(173,80%,40%)] hover:bg-[hsl(173,80%,35%)] text-white font-bold text-sm rounded-lg shadow-md shadow-[hsl(173,80%,40%)]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {loading ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="h-4 w-4" />
                                    Entrar
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-slate-100">
                        <p className="text-[10px] text-center text-slate-400 uppercase tracking-wider font-semibold mb-2">
                            Multi-tenant · Acesso por nível
                        </p>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] bg-slate-50 rounded-lg px-3 py-2">
                                <span className="text-slate-500">Admin</span>
                                <code className="text-slate-700 font-mono text-[10px]">admin@wardogs.com</code>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center mt-6">
                    <Link href="/landing" className="text-xs text-slate-400 hover:text-[hsl(173,80%,40%)] transition-colors">
                        ← Voltar para a página inicial
                    </Link>
                </p>
            </div>
        </div>
    );
}
