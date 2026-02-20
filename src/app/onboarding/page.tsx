"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, MapPin, Briefcase, ChevronRight, ChevronLeft, Check, Sparkles } from "lucide-react";

const STEPS = [
    { id: 1, title: "Empresa", desc: "Dados da sua empresa", icon: Building2 },
    { id: 2, title: "Unidades", desc: "Onde sua equipe trabalha", icon: MapPin },
    { id: 3, title: "Cargos", desc: "Funções da operação", icon: Briefcase },
    { id: 4, title: "Equipe", desc: "Primeiros colaboradores", icon: Users },
];

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [data, setData] = useState({
        empresa: { nome: "", cnpj: "", segmento: "" },
        unidades: [{ nome: "" }],
        cargos: [{ nome: "", nivel: "" }],
        pessoas: [{ nome: "", email: "", cargo: "", tipo: "FIXO" }],
    });

    const currentStep = STEPS[step - 1];
    const isLast = step === STEPS.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[hsl(173,80%,97%)] via-white to-[hsl(173,60%,95%)]">
            {/* Top bar */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-slate-100 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-[hsl(173,80%,40%)] flex items-center justify-center">
                            <span className="text-white font-black text-xs">B</span>
                        </div>
                        <span className="font-bold text-sm text-slate-900">Setup Inicial</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">Passo {step}/{STEPS.length}</span>
                </div>
            </div>

            {/* Progress */}
            <div className="max-w-3xl mx-auto px-6 pt-8">
                <div className="flex items-center gap-1 mb-8">
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex-1 flex items-center gap-1">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${s.id === step ? "bg-[hsl(173,80%,40%)] text-white shadow-md" :
                                    s.id < step ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                                }`}>
                                {s.id < step ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                                <span className="hidden sm:inline">{s.title}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 rounded ${s.id < step ? "bg-emerald-300" : "bg-slate-200"}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-xl bg-[hsl(173,80%,40%)]/10 flex items-center justify-center">
                            <currentStep.icon className="h-5 w-5 text-[hsl(173,80%,40%)]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">{currentStep.title}</h2>
                            <p className="text-xs text-slate-500">{currentStep.desc}</p>
                        </div>
                    </div>

                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Nome da Empresa *</label>
                                <input
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-[hsl(173,80%,40%)]/40 focus:border-[hsl(173,80%,40%)] outline-none"
                                    value={data.empresa.nome}
                                    onChange={e => setData(p => ({ ...p, empresa: { ...p.empresa, nome: e.target.value } }))}
                                    placeholder="Ex: Wardogs Eventos"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">CNPJ</label>
                                    <input
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-[hsl(173,80%,40%)]/40 outline-none"
                                        value={data.empresa.cnpj}
                                        onChange={e => setData(p => ({ ...p, empresa: { ...p.empresa, cnpj: e.target.value } }))}
                                        placeholder="00.000.000/0001-00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Segmento</label>
                                    <select
                                        className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-[hsl(173,80%,40%)]/40 outline-none bg-white"
                                        value={data.empresa.segmento}
                                        onChange={e => setData(p => ({ ...p, empresa: { ...p.empresa, segmento: e.target.value } }))}
                                    >
                                        <option value="">Selecione</option>
                                        <option value="eventos">Eventos</option>
                                        <option value="gastronomia">Gastronomia</option>
                                        <option value="varejo">Varejo</option>
                                        <option value="servicos">Serviços</option>
                                        <option value="outro">Outro</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-3">
                            {data.unidades.map((u, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        className="flex-1 h-10 px-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-[hsl(173,80%,40%)]/40 outline-none"
                                        value={u.nome}
                                        onChange={e => { const arr = [...data.unidades]; arr[i] = { nome: e.target.value }; setData(p => ({ ...p, unidades: arr })); }}
                                        placeholder={`Unidade ${i + 1} (ex: Centro, Barra)`}
                                    />
                                </div>
                            ))}
                            <button
                                onClick={() => setData(p => ({ ...p, unidades: [...p.unidades, { nome: "" }] }))}
                                className="text-xs font-semibold text-[hsl(173,80%,40%)] hover:text-[hsl(173,80%,35%)]"
                            >
                                + Adicionar unidade
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-3">
                            {data.cargos.map((c, i) => (
                                <div key={i} className="grid grid-cols-2 gap-2">
                                    <input
                                        className="h-10 px-3 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-[hsl(173,80%,40%)]/40 outline-none"
                                        value={c.nome}
                                        onChange={e => { const arr = [...data.cargos]; arr[i] = { ...arr[i], nome: e.target.value }; setData(p => ({ ...p, cargos: arr })); }}
                                        placeholder="Nome do cargo"
                                    />
                                    <select
                                        className="h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none bg-white"
                                        value={c.nivel}
                                        onChange={e => { const arr = [...data.cargos]; arr[i] = { ...arr[i], nivel: e.target.value }; setData(p => ({ ...p, cargos: arr })); }}
                                    >
                                        <option value="">Nível</option>
                                        <option value="junior">Júnior</option>
                                        <option value="pleno">Pleno</option>
                                        <option value="senior">Sênior</option>
                                        <option value="lideranca">Liderança</option>
                                    </select>
                                </div>
                            ))}
                            <button
                                onClick={() => setData(p => ({ ...p, cargos: [...p.cargos, { nome: "", nivel: "" }] }))}
                                className="text-xs font-semibold text-[hsl(173,80%,40%)] hover:text-[hsl(173,80%,35%)]"
                            >
                                + Adicionar cargo
                            </button>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-3">
                            {data.pessoas.map((p, i) => (
                                <div key={i} className="grid grid-cols-4 gap-2">
                                    <input
                                        className="h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none col-span-1"
                                        value={p.nome}
                                        onChange={e => { const arr = [...data.pessoas]; arr[i] = { ...arr[i], nome: e.target.value }; setData(d => ({ ...d, pessoas: arr })); }}
                                        placeholder="Nome"
                                    />
                                    <input
                                        className="h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none"
                                        value={p.email}
                                        onChange={e => { const arr = [...data.pessoas]; arr[i] = { ...arr[i], email: e.target.value }; setData(d => ({ ...d, pessoas: arr })); }}
                                        placeholder="Email"
                                    />
                                    <select
                                        className="h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none bg-white"
                                        value={p.tipo}
                                        onChange={e => { const arr = [...data.pessoas]; arr[i] = { ...arr[i], tipo: e.target.value }; setData(d => ({ ...d, pessoas: arr })); }}
                                    >
                                        <option value="FIXO">Fixo</option>
                                        <option value="FREELA">Freela</option>
                                    </select>
                                    <select
                                        className="h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none bg-white"
                                        value={p.cargo}
                                        onChange={e => { const arr = [...data.pessoas]; arr[i] = { ...arr[i], cargo: e.target.value }; setData(d => ({ ...d, pessoas: arr })); }}
                                    >
                                        <option value="">Cargo</option>
                                        {data.cargos.filter(c => c.nome).map((c, j) => (
                                            <option key={j} value={c.nome}>{c.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                            <button
                                onClick={() => setData(d => ({ ...d, pessoas: [...d.pessoas, { nome: "", email: "", cargo: "", tipo: "FIXO" }] }))}
                                className="text-xs font-semibold text-[hsl(173,80%,40%)] hover:text-[hsl(173,80%,35%)]"
                            >
                                + Adicionar pessoa
                            </button>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pb-10">
                    <button
                        onClick={() => step > 1 && setStep(step - 1)}
                        disabled={step === 1}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" /> Voltar
                    </button>

                    {isLast ? (
                        <button
                            onClick={() => router.push("/")}
                            className="inline-flex items-center gap-2 bg-[hsl(173,80%,40%)] hover:bg-[hsl(173,80%,35%)] text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg transition-all"
                        >
                            <Sparkles className="h-4 w-4" />
                            Iniciar B People
                        </button>
                    ) : (
                        <button
                            onClick={() => setStep(step + 1)}
                            className="inline-flex items-center gap-1.5 bg-[hsl(173,80%,40%)] hover:bg-[hsl(173,80%,35%)] text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md transition-all"
                        >
                            Próximo <ChevronRight className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
