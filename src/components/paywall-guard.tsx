"use client";

import { useState } from "react";
import { Lock, Crown, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PaywallGuardProps {
    featureName: string;
    requiredPlan: "professional" | "enterprise";
    currentPlan?: string;
    children: React.ReactNode;
    fallbackType?: "card" | "modal" | "inline";
}

/**
 * PaywallGuard / Feature Flag component
 * Wraps any component and blocks access if the user's tenant plan doesn't meet the requirement.
 * Shows a beautiful "Upgrade to access" UI.
 */
export function PaywallGuard({
    featureName,
    requiredPlan,
    currentPlan = "starter", // Default to starter mock
    children,
    fallbackType = "card"
}: PaywallGuardProps) {
    const [modalOpen, setModalOpen] = useState(false);

    // Simple hierarchy for plans
    const planLevel = { starter: 1, professional: 2, enterprise: 3 };
    const currentLevel = planLevel[currentPlan as keyof typeof planLevel] || 1;
    const requiredLevel = planLevel[requiredPlan as keyof typeof planLevel] || 2;

    const hasAccess = currentLevel >= requiredLevel;

    if (hasAccess) {
        return <>{children}</>;
    }

    // Content for the paywall
    const paywallContent = (
        <div className={cn(
            "flex flex-col items-center justify-center text-center p-8 bg-gradient-to-b from-white to-slate-50 border border-slate-100",
            fallbackType === "card" && "rounded-2xl shadow-sm",
            fallbackType === "inline" && "rounded-xl py-6"
        )}>
            <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 relative shadow-inner">
                <Lock className="h-6 w-6" />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                    <Crown className="h-4 w-4 text-[hsl(173,80%,40%)]" />
                </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
                Recurso Exclusivo {requiredPlan === "professional" ? "Professional" : "Enterprise"}
            </h3>

            <p className="text-sm text-slate-500 max-w-[280px] mb-6 leading-relaxed">
                A funcionalidade <strong className="font-semibold text-slate-700">{featureName}</strong> está disponível apenas no plano {requiredPlan === "professional" ? "Professional" : "Enterprise"}.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-[300px]">
                <Link
                    href="/pricing"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[hsl(173,80%,40%)] hover:bg-[hsl(173,80%,35%)] text-white text-sm font-bold rounded-xl shadow-lg shadow-[hsl(173,80%,40%)]/20 transition-all hover:-translate-y-0.5"
                >
                    Fazer Upgrade
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </div>
    );

    if (fallbackType === "modal") {
        return (
            <>
                <div onClick={() => setModalOpen(true)} className="cursor-pointer group relative">
                    <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                            <Lock className="h-3 w-3" /> Requere Upgrade
                        </span>
                    </div>
                    <div className="pointer-events-none opacity-50 blur-[2px] transition-all group-hover:blur-sm">
                        {children}
                    </div>
                </div>

                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
                        <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-20"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            {paywallContent}
                        </div>
                    </div>
                )}
            </>
        );
    }

    return paywallContent;
}
