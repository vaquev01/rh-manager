"use client";

import { Users, Building2, CreditCard, Activity, ArrowUpRight, ArrowDownRight, MoreVertical } from "lucide-react";

export default function AdminDashboard() {
    const stats = [
        { label: "MRR Total", value: "R$ 14.500", change: "+12%", up: true, icon: CreditCard },
        { label: "Tenants Ativos", value: "12", change: "+2", up: true, icon: Building2 },
        { label: "Total Usuários", value: "840", change: "+145", up: true, icon: Users },
        { label: "Health Score", value: "99.8%", change: "-0.1%", up: false, icon: Activity },
    ];

    const recentTenants = [
        { id: "1", name: "Wardogs Eventos", plan: "Professional", mrr: "R$ 497", status: "Active", users: 145 },
        { id: "2", name: "Caraca Bar", plan: "Starter", mrr: "R$ 197", status: "Active", users: 32 },
        { id: "3", name: "Giga Eventos", plan: "Enterprise", mrr: "R$ 1.500", status: "Active", users: 500 },
        { id: "4", name: "Alpha Co", plan: "Starter", mrr: "R$ 0", status: "Trial", users: 5 },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Visão Geral SaaS</h1>
                <p className="text-slate-500 text-sm">Bem-vindo ao backoffice do B People.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-slate-50 rounded-lg">
                                <s.icon className="h-5 w-5 text-slate-600" />
                            </div>
                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${s.up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {s.change}
                            </span>
                        </div>
                        <h3 className="text-slate-500 text-sm font-medium mb-1">{s.label}</h3>
                        <p className="text-2xl font-black text-slate-900">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Recent Tenants Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900">Clientes Recentes (Tenants)</h2>
                    <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">Ver Todos</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Empresa</th>
                                <th className="px-6 py-3 font-medium">Plano</th>
                                <th className="px-6 py-3 font-medium">MRR</th>
                                <th className="px-6 py-3 font-medium">Usuários</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentTenants.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-slate-900">{t.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${t.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' :
                                                t.plan === 'Professional' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-slate-100 text-slate-700'
                                            }`}>
                                            {t.plan}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">{t.mrr}</td>
                                    <td className="px-6 py-4 text-slate-500">{t.users}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${t.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            <span className="text-slate-600 text-xs">{t.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-slate-400 hover:text-slate-600">
                                            <MoreVertical className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
