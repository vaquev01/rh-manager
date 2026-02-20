"use client";

import Link from "next/link";
import {
    LayoutGrid, Users, Megaphone, Briefcase, GraduationCap, Settings,
    ChevronRight, CheckCircle2, Shield, Building2, Clock, Zap, Bot,
    CreditCard, FileText, BarChart3, Smartphone
} from "lucide-react";

const FEATURES = [
    {
        icon: LayoutGrid,
        title: "Dashboard & Escalas",
        desc: "Monte escalas semanais com drag-and-drop, controle cobertura por cargo e visualize KPIs operacionais em tempo real.",
        color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    },
    {
        icon: Users,
        title: "Gestão de Equipe",
        desc: "Cadastro completo de colaboradores (Fixos e Freelas), dados pessoais, contratos, documentos e histórico de alterações.",
        color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
        icon: CreditCard,
        title: "Calculadora PIX do Dia",
        desc: "Cálculo automático de pagamentos diários com custo/hora, adicionais globais, resumo PIX e relatório copiável.",
        color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
    },
    {
        icon: Megaphone,
        title: "Comunicados Inteligentes",
        desc: "Editor com IA integrada (encurtar, adaptar tom), prévia WhatsApp em tempo real, automações por evento e segmentação avançada.",
        color: "text-teal-600 bg-teal-50 dark:bg-teal-900/20",
    },
    {
        icon: Briefcase,
        title: "Recrutamento Completo",
        desc: "Master-detail com timeline do processo seletivo, Kanban de vagas, Banco de Talentos e templates de descritivo de vaga.",
        color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
    },
    {
        icon: GraduationCap,
        title: "Desenvolvimento",
        desc: "Matriz de competências por cargo com Radar Chart, avaliação individual 1-5 por colaborador, aderência % e feedback.",
        color: "text-rose-600 bg-rose-50 dark:bg-rose-900/20",
    },
    {
        icon: Settings,
        title: "Configurações Flexíveis",
        desc: "Parametrize fusos, formatos, tipos de adicionais, turnos, cargos, unidades e regras de automação por empresa.",
        color: "text-slate-600 bg-slate-100 dark:bg-slate-800",
    },
    {
        icon: Bot,
        title: "Automações & Webhooks",
        desc: "Disparos automáticos por eventos (PIX ausente, doc pendente, aniversários), conectores webhook para Jira, Notion e mais.",
        color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20",
    },
];

const TENANCY = [
    { icon: Building2, label: "Multi-empresa", desc: "Uma instalação, múltiplas empresas e unidades." },
    { icon: Shield, label: "Níveis de Acesso", desc: "Admin, Gerente e RH — cada um vê o que precisa." },
    { icon: Clock, label: "Tempo Real", desc: "Atualizações instantâneas em escalas, pagamentos e comunicados." },
    { icon: BarChart3, label: "Relatórios", desc: "KPIs, progresso de recrutamento, aderência de competências." },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white text-slate-900">
            {/* ─── NAVBAR ─────────────────────────────────── */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
                <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-[hsl(173,80%,40%)] flex items-center justify-center">
                            <span className="text-white font-black text-sm">B</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight text-slate-900">B People</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5"
                        >
                            Entrar
                        </Link>
                        <Link
                            href="/login"
                            className="text-sm font-bold text-white bg-[hsl(173,80%,40%)] hover:bg-[hsl(173,80%,35%)] px-4 py-2 rounded-lg transition-colors shadow-sm"
                        >
                            Acessar Plataforma
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ─── HERO ───────────────────────────────────── */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(173,80%,97%)] via-white to-[hsl(173,60%,95%)]" />
                <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28 text-center">
                    <div className="inline-flex items-center gap-2 bg-[hsl(173,80%,40%)]/10 text-[hsl(173,80%,35%)] text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-6 border border-[hsl(173,80%,40%)]/20">
                        <Zap className="h-3.5 w-3.5" />
                        People Ops Multi-Empresa
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight mb-5">
                        Gerencie sua equipe<br />
                        <span className="text-[hsl(173,80%,40%)]">do jeito certo.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-8">
                        Escalas, pagamentos, comunicados, recrutamento e desenvolvimento — tudo em uma
                        plataforma inteligente, multi-empresa e com IA integrada.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 bg-[hsl(173,80%,40%)] hover:bg-[hsl(173,80%,35%)] text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-[hsl(173,80%,40%)]/25 transition-all hover:-translate-y-0.5"
                        >
                            Começar agora
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                        <a
                            href="#features"
                            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm px-6 py-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-white"
                        >
                            Ver funcionalidades
                        </a>
                    </div>
                </div>
            </section>

            {/* ─── FEATURES ───────────────────────────────── */}
            <section id="features" className="max-w-6xl mx-auto px-6 py-16 md:py-20">
                <div className="text-center mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Tudo que sua operação precisa</h2>
                    <p className="text-slate-500 max-w-xl mx-auto">
                        Da escala ao desenvolvimento de pessoas — uma plataforma completa para People Ops.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {FEATURES.map((f) => (
                        <div
                            key={f.title}
                            className="group rounded-2xl border border-slate-100 bg-white p-5 hover:border-[hsl(173,80%,40%)]/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default"
                        >
                            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${f.color} mb-3`}>
                                <f.icon className="h-5 w-5" />
                            </div>
                            <h3 className="font-bold text-sm text-slate-900 mb-1">{f.title}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── MULTI-TENANT ───────────────────────────── */}
            <section className="bg-slate-50 border-y border-slate-100">
                <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                            Multi-tenant, multi-nível
                        </h2>
                        <p className="text-slate-500 max-w-xl mx-auto">
                            Cada empresa tem seu espaço. Cada gestor vê o que precisa. Tudo controlado.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {TENANCY.map((t) => (
                            <div key={t.label} className="flex items-start gap-3 bg-white rounded-xl border border-slate-100 p-4">
                                <div className="h-9 w-9 rounded-lg bg-[hsl(173,80%,40%)]/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <t.icon className="h-4 w-4 text-[hsl(173,80%,40%)]" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900 mb-0.5">{t.label}</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">{t.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── HOW IT WORKS ───────────────────────────── */}
            <section className="max-w-6xl mx-auto px-6 py-16 md:py-20">
                <div className="text-center mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Como funciona</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    {[
                        { step: "01", title: "Configure", desc: "Cadastre empresas, unidades, cargos e colaboradores. Configure turnos e regras de pagamento." },
                        { step: "02", title: "Opere", desc: "Monte escalas, dispare comunicados com IA, gerencie processos seletivos e calcule pagamentos PIX." },
                        { step: "03", title: "Evolua", desc: "Acompanhe aderência de competências, automatize cobranças e gere relatórios em um clique." },
                    ].map((s) => (
                        <div key={s.step} className="relative rounded-2xl border border-slate-100 bg-white p-6 hover:shadow-md transition-shadow">
                            <span className="text-4xl font-black text-[hsl(173,80%,40%)]/15 absolute top-4 right-5">{s.step}</span>
                            <h3 className="font-bold text-lg text-slate-900 mb-2">{s.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── HIGHLIGHTS ─────────────────────────────── */}
            <section className="bg-[hsl(173,80%,40%)] text-white">
                <div className="max-w-6xl mx-auto px-6 py-14 text-center">
                    <div className="grid gap-8 sm:grid-cols-3">
                        <div>
                            <p className="text-3xl md:text-4xl font-black mb-1">100%</p>
                            <p className="text-sm font-medium text-white/80">Cloud & Responsivo</p>
                        </div>
                        <div>
                            <p className="text-3xl md:text-4xl font-black mb-1">∞</p>
                            <p className="text-sm font-medium text-white/80">Empresas & Unidades</p>
                        </div>
                        <div>
                            <p className="text-3xl md:text-4xl font-black mb-1">IA</p>
                            <p className="text-sm font-medium text-white/80">Comunicados Inteligentes</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── CTA ────────────────────────────────────── */}
            <section className="max-w-6xl mx-auto px-6 py-16 md:py-20 text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                    Pronto para transformar seu People Ops?
                </h2>
                <p className="text-slate-500 max-w-lg mx-auto mb-8">
                    Comece agora — acesse a plataforma e veja o B People em ação.
                </p>
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 bg-[hsl(173,80%,40%)] hover:bg-[hsl(173,80%,35%)] text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-[hsl(173,80%,40%)]/25 transition-all hover:-translate-y-0.5"
                >
                    Acessar B People
                    <ChevronRight className="h-4 w-4" />
                </Link>
            </section>

            {/* ─── FOOTER ─────────────────────────────────── */}
            <footer className="border-t border-slate-100 bg-slate-50">
                <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-[hsl(173,80%,40%)] flex items-center justify-center">
                            <span className="text-white font-black text-[10px]">B</span>
                        </div>
                        <span className="text-sm font-bold text-slate-700">B People</span>
                    </div>
                    <p className="text-xs text-slate-400">© {new Date().getFullYear()} B People. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
}
