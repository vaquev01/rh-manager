"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, BookMarked, Brain, CheckCircle2, Clock3, Inbox, Rocket, Target, UserCheck, ChevronDown, Star } from "lucide-react";
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from "recharts";

import { useToast } from "@/components/toast";

import { useAppState } from "@/components/state-provider";
import { CompetencyRole } from "@/lib/types";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function DesenvolvimentoPage() {
  const {
    state,
    date,
    filters,
    updateTrainingCompletion,
    sendFlashTraining,
    updateOnboardingProgress,
    updatePdiProgress,
    upsertPersonCompetencyScore,
  } = useAppState();

  const [flashRecipients, setFlashRecipients] = useState<number>(0);
  const { toast } = useToast();

  // Map of selectedPersonId per role card
  const [selectedPersonByRole, setSelectedPersonByRole] = useState<Record<string, string>>({});
  // Local draft feedback edits: key = `${personId}:${competencyId}`
  const [feedbackDraft, setFeedbackDraft] = useState<Record<string, string>>({});
  // Local draft scores: key = `${personId}:${competencyId}`
  const [scoreDraft, setScoreDraft] = useState<Record<string, number>>({});

  const roleById = useMemo(
    () => Object.fromEntries(state.roles.map((role) => [role.id, role])),
    [state.roles]
  );
  const personById = useMemo(
    () => Object.fromEntries(state.people.map((person) => [person.id, person])),
    [state.people]
  );
  const trainingById = useMemo(
    () => Object.fromEntries(state.trainings.map((training) => [training.id, training])),
    [state.trainings]
  );
  const onboardingItemById = useMemo(
    () => Object.fromEntries(state.onboardingItems.map((item) => [item.id, item])),
    [state.onboardingItems]
  );

  const filteredPeople = useMemo(() => {
    return state.people.filter((person) => {
      if (filters.companyId && person.companyId !== filters.companyId) {
        return false;
      }
      if (filters.unitId && person.unitId !== filters.unitId) {
        return false;
      }
      if (filters.teamId && person.teamId !== filters.teamId) {
        return false;
      }
      if (filters.cargoId && person.cargoId !== filters.cargoId) {
        return false;
      }
      return true;
    });
  }, [state.people, filters]);
  const filteredPersonIds = useMemo(
    () => new Set(filteredPeople.map((person) => person.id)),
    [filteredPeople]
  );
  const filteredCargoIds = useMemo(
    () => new Set(filteredPeople.map((person) => person.cargoId)),
    [filteredPeople]
  );

  const visibleRoles = useMemo(() => {
    return state.roles.filter((role) => {
      if (filters.cargoId) {
        return role.id === filters.cargoId;
      }
      return filteredCargoIds.has(role.id);
    });
  }, [state.roles, filters.cargoId, filteredCargoIds]);

  const visibleTrainings = useMemo(() => {
    return state.trainings.filter((training) => {
      if (filters.cargoId && training.cargoId !== filters.cargoId) {
        return false;
      }
      if (!filteredCargoIds.has(training.cargoId)) {
        return false;
      }
      return true;
    });
  }, [state.trainings, filters.cargoId, filteredCargoIds]);

  const competenciesByRole = useMemo(() => {
    const map = new Map<string, CompetencyRole[]>();
    state.competencies.forEach((competency) => {
      const current = map.get(competency.cargoId) ?? [];
      current.push(competency);
      map.set(competency.cargoId, current);
    });
    return map;
  }, [state.competencies]);

  // Index saved person scores by personId + competencyId
  const scoreIndex = useMemo(() => {
    const idx: Record<string, { score: number; feedback?: string }> = {};
    state.personCompetencyScores.forEach((s) => {
      idx[`${s.personId}:${s.competencyId}`] = { score: s.score, feedback: s.feedback };
    });
    return idx;
  }, [state.personCompetencyScores]);

  const trainingRows = useMemo(() => {
    return state.trainingCompletions.map((completion) => {
      const training = trainingById[completion.trainingId];
      const person = personById[completion.personId];
      if (!training || !person) {
        return null;
      }
      if (!filteredPersonIds.has(person.id)) {
        return null;
      }
      if (filters.cargoId && training.cargoId !== filters.cargoId) {
        return null;
      }
      return {
        completion,
        training,
        person
      };
    });
  }, [state.trainingCompletions, trainingById, personById, filteredPersonIds, filters.cargoId]);

  const onboardingRows = useMemo(() => {
    return state.onboardingProgress.map((progress) => {
      const item = onboardingItemById[progress.onboardingItemId];
      const person = personById[progress.personId];
      const role = item ? roleById[item.cargoId] : undefined;
      if (!item || !person) {
        return null;
      }
      if (!filteredPersonIds.has(person.id)) {
        return null;
      }
      if (filters.cargoId && item.cargoId !== filters.cargoId) {
        return null;
      }
      return {
        progress,
        item,
        person,
        role
      };
    });
  }, [state.onboardingProgress, onboardingItemById, personById, roleById, filteredPersonIds, filters.cargoId]);

  const visiblePdiItems = useMemo(() => {
    return state.pdiItems.filter((item) => filteredPersonIds.has(item.personId));
  }, [state.pdiItems, filteredPersonIds]);

  const onboardingByPerson = useMemo(() => {
    const map = new Map<string, { total: number; done: number; late: number }>();
    onboardingRows.forEach((entry) => {
      if (!entry) return;
      const key = entry.person.id;
      const prev = map.get(key) ?? { total: 0, done: 0, late: 0 };
      prev.total += 1;
      if (entry.progress.status === "CONCLUIDO") prev.done += 1;
      if (entry.progress.status === "ATRASADO") prev.late += 1;
      map.set(key, prev);
    });
    return map;
  }, [onboardingRows]);

  return (
    <div className="page-enter space-y-4">
      {/* ── MATRIZ DE COMPETÊNCIAS ─────────────────────────────── */}
      <section className="panel p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
            <Brain className="h-4 w-4 text-sky-500" />
            Matriz de competências por cargo
          </h2>
          <span className="text-[11px] text-muted-foreground">Selecione um colaborador para ver aderência vs. perfil ideal</span>
        </div>

        <div className="mt-2 grid gap-4 md:grid-cols-2">
          {visibleRoles.map((role) => {
            const competencies = competenciesByRole.get(role.id) ?? [];
            const peopleForRole = filteredPeople.filter(p => p.cargoId === role.id);
            const selectedPersonId = selectedPersonByRole[role.id] ?? "";
            const selectedPerson = selectedPersonId ? personById[selectedPersonId] : null;

            // Build radar data merging ideal + person scores
            const radarData = competencies.map(c => {
              const draftKey = `${selectedPersonId}:${c.id}`;
              const savedEntry = scoreIndex[`${selectedPersonId}:${c.id}`];
              const personScore = scoreDraft[draftKey] ?? savedEntry?.score ?? null;
              return {
                subject: c.competencia.length > 14 ? c.competencia.slice(0, 14) + "…" : c.competencia,
                fullLabel: c.competencia,
                ideal: c.peso,
                pessoa: personScore,
                fullMark: 5,
              };
            });

            // Global adherence % (only for competencies where person has a score)
            const scoredComps = radarData.filter(d => d.pessoa !== null);
            const adherencePct = scoredComps.length > 0
              ? Math.round(scoredComps.reduce((sum, d) => sum + Math.min(d.pessoa! / d.ideal, 1), 0) / scoredComps.length * 100)
              : null;

            return (
              <article key={role.id} className="rounded-xl border border-border bg-background p-4 space-y-3">
                {/* Role header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">{role.nome}</p>
                    <p className="text-[11px] text-muted-foreground">{role.familia} · {role.nivel}</p>
                  </div>
                  {adherencePct !== null && (
                    <div className={`flex flex-col items-center px-2.5 py-1 rounded-lg text-[11px] font-bold ${adherencePct >= 80 ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : adherencePct >= 60 ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"}`}>
                      <span className="text-base font-black leading-none">{adherencePct}%</span>
                      <span className="text-[9px] uppercase tracking-wide font-semibold opacity-70">aderência</span>
                    </div>
                  )}
                </div>

                {/* Person selector */}
                <div className="flex gap-2 items-center">
                  <Select
                    value={selectedPersonId}
                    onValueChange={(val) => setSelectedPersonByRole(prev => ({ ...prev, [role.id]: val }))}
                  >
                    <SelectTrigger className="h-7 text-[11px] flex-1 bg-muted/40 border-border/60">
                      <SelectValue placeholder="Sobrepor colaborador…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" className="text-[11px] text-muted-foreground italic">— Somente perfil ideal —</SelectItem>
                      {peopleForRole.map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-[11px]">
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {competencies.length > 0 ? (
                  <>
                    {/* Radar chart */}
                    <div className="w-full h-[210px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="68%">
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                          <Radar name="Perfil Ideal" dataKey="ideal" stroke="#0ea5e9" fill="#38bdf8" fillOpacity={0.25} strokeWidth={2} />
                          {selectedPerson && (
                            <Radar name={selectedPerson.nome.split(" ")[0]} dataKey="pessoa" stroke="#f59e0b" fill="#fcd34d" fillOpacity={0.35} strokeWidth={2} strokeDasharray="4 2" />
                          )}
                          {selectedPerson && <Legend wrapperStyle={{ fontSize: 10 }} />}
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Competency breakdown + edit */}
                    <ul className="w-full space-y-2.5">
                      {competencies.map((c) => {
                        const draftKey = `${selectedPersonId}:${c.id}`;
                        const savedEntry = scoreIndex[`${selectedPersonId}:${c.id}`];
                        const personScore = scoreDraft[draftKey] ?? savedEntry?.score;
                        const fbKey = `${selectedPersonId}:${c.id}:fb`;
                        const fbDraft = feedbackDraft[fbKey] ?? savedEntry?.feedback ?? "";
                        const adh = personScore !== undefined ? Math.round(Math.min(personScore / c.peso, 1) * 100) : null;

                        return (
                          <li key={c.id} className="border-b border-border/40 pb-2.5 last:border-0 last:pb-0">
                            {/* Row 1: label + score slider + adherence badge */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] font-semibold text-foreground flex-1 truncate" title={c.criterioObservavel}>
                                {c.competencia}
                              </span>
                              <span className="text-[9px] text-muted-foreground font-mono bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded shrink-0">
                                meta P{c.peso}
                              </span>
                              {adh !== null && (
                                <Badge className={`text-[9px] px-1.5 py-0 h-4 rounded font-bold shrink-0 ${adh >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : adh >= 60 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                                  {adh}%
                                </Badge>
                              )}
                            </div>

                            {/* Score dots — only if person selected */}
                            {selectedPersonId && (
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <span className="text-[9px] text-muted-foreground w-8 shrink-0">Score:</span>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map(v => (
                                    <button
                                      key={v}
                                      onClick={() => setScoreDraft(p => ({ ...p, [draftKey]: v }))}
                                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all ${(scoreDraft[draftKey] ?? savedEntry?.score ?? 0) >= v ? "bg-amber-400 border-amber-400 text-white" : "border-border bg-muted/40 text-muted-foreground hover:border-amber-300"}`}
                                    >
                                      {v}
                                    </button>
                                  ))}
                                </div>
                                {scoreDraft[draftKey] !== undefined && (
                                  <button
                                    onClick={() => {
                                      upsertPersonCompetencyScore(selectedPersonId, c.id, scoreDraft[draftKey], feedbackDraft[fbKey]);
                                      toast(`Score salvo para ${selectedPerson?.nome.split(" ")[0]}`, "success");
                                    }}
                                    className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                                  >
                                    Salvar
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Feedback textarea — only if person selected */}
                            {selectedPersonId && (
                              <textarea
                                rows={1}
                                placeholder="Feedback / observação…"
                                value={fbDraft}
                                onChange={e => setFeedbackDraft(p => ({ ...p, [fbKey]: e.target.value }))}
                                onBlur={() => {
                                  if (personScore !== undefined) {
                                    upsertPersonCompetencyScore(selectedPersonId, c.id, personScore, feedbackDraft[fbKey] || undefined);
                                  }
                                }}
                                className="w-full resize-none text-[10px] py-1 px-1.5 rounded border border-border/50 bg-muted/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                              />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border py-4 mt-2 text-center">
                    <Inbox className="h-5 w-5 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground/70">Sem competências cadastradas.</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>


      <section className="grid gap-4 xl:grid-cols-[1.2fr,1fr]">
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
              <BookMarked className="h-4 w-4" />
              Treinamentos por cargo e pessoa
            </h3>
            <p className="text-xs text-muted-foreground">
              Treinamento relampago enviado para <strong>{flashRecipients}</strong> pessoa(s)
            </p>
          </div>

          <div className="mb-3 grid gap-2 md:grid-cols-3">
            {visibleTrainings.map((training) => (
              <button
                key={training.id}
                className="button"
                onClick={() => {
                  const count = sendFlashTraining(training.id);
                  setFlashRecipients(count);
                  toast(`Treinamento relâmpago enviado para ${count} pessoa(s)`, count > 0 ? "success" : "info");
                }}
              >
                Enviar relampago: {training.nome}
              </button>
            ))}
          </div>

          <div className="max-h-[420px] overflow-auto">
            <table className="table-zebra min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="px-2 py-2">Pessoa</th>
                  <th scope="col" className="px-2 py-2">Treinamento</th>
                  <th scope="col" className="px-2 py-2">Cargo</th>
                  <th scope="col" className="px-2 py-2">Obrigatório</th>
                  <th scope="col" className="px-2 py-2">Status</th>
                  <th scope="col" className="px-2 py-2">Concluido em</th>
                </tr>
              </thead>
              <tbody>
                {trainingRows.map((entry) => {
                  if (!entry) {
                    return null;
                  }
                  const { completion, training, person } = entry;
                  return (
                    <tr key={completion.id} className="border-b border-border/50">
                      <td className="px-2 py-2 text-foreground/90">{person?.nome ?? completion.personId}</td>
                      <td className="px-2 py-2 text-foreground/90">{training?.nome ?? completion.trainingId}</td>
                      <td className="px-2 py-2 text-foreground/90">
                        {training ? roleById[training.cargoId]?.nome : "-"}
                      </td>
                      <td className="px-2 py-2 text-foreground/90">
                        {training?.obrigatorio ? "Sim" : "Recomendado"}
                      </td>
                      <td className="px-2 py-2">
                        <select
                          className="select"
                          value={completion.status}
                          onChange={(event) =>
                            updateTrainingCompletion(
                              completion.id,
                              event.target.value as "PENDENTE" | "EM_DIA" | "VENCIDO"
                            )
                          }
                        >
                          <option value="PENDENTE">Pendente</option>
                          <option value="EM_DIA">Em dia</option>
                          <option value="VENCIDO">Vencido</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 text-foreground/90">{completion.concluidoEm ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel p-4">
          <h3 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
            <Rocket className="h-4 w-4" />
            Onboarding por cargo (1/7/14/30/60/90)
          </h3>

          <ul className="mt-3 max-h-[420px] space-y-2 overflow-auto text-xs text-muted-foreground/90">
            {onboardingRows.map((entry) => {
              if (!entry) {
                return null;
              }
              const { progress, item, person, role } = entry;
              const personStats = onboardingByPerson.get(person.id);
              const progressPct = personStats && personStats.total > 0 ? personStats.done / personStats.total : 0;
              return (
                <li key={progress.id} className={`rounded-xl border p-3 ${progress.status === "CONCLUIDO" ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20/40" : progress.status === "ATRASADO" ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20/30 dark:bg-red-900/10" : "border-border bg-background"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground/90">{person?.nome ?? progress.personId}</p>
                    <div className="flex items-center gap-2">
                      {progress.status === "CONCLUIDO" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                      {progress.status === "ATRASADO" && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                      {progress.status === "PENDENTE" && <Clock3 className="h-3.5 w-3.5 text-muted-foreground/70" />}
                      <span className={`badge ${progress.status === "CONCLUIDO" ? "badge-ok" : progress.status === "ATRASADO" ? "badge-danger" : "badge-info"}`}>
                        {progress.status === "CONCLUIDO" ? "Concluido" : progress.status === "ATRASADO" ? "Atrasado" : "Pendente"}
                      </span>
                    </div>
                  </div>
                  {personStats && (
                    <div className="mt-4 mb-3">
                      <div className="flex items-center justify-between relative px-2 mb-1.5">
                        <div className="absolute left-3 right-3 top-1/2 h-1 bg-muted -translate-y-1/2 -z-10 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 dark:bg-blue-600 transition-all duration-500" style={{ width: `${Math.round(progressPct * 100)}%` }} />
                        </div>
                        {[1, 7, 14, 30, 90].map((day, idx) => {
                          const dotProgress = idx / 4;
                          const isPast = progressPct >= dotProgress;
                          const isCurrent = progressPct < dotProgress && progressPct >= (idx - 1) / 4;

                          return (
                            <div key={day} className="flex flex-col items-center gap-1 bg-transparent z-10">
                              <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center bg-background transition-all ${isPast ? 'border-blue-500 dark:border-blue-600' : isCurrent ? 'border-blue-400 dark:border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.2)]' : 'border-muted text-transparent'}`}>
                                {isPast && <div className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-600" />}
                              </div>
                              <span className={`text-[9px] font-semibold tracking-tight ${isPast ? 'text-blue-600 dark:text-blue-400' : isCurrent ? 'text-foreground' : 'text-muted-foreground/50'}`}>D{day}</span>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground/80 font-medium px-1">
                        <span>Trilha de Onboarding</span>
                        <span>{personStats.done} / {personStats.total}</span>
                      </div>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cargo: {role?.nome ?? "-"} · Marco: D+{item?.marcoDia ?? "?"} · Owner: {item?.ownerRole}
                  </p>
                  <p className="text-xs text-muted-foreground">Tarefa: {item?.titulo ?? "Item onboarding"}</p>

                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <select
                      className="select"
                      value={progress.status}
                      onChange={(event) =>
                        updateOnboardingProgress(
                          progress.id,
                          event.target.value as "PENDENTE" | "CONCLUIDO" | "ATRASADO",
                          progress.evidencia
                        )
                      }
                    >
                      <option value="PENDENTE">Pendente</option>
                      <option value="CONCLUIDO">Concluido</option>
                      <option value="ATRASADO">Atrasado</option>
                    </select>

                    <input
                      className="input"
                      value={progress.evidencia ?? ""}
                      placeholder="Evidencia"
                      onChange={(event) =>
                        updateOnboardingProgress(progress.id, progress.status, event.target.value)
                      }
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="panel p-4">
        <h3 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
          <Target className="h-4 w-4" />
          PDI individual (lacuna → acao → prazo → responsavel)
        </h3>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {visiblePdiItems.map((item) => {
            const person = personById[item.personId];
            const manager = personById[item.responsavelPersonId];
            const pdiAtrasado = item.prazo < date;
            const pdiConcluido = item.evolucao.trim().length > 20;
            return (
              <article key={item.id} className={`rounded-xl border p-3 text-sm ${pdiConcluido ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20/40" : pdiAtrasado ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20/30 dark:bg-red-900/10" : "border-border bg-background"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground/90">{person?.nome ?? item.personId}</p>
                  <span className={`badge ${pdiConcluido ? "badge-ok" : pdiAtrasado ? "badge-danger" : "badge-info"}`}>
                    {pdiConcluido ? "Evoluindo" : pdiAtrasado ? "Atrasado" : "No prazo"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Responsavel: {manager?.nome ?? item.responsavelPersonId}</p>
                <p className="mt-2 text-muted-foreground/90">Lacuna: {item.lacuna}</p>
                <p className="text-muted-foreground/90">Acao: {item.acao}</p>
                <p className="text-muted-foreground/90">Prazo: {item.prazo}</p>

                <label className="mt-2 block text-xs text-muted-foreground">
                  Evolucao
                  <textarea
                    className="textarea mt-1"
                    value={item.evolucao}
                    onChange={(event) =>
                      updatePdiProgress(item.id, event.target.value, item.evidencia)
                    }
                  />
                </label>

                <label className="mt-2 block text-xs text-muted-foreground">
                  Evidencia
                  <input
                    className="input mt-1"
                    value={item.evidencia ?? ""}
                    placeholder="link, nota ou arquivo"
                    onChange={(event) =>
                      updatePdiProgress(item.id, item.evolucao, event.target.value)
                    }
                  />
                </label>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
