"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/components/state-provider";
import { Person } from "@/lib/types";
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain } from "lucide-react";

interface Props {
    selectedPersonId: string | null;
    filteredPeople: Person[];
}

export function CompetencyMatrixTab({ selectedPersonId, filteredPeople }: Props) {
    const { state, upsertPersonCompetencyScore } = useAppState();
    const { toast } = useToast();

    const [scoreDraft, setScoreDraft] = useState<Record<string, number>>({});
    const [feedbackDraft, setFeedbackDraft] = useState<Record<string, string>>({});

    // When a global person is selected, we override the localized role viewer
    const [localPersonByRole, setLocalPersonByRole] = useState<Record<string, string>>({});

    const roleById = useMemo(
        () => Object.fromEntries(state.roles.map((r) => [r.id, r])),
        [state.roles]
    );

    const personById = useMemo(
        () => Object.fromEntries(state.people.map((p) => [p.id, p])),
        [state.people]
    );

    const scoreIndex = useMemo(() => {
        const idx: Record<string, { score: number; feedback?: string }> = {};
        state.personCompetencyScores.forEach((s) => {
            idx[`${s.personId}:${s.competencyId}`] = { score: s.score, feedback: s.feedback };
        });
        return idx;
    }, [state.personCompetencyScores]);

    const competenciesByRole = useMemo(() => {
        const map = new Map<string, any[]>();
        state.competencies.forEach((c) => {
            const current = map.get(c.cargoId) ?? [];
            current.push(c);
            map.set(c.cargoId, current);
        });
        return map;
    }, [state.competencies]);

    const visibleRoles = useMemo(() => {
        if (selectedPersonId) {
            const person = personById[selectedPersonId];
            if (person) {
                return [roleById[person.cargoId]].filter(Boolean);
            }
        }
        return state.roles;
    }, [state.roles, selectedPersonId, personById, roleById]);

    return (
        <section className="panel p-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
                    <Brain className="h-4 w-4 text-sky-500" />
                    Matriz de competências por cargo
                </h2>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">Avalie a aderência ao perfil ideal</span>
            </div>

            <div className="mt-2 grid gap-4 lg:grid-cols-2">
                {visibleRoles.map((role) => {
                    if (!role) return null;
                    const competencies = competenciesByRole.get(role.id) ?? [];
                    const peopleForRole = filteredPeople.filter(p => p.cargoId === role.id);

                    // Use global selected person if applicable, otherwise local
                    const activePersonId = selectedPersonId || localPersonByRole[role.id] || "";
                    const activePerson = activePersonId ? personById[activePersonId] : null;

                    const radarData = competencies.map(c => {
                        const draftKey = `${activePersonId}:${c.id}`;
                        const savedEntry = scoreIndex[`${activePersonId}:${c.id}`];
                        const personScore = scoreDraft[draftKey] ?? savedEntry?.score ?? null;
                        return {
                            subject: c.competencia.length > 14 ? c.competencia.slice(0, 14) + "…" : c.competencia,
                            ideal: c.peso,
                            pessoa: personScore,
                            fullMark: 5,
                        };
                    });

                    const scoredComps = radarData.filter(d => d.pessoa !== null);
                    const adherencePct = scoredComps.length > 0
                        ? Math.round((scoredComps.reduce((sum, d) => sum + Math.min(d.pessoa! / d.ideal, 1), 0) / scoredComps.length) * 100)
                        : null;

                    return (
                        <article key={role.id} className="rounded-xl border border-border bg-background p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-sm font-bold text-foreground">{role.nome}</p>
                                    <p className="text-[11px] text-muted-foreground">{role.familia} · {role.nivel}</p>
                                </div>
                                {adherencePct !== null && (
                                    <div className={`flex flex-col items-center px-2.5 py-1 rounded-lg text-[11px] font-bold ${adherencePct >= 80 ? "bg-emerald-50 text-emerald-700" : adherencePct >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                                        <span className="text-base font-black leading-none">{adherencePct}%</span>
                                        <span className="text-[9px] uppercase tracking-wide opacity-70">aderência</span>
                                    </div>
                                )}
                            </div>

                            {!selectedPersonId && (
                                <Select value={activePersonId} onValueChange={(val) => setLocalPersonByRole(p => ({ ...p, [role.id]: val }))}>
                                    <SelectTrigger className="h-8 text-xs bg-muted/20">
                                        <SelectValue placeholder="Selecione um analista..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none" className="italic text-muted-foreground">Modelo Ideal Apenas</SelectItem>
                                        {peopleForRole.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {competencies.length > 0 && (
                                <>
                                    <div className="w-full h-[200px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
                                                <PolarGrid stroke="#e2e8f0" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9 }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                                                <Radar name="Perfil Ideal" dataKey="ideal" stroke="#0ea5e9" fill="#38bdf8" fillOpacity={0.2} strokeWidth={2} />
                                                {activePerson && <Radar name={activePerson.nome.split(" ")[0]} dataKey="pessoa" stroke="#f59e0b" fill="#fcd34d" fillOpacity={0.4} strokeWidth={2} strokeDasharray="3 3" />}
                                                {activePerson && <Legend wrapperStyle={{ fontSize: 10, paddingTop: "10px" }} />}
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <ul className="space-y-3 pt-2">
                                        {competencies.map(c => {
                                            const dKey = `${activePersonId}:${c.id}`;
                                            const saved = scoreIndex[dKey];
                                            const val = scoreDraft[dKey] ?? saved?.score;
                                            const adh = val !== undefined ? Math.round(Math.min(val / c.peso, 1) * 100) : null;

                                            return (
                                                <li key={c.id} className="border-b pb-3 last:border-0">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="text-xs font-semibold flex-1 truncate">{c.competencia}</span>
                                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 rounded font-mono">P{c.peso}</span>
                                                        {adh !== null && (
                                                            <Badge className={`text-[10px] px-1 h-4 rounded-sm ${adh >= 80 ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}>{adh}%</Badge>
                                                        )}
                                                    </div>

                                                    {activePersonId && activePersonId !== "none" && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex gap-1">
                                                                {[1, 2, 3, 4, 5].map(v => (
                                                                    <button
                                                                        key={v}
                                                                        onClick={() => setScoreDraft(p => ({ ...p, [dKey]: v }))}
                                                                        className={`h-5 w-5 rounded border flex items-center justify-center text-[10px] font-bold transition-all ${val >= v ? "bg-amber-400 border-amber-500 text-white" : "border-border bg-muted/30 text-muted-foreground hover:border-amber-300"}`}
                                                                    >
                                                                        {v}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            {scoreDraft[dKey] !== undefined && (
                                                                <button
                                                                    onClick={() => {
                                                                        upsertPersonCompetencyScore(activePersonId, c.id, scoreDraft[dKey], feedbackDraft[`${dKey}:fb`]);
                                                                        toast("Salvo", "success");
                                                                    }}
                                                                    className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500 text-white hover:bg-emerald-600"
                                                                >
                                                                    Salvar
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </>
                            )}
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
