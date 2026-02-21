"use client";

import { useState } from "react";
import { Person } from "@/lib/types";
import { MessageSquare, CalendarPlus, Search, Clock, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
    selectedPersonId: string | null;
    filteredPeople: Person[];
}

export function FeedbackOneOnOneTab({ selectedPersonId, filteredPeople }: Props) {
    const [search, setSearch] = useState("");

    // Minimal mock data for feedback entries
    const [feedbacks, setFeedbacks] = useState([
        { id: "1", personId: filteredPeople[0]?.id, date: "2024-03-01", type: "1-on-1", sentiment: "positive", summary: "Ótimo desempenho no último projeto. Pede mais desafios técnicos." },
        { id: "2", personId: filteredPeople[1]?.id, date: "2024-02-15", type: "Avaliação", sentiment: "neutral", summary: "Atingiu as metas, mas precisa melhorar pontualidade nas daily meetings." },
    ]);

    const [isCreating, setIsCreating] = useState(false);
    const [draft, setDraft] = useState({ personId: selectedPersonId || "", type: "1-on-1", summary: "", sentiment: "positive" });

    const displayList = filteredPeople.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()));
    const visibleFeedbacks = feedbacks.filter(f => selectedPersonId ? f.personId === selectedPersonId : true);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* List / Search Column */}
            <div className="col-span-1 border rounded-xl bg-card flex flex-col h-[600px] overflow-hidden">
                <div className="p-4 border-b bg-muted/10">
                    <h2 className="font-semibold text-sm flex items-center gap-2 mb-3">
                        <MessageSquare className="h-4 w-4" /> Diretório de Pessoas
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar colaborador..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="pl-8 h-8 text-xs bg-background"
                        />
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 p-2 space-y-1">
                    {displayList.map(person => {
                        const fbCount = feedbacks.filter(f => f.personId === person.id).length;
                        const isSelected = selectedPersonId === person.id;

                        return (
                            <div
                                key={person.id}
                                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors border ${isSelected ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" : "border-transparent hover:bg-muted/50"}`}
                            >
                                <div>
                                    <p className="text-sm font-medium">{person.nome}</p>
                                    <p className="text-[10px] text-muted-foreground">{person.type}</p>
                                </div>
                                {fbCount > 0 && (
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                        {fbCount} regs
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* History & Action Column */}
            <div className="col-span-1 lg:col-span-2 flex flex-col gap-4 h-[600px]">
                {/* Toolbar */}
                <div className="border rounded-xl bg-card p-4 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-sm">Registro de 1-on-1s</h3>
                        <p className="text-xs text-muted-foreground">
                            {selectedPersonId ? "Histórico selecionado" : "Mostrando registros recentes de toda a equipe"}
                        </p>
                    </div>
                    <Button size="sm" onClick={() => setIsCreating(true)} className="h-8 gap-1.5 text-xs">
                        <PlusCircle className="h-3.5 w-3.5" />
                        Novo Registro
                    </Button>
                </div>

                {/* Creation Form */}
                {isCreating && (
                    <div className="border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/10 dark:border-emerald-800 rounded-xl p-4 animate-in fade-in slide-in-from-top-4">
                        <h4 className="text-sm font-semibold mb-3">Registrar Feedback</h4>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Colaborador</label>
                                <select
                                    className="w-full h-8 px-2 text-xs rounded border bg-background"
                                    value={draft.personId}
                                    onChange={e => setDraft(p => ({ ...p, personId: e.target.value }))}
                                >
                                    <option value="" disabled>Selecione...</option>
                                    {filteredPeople.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Tipo de Reunião</label>
                                <select
                                    className="w-full h-8 px-2 text-xs rounded border bg-background"
                                    value={draft.type}
                                    onChange={e => setDraft(p => ({ ...p, type: e.target.value }))}
                                >
                                    <option value="1-on-1">1-on-1 de Rotina</option>
                                    <option value="Feedback Direto">Feedback Direto</option>
                                    <option value="Avaliação">Avaliação Formal</option>
                                    <option value="Alinhamento">Alinhamento de Metas</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                                Anotações e Acordos (Ata)
                            </label>
                            <Textarea
                                className="text-xs resize-none h-24 bg-background"
                                placeholder="Pontos discutidos, elogios, construtivos e próximos passos..."
                                value={draft.summary}
                                onChange={e => setDraft(p => ({ ...p, summary: e.target.value }))}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsCreating(false)}>Cancelar</Button>
                            <Button size="sm" className="h-7 text-xs" onClick={() => {
                                if (!draft.personId || !draft.summary) return;
                                setFeedbacks(prev => [{
                                    id: Date.now().toString(),
                                    personId: draft.personId,
                                    date: new Date().toISOString().split('T')[0],
                                    type: draft.type,
                                    sentiment: "positive",
                                    summary: draft.summary
                                }, ...prev]);
                                setIsCreating(false);
                                setDraft({ ...draft, summary: "" });
                            }}>
                                Salvar Histórico
                            </Button>
                        </div>
                    </div>
                )}

                {/* Feedbacks Feed */}
                <div className="flex-1 overflow-y-auto border rounded-xl bg-card p-4 space-y-4">
                    {visibleFeedbacks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-60">
                            <Clock className="h-8 w-8" />
                            <p className="text-sm">Nenhum registro encontrado.</p>
                        </div>
                    ) : (
                        visibleFeedbacks.map(f => {
                            const person = filteredPeople.find(p => p.id === f.personId);
                            return (
                                <div key={f.id} className="p-3 border rounded-lg bg-muted/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">{f.type}</span>
                                            <span className="text-xs font-semibold">{person?.nome || 'Desconhecido'}</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <CalendarPlus className="h-3 w-3" />
                                            {new Date(f.date).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                    <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                        {f.summary}
                                    </p>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

        </div>
    );
}
