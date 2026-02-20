"use client";

import Link from "next/link";
import { Check, ChevronRight, Zap, Building2, Crown } from "lucide-react";

const PLANS = [
    {
        name: "Starter",
        price: "R$ 197",
        period: "/mês",
        desc: "Para operações pequenas",
        icon: Zap,
        color: "border-slate-200",
        features: [
            "1 empresa",
            "Até 3 unidades",
            "Até 50 colaboradores",
            "Escalas + PIX Calculator",
            "Comunicados básicos",
            "Suporte por email",
        ],
        cta: "Começar grátis",
        popular: false,
    },
    {
        name: "Professional",
        price: "R$ 497",
        period: "/mês",
        desc: "Para quem leva a sério",
        icon: Building2,
        color: "border-[hsl(173,80%,40%)] ring-2 ring-[hsl(173,80%,40%)]/20",
        features: [
            "Até 5 empresas",
            "Unidades ilimitadas",
            "Até 200 colaboradores",
            "Recrutamento completo",
            "Comunicados com IA",
            "WhatsApp integrado",
            "Automações por evento",
            "Exports CSV/PDF",
            "Suporte prioritário",
        ],
        cta: "Assinar Professional",
        popular: true,
    },
    {
        name: "Enterprise",
        price: "Sob consulta",
        period: "",
        desc: "Para grandes operações",
        icon: Crown,
        color: "border-slate-200",
        features: [
            "Empresas ilimitadas",
            "Colaboradores ilimitados",
            "SSO / SAML",
            "API pública",
            "Webhooks customizados",
            "White-label",
            "SLA 99.9%",
            "Gerente de conta dedicado",
            "Treinamento personalizado",
        ],
        cta: "Falar com vendas",
        popular: false,
    },
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Nav */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
                <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
                    <Link href="/landing" className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-[hsl(173,80%,40%)] flex items-center justify-center">
                            <span className="text-white font-black text-xs">B</span>
                        </div>
                        <span className="font-bold text-sm text-slate-900">B People</span>
                    </Link>
                    <Link href="/login" className="text-xs font-bold text-white bg-[hsl(173,80%,40%)] px-4 py-2 rounded-lg">
                        Acessar
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="max-w-5xl mx-auto px-6 py-16 text-center">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
                    Planos para cada tamanho de operação
                </h1>
                <p className="text-slate-500 max-w-lg mx-auto">
                    Comece grátis por 14 dias. Sem cartão de crédito. Cancele quando quiser.
                </p>
            </section>

            {/* Plans */}
            <section className="max-w-5xl mx-auto px-6 pb-20">
                <div className="grid gap-6 md:grid-cols-3">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative rounded-2xl border-2 bg-white p-6 flex flex-col ${plan.color} ${plan.popular ? "shadow-xl shadow-[hsl(173,80%,40%)]/10" : "shadow-sm"
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[hsl(173,80%,40%)] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                                    Mais popular
                                </div>
                            )}

                            <div className="flex items-center gap-2 mb-4">
                                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${plan.popular ? "bg-[hsl(173,80%,40%)]/10" : "bg-slate-100"
                                    }`}>
                                    <plan.icon className={`h-4 w-4 ${plan.popular ? "text-[hsl(173,80%,40%)]" : "text-slate-600"}`} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-slate-900">{plan.name}</h3>
                                    <p className="text-[10px] text-slate-500">{plan.desc}</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                                <span className="text-sm text-slate-500">{plan.period}</span>
                            </div>

                            <ul className="flex-1 space-y-2.5 mb-6">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                                        <Check className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${plan.popular ? "text-[hsl(173,80%,40%)]" : "text-emerald-500"}`} />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${plan.popular
                                        ? "bg-[hsl(173,80%,40%)] hover:bg-[hsl(173,80%,35%)] text-white shadow-md"
                                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                    }`}
                            >
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ-like section */}
            <section className="bg-slate-50 border-t border-slate-100">
                <div className="max-w-3xl mx-auto px-6 py-16 text-center">
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Dúvidas?</h2>
                    <p className="text-sm text-slate-500 mb-6">
                        Todos os planos incluem 14 dias grátis. Migre ou cancele a qualquer momento.
                    </p>
                    <Link
                        href="/landing"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[hsl(173,80%,40%)] hover:text-[hsl(173,80%,35%)]"
                    >
                        Ver funcionalidades <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>
            </section>
        </div>
    );
}
