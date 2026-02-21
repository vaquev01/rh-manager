"use client";

import { useAppState } from "@/components/state-provider";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, Briefcase, GraduationCap, TrendingUp, UserCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function GeneralDashboardPage() {
    const { state } = useAppState();

    const metrics = useMemo(() => {
        const totalPeople = state.people.filter(p => p.status !== "AFASTADO").length;
        const activeFreelas = state.people.filter(p => p.type === "FREELA" && p.status === "ATIVO").length;

        // Simulating alerts from schedule/payments (Mock for now since payments logic is inside Escala)
        const pendingPayments = 4; // Placeholder

        // Performance overview
        const lowPerformance = state.people.filter(p => p.performance.dia === "VERMELHO").length;

        return {
            totalPeople,
            activeFreelas,
            pendingPayments,
            lowPerformance,
            totalUnits: state.units.length,
            totalTeams: state.teams.length
        };
    }, [state]);

    return (
        <>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">

                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Panorama Executivo</h1>
                    <p className="text-sm text-muted-foreground">
                        Visão geral da operação em tempo real.
                    </p>
                </div>

                {/* Top KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                    <Card className="hover:border-emerald-500/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Headcount Ativo</CardTitle>
                            <Users className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.totalPeople}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {metrics.activeFreelas} freelancers hoje
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover:border-amber-500/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Alertas de Pagamento</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">{metrics.pendingPayments}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                pagamentos pendentes
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover:border-rose-500/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Atenção Crítica</CardTitle>
                            <ShieldAlert className="h-4 w-4 text-rose-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-rose-600 dark:text-rose-500">{metrics.lowPerformance}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                funcionários com sinal vermelho
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover:border-blue-500/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Saúde do Recrutamento</CardTitle>
                            <Briefcase className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">2</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                vagas em SLA estourado
                            </p>
                        </CardContent>
                    </Card>

                </div>

                {/* Quick Actions / Navigation Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">

                    <div className="col-span-1 border rounded-xl p-5 bg-card flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg text-emerald-700 dark:text-emerald-400">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Escala e Custo</h3>
                                <p className="text-xs text-muted-foreground">Gerencie plantões e preveja custos</p>
                            </div>
                        </div>
                        <Link href="/escala" className="button primary mt-auto w-full justify-center">
                            Abrir Mapa da Escala
                        </Link>
                    </div>

                    <div className="col-span-1 border rounded-xl p-5 bg-card flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-700 dark:text-indigo-400">
                                <UserCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Controle de Equipe</h3>
                                <p className="text-xs text-muted-foreground">Admissões, contratos e diretório</p>
                            </div>
                        </div>
                        <Link href="/equipe" className="button outline mt-auto w-full justify-center">
                            Acessar Cadastro
                        </Link>
                    </div>

                    <div className="col-span-1 border rounded-xl p-5 bg-card flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg text-purple-700 dark:text-purple-400">
                                <GraduationCap className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Feedbacks & 1-on-1s</h3>
                                <p className="text-xs text-muted-foreground">Ciclos de acompanhamento</p>
                            </div>
                        </div>
                        <Link href="/desenvolvimento" className="button outline mt-auto w-full justify-center">
                            Analisar Desempenho
                        </Link>
                    </div>

                </div>

            </div>
        </>
    );
}
