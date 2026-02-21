"use client";

import { useAppState } from "@/components/state-provider";
import { useLiveMetrics } from "@/hooks/use-live-metrics";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, Briefcase, GraduationCap, TrendingUp, UserCheck, ShieldAlert, Activity, DollarSign, TrendingDown } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

export default function GeneralDashboardPage() {
    const { state } = useAppState();
    const { data: liveMetrics, loading: metricsLoading } = useLiveMetrics();

    const metrics = useMemo(() => {
        // Use real DB data if available, else derive from hydrated state
        const totalPeople = metricsLoading
            ? state.people.filter(p => p.status === "ATIVO" || p.status === "FERIAS").length
            : liveMetrics.headcount.total;
        const activeFreelas = metricsLoading
            ? state.people.filter(p => p.type === "FREELA" && p.status === "ATIVO").length
            : (liveMetrics.byTipo.find(t => t.tipo === "FREELA")?.count ?? 0);
        const afastados = metricsLoading
            ? state.people.filter(p => p.status === "AFASTADO").length
            : liveMetrics.headcount.afastado;
        const lowPerformance = state.people.filter(p => p.performance?.dia === "VERMELHO").length;

        return {
            totalPeople,
            activeFreelas,
            pendingPayments: afastados,
            lowPerformance,
            totalUnits: state.units.length,
            totalTeams: state.teams.length,
            burnRate: metricsLoading ? 0 : liveMetrics.burnRateMonthly,
            openVacancies: metricsLoading ? 0 : liveMetrics.openVacancies,
            recentHires: metricsLoading ? 0 : liveMetrics.recentHires,
            turnoverPct: metricsLoading ? 0 : liveMetrics.turnoverPct,
        };
    }, [state, liveMetrics, metricsLoading]);

    const financialData = useMemo(() => [
        { name: "Folha CLT", value: Math.round(metrics.burnRate * 0.8), color: "#10b981" },
        { name: "Freelancers (Pix)", value: Math.round(metrics.burnRate * 0.2), color: "#3b82f6" },
        { name: "Orçamento Restante", value: Math.max(0, 120000 - metrics.burnRate), color: "#e2e8f0" },
    ], [metrics.burnRate]);

    const hiringData = useMemo(() => [
        { month: "Jan", admissoes: 4, desligamentos: 1 },
        { month: "Fev", admissoes: 3, desligamentos: 2 },
        { month: "Mar", admissoes: 5, desligamentos: 1 },
        { month: "Abr", admissoes: 2, desligamentos: 3 },
        { month: "Mai", admissoes: 6, desligamentos: 0 },
        { month: "Jun", admissoes: metrics.recentHires, desligamentos: liveMetrics.headcount.desligado },
    ], [metrics.recentHires, liveMetrics]);

    const recentActivities = [
        { id: 1, text: `Headcount atual: ${metrics.totalPeople} colaboradores ativos`, time: "Agora", color: "bg-emerald-500" },
        { id: 2, text: `${metrics.openVacancies} vagas abertas aguardando preenchimento`, time: "Agora", color: "bg-blue-500" },
        { id: 3, text: `${metrics.recentHires} admissões nos últimos 90 dias`, time: "Últimos 90 dias", color: "bg-indigo-500" },
        { id: 4, text: `Burn rate estimado: R$ ${metrics.burnRate.toLocaleString("pt-BR")} / mês`, time: "Estimativa", color: "bg-amber-500" },
    ];

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
                            <CardTitle className="text-sm font-medium text-muted-foreground">Headcount Total</CardTitle>
                            <Users className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metricsLoading ? "—" : metrics.totalPeople}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {metrics.activeFreelas} freelancers ativos
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover:border-amber-500/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Burn Rate Mensal</CardTitle>
                            <DollarSign className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                                {metricsLoading ? "—" : `R$ ${(metrics.burnRate / 1000).toFixed(0)}k`}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                estimativa mês atual
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover:border-rose-500/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Afastados</CardTitle>
                            <TrendingDown className="h-4 w-4 text-rose-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-rose-600 dark:text-rose-500">
                                {metricsLoading ? "—" : liveMetrics.headcount.afastado + liveMetrics.headcount.ferias}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                em férias ou afastamento
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="hover:border-blue-500/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Vagas Abertas</CardTitle>
                            <Briefcase className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metricsLoading ? "—" : metrics.openVacancies}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {metrics.recentHires} admissões em 90 dias
                            </p>
                        </CardContent>
                    </Card>

                </div>


                {/* Command Center: Dense Data Layer */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                    {/* Burn Rate vs Budget */}
                    <Card className="col-span-1 border-border shadow-sm">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-bold text-foreground">Burn Rate vs Orçamento</CardTitle>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Consumo financeiro Mês Atual</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={financialData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {financialData.map((entry, index) => (
                                                <Cell key={"cell-" + index} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(value: any) => "R$ " + value} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 space-y-2">
                                {financialData.map(item => (
                                    <div key={item.name} className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-muted-foreground">{item.name}</span>
                                        </div>
                                        <span className="font-medium text-foreground">R$ {item.value.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hiring vs Turnover Trend */}
                    <Card className="col-span-1 lg:col-span-2 border-border shadow-sm">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-bold text-foreground">Retenção: Admissões x Desligamentos</CardTitle>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Histórico Semestral (Turnover)</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[260px] w-full mt-4 text-xs">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={hiringData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickFormatter={(val) => val} />
                                        <YAxis tickLine={false} axisLine={false} />
                                        <RechartsTooltip cursor={{ fill: 'hsl(var(--muted)/0.5)' }} />
                                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                        <Bar dataKey="admissoes" name="Admissões" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                                        <Bar dataKey="desligamentos" name="Desligamentos" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-2">
                    {/* Activity Feed */}
                    <Card className="col-span-1 border-border shadow-sm bg-muted/20">
                        <CardHeader className="pb-2 border-b border-border/50">
                            <CardTitle className="text-[11px] font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-wide">
                                <Activity className="h-3.5 w-3.5" />
                                Feed Ativo (Tempo Real)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <ul className="space-y-4">
                                {recentActivities.map(activity => (
                                    <li key={activity.id} className="relative pl-4">
                                        <div className={"absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full " + activity.color} />
                                        <p className="text-xs font-medium text-foreground/80 leading-snug">{activity.text}</p>
                                        <p className="text-[9px] text-muted-foreground mt-1">{activity.time}</p>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4 pt-3 border-t border-border/50 text-center">
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline">Ver Audit Log Completo &rarr;</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions / Navigation Widgets are pushed to span-3 */}
                    <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">

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
            </div>
        </>
    );
}
