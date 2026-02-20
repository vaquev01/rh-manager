"use client";

import { useMemo, useState } from "react";
import { AlarmClock, AlertTriangle, CheckCircle2, ClipboardList, Clock3, Inbox, MessageSquareWarning, TimerReset, Users, ChevronRight, LayoutList, LayoutGrid, Zap } from "lucide-react";

import { useToast } from "@/components/toast";
import { useAppState } from "@/components/state-provider";
import { daysBetween } from "@/lib/date";
import { percent } from "@/lib/format";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function RecrutamentoPage() {
  const { state, date, filters, updateRecruitmentStage, chargeDelayedRecruitmentManagers } =
    useAppState();

  const [selectedVagaId, setSelectedVagaId] = useState<string | null>(
    state.recruitmentVagas[0]?.id ?? null
  );
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");
  const [lastChargeCount, setLastChargeCount] = useState<number>(0);
  const { toast } = useToast();

  const vagas = useMemo(() => {
    return state.recruitmentVagas.filter((vaga) => {
      if (filters.companyId && vaga.companyId !== filters.companyId) {
        return false;
      }
      if (filters.unitId && vaga.unitId !== filters.unitId) {
        return false;
      }
      if (filters.teamId && vaga.teamId !== filters.teamId) {
        return false;
      }
      if (filters.cargoId && vaga.cargoId !== filters.cargoId) {
        return false;
      }
      return true;
    });
  }, [state.recruitmentVagas, filters]);

  const vagasView = useMemo(() => {
    return vagas.map((vaga) => {
      const company = state.companies.find((item) => item.id === vaga.companyId);
      const unit = state.units.find((item) => item.id === vaga.unitId);
      const team = state.teams.find((item) => item.id === vaga.teamId);
      const role = state.roles.find((item) => item.id === vaga.cargoId);
      const manager = state.people.find((item) => item.id === vaga.gestorPersonId);
      const doneCount = vaga.checklist.filter((stage) => stage.status === "CONCLUIDA").length;
      const progress = vaga.checklist.length ? doneCount / vaga.checklist.length : 0;
      const delayedStages = vaga.checklist.filter(
        (stage) => stage.prazo < date && stage.status !== "CONCLUIDA"
      );
      const travada = vaga.diasSemAvanco >= 3;
      const stageAtual = vaga.checklist.find((stage) => stage.id === vaga.etapaAtualId);

      return {
        vaga,
        company,
        unit,
        team,
        role,
        manager,
        progress,
        delayedStages,
        travada,
        stageAtual,
        slaDiasAberta: daysBetween(vaga.dataAbertura, date)
      };
    });
  }, [vagas, state, date]);

  const selectedVaga = vagasView.find((item) => item.vaga.id === selectedVagaId) ?? vagasView[0];

  const reportAtrasadasPorGestor = useMemo(() => {
    const map = new Map<string, { gestorNome: string; count: number }>();

    vagasView.forEach((item) => {
      const delayedCount = item.delayedStages.length;
      if (!delayedCount) {
        return;
      }
      const key = item.vaga.gestorPersonId;
      const previous = map.get(key);
      if (previous) {
        previous.count += delayedCount;
        return;
      }
      map.set(key, {
        gestorNome: item.manager?.nome ?? "Gestor nao identificado",
        count: delayedCount
      });
    });

    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [vagasView]);

  const reportTempoMedioPorEtapa = useMemo(() => {
    const stageMap = new Map<string, { stageName: string; totalDias: number; count: number }>();

    vagasView.forEach((item) => {
      item.vaga.checklist.forEach((stage) => {
        const dias = daysBetween(item.vaga.dataAbertura, stage.prazo);
        const current = stageMap.get(stage.id) ?? {
          stageName: stage.nome,
          totalDias: 0,
          count: 0
        };
        current.totalDias += dias;
        current.count += 1;
        stageMap.set(stage.id, current);
      });
    });

    return [...stageMap.values()]
      .map((entry) => ({
        stageName: entry.stageName,
        media: entry.count ? entry.totalDias / entry.count : 0
      }))
      .sort((a, b) => b.media - a.media);
  }, [vagasView]);

  const reportVagasTravadas = useMemo(
    () => vagasView.filter((item) => item.travada || item.delayedStages.length > 0),
    [vagasView]
  );

  const kanbanColumns = useMemo(() => {
    // Collect all distinct stage names currently active
    const stages = new Set<string>();
    vagasView.forEach(v => stages.add(v.stageAtual?.nome ?? "Início"));
    return Array.from(stages);
  }, [vagasView]);

  const totalVagas = vagasView.length;
  const noPrazoCount = vagasView.filter((i) => !i.travada && i.delayedStages.length === 0).length;
  const atrasadasCount = vagasView.filter((i) => i.delayedStages.length > 0).length;
  const slaMedio = totalVagas > 0 ? Math.round(vagasView.reduce((s, i) => s + i.slaDiasAberta, 0) / totalVagas) : 0;

  return (
    <div className="page-enter grid gap-6 xl:grid-cols-[1.35fr,1fr]">
      <section className="space-y-6">
        <div className="kpi-grid">
          <Card className="kpi-card kpi-info border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Total Vagas</span>
                  <p className="text-2xl font-bold text-foreground leading-none mt-1">{totalVagas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="kpi-card kpi-success border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">No Prazo</span>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 leading-none mt-1">{noPrazoCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="kpi-card kpi-danger border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Atrasadas</span>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300 leading-none mt-1">{atrasadasCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="kpi-card kpi-accent border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/20">
                  <Clock3 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">SLA Médio</span>
                  <p className="text-2xl font-bold text-teal-700 dark:text-teal-300 leading-none mt-1">{slaMedio} <span className="text-sm font-medium text-muted-foreground">dias</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border shadow-sm overflow-hidden">
          <CardHeader className="px-6 py-4 border-b border-border/50 bg-background">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-foreground">Pipeline de Vagas</CardTitle>
                <CardDescription className="text-xs text-muted-foreground/70 mt-1">
                  Acompanhamento em tempo real do checklist
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-muted/60 p-1 rounded-md border border-border/50">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-all ${viewMode === "table" ? "bg-background shadow-sm text-foreground font-semibold" : ""}`}
                    title="Modo Tabela"
                  >
                    <LayoutList className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("kanban")}
                    className={`p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-all ${viewMode === "kanban" ? "bg-background shadow-sm text-foreground font-semibold" : ""}`}
                    title="Modo Kanban"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-muted/30 border-border text-foreground/90 hover:bg-muted"
                  onClick={() => {
                    const count = chargeDelayedRecruitmentManagers();
                    setLastChargeCount(count);
                    toast(`Cobrança enviada para ${count} gestor(es)`, count > 0 ? "success" : "info");
                  }}
                >
                  <MessageSquareWarning className="mr-2 h-3.5 w-3.5" />
                  Cobrar Todos
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {viewMode === "table" ? (
              <div className="overflow-auto max-h-[500px]">
                <table className="min-w-full text-left text-xs bg-background">
                  <thead className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th scope="col" className="px-6 py-3 font-semibold text-muted-foreground">Vaga</th>
                      <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground">Gestor</th>
                      <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground">SLA</th>
                      <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground">Etapa Atual</th>
                      <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground">Progresso</th>
                      <th scope="col" className="px-4 py-3 font-semibold text-muted-foreground text-right w-[160px]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vagasView.map((item) => (
                      <tr
                        key={item.vaga.id}
                        className={`group cursor-pointer hover:bg-muted/50 transition-all duration-200 ${selectedVaga?.vaga.id === item.vaga.id ? "bg-blue-50 dark:bg-blue-900/20/60 dark:bg-blue-900/20 hover:bg-blue-50 dark:bg-blue-900/20/80 dark:bg-blue-900/40" : ""
                          }`}
                        onClick={() => setSelectedVagaId(item.vaga.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground text-sm mb-0.5">{item.role?.nome ?? "Cargo Indefinido"}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {item.company?.nome} · {item.unit?.nome}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                              {item.manager?.nome.charAt(0)}
                            </div>
                            <span className="text-foreground/90 font-medium">{item.manager?.nome.split(' ')[0] ?? "Gestor"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground/90 font-mono text-[10px]">
                          {item.vaga.dataAbertura} <span className="text-muted-foreground/40 mx-1">|</span> {item.slaDiasAberta}d
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                            <span className="text-foreground/90">{item.stageAtual?.nome ?? "Início"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 w-32">
                          <div className="space-y-1.5">
                            <Progress value={item.progress * 100} className="h-1.5 bg-muted" />
                            <p className="text-[10px] text-right font-medium text-muted-foreground">{percent(item.progress)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {item.delayedStages.length > 0 ? (
                            <div className="flex items-center justify-end gap-2 text-right">
                              <Badge variant="danger" className="h-6 px-2">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {item.delayedStages.length} Atraso
                              </Badge>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 rounded border border-transparent hover:border-orange-200 bg-orange-100/50 hover:bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-400 transition-colors shadow-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast(`Cobrança enviada pelo WhatsApp para ${item.manager?.nome}`, "success");
                                }}
                                title="Cobrar Gestor via WhatsApp"
                              >
                                <Zap className="h-3 w-3 fill-orange-500 text-orange-500" />
                              </Button>
                            </div>
                          ) : item.travada ? (
                            <Badge variant="warn" className="h-6 px-2">Travada</Badge>
                          ) : (
                            <Badge variant="ok" className="h-6 px-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200">No Prazo</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex gap-4 p-5 overflow-x-auto min-h-[400px] items-start bg-slate-50/50 dark:bg-muted/10">
                {kanbanColumns.map(col => {
                  const colItems = vagasView.filter(v => (v.stageAtual?.nome ?? "Início") === col);
                  return (
                    <div key={col} className="flex-shrink-0 w-80 flex flex-col gap-3">
                      <div className="flex items-center justify-between uppercase tracking-wider text-[10.5px] font-bold text-muted-foreground mr-2 px-1">
                        <span>{col}</span>
                        <Badge variant="secondary" className="h-5 px-1.5 text-[9px] bg-white dark:bg-background border-border shadow-sm">{colItems.length}</Badge>
                      </div>
                      <div className="flex flex-col gap-3 pb-2">
                        {colItems.map(item => (
                          <div
                            key={item.vaga.id}
                            draggable
                            onClick={() => setSelectedVagaId(item.vaga.id)}
                            className={`bg-background border rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow-md transition-all duration-200 ${selectedVagaId === item.vaga.id ? 'ring-2 ring-blue-500/30 border-blue-400 shadow-md transform -translate-y-0.5' : 'border-border shadow-sm'}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold text-sm text-foreground">{item.role?.nome ?? "Cargo Indefinido"}</h4>
                                <p className="text-[10px] text-muted-foreground/80 mt-0.5">{item.company?.nome} · {item.unit?.nome}</p>
                              </div>
                              <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-muted border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-sm" title={item.manager?.nome}>
                                {item.manager?.nome.charAt(0)}
                              </div>
                            </div>

                            <div className="mt-3 mb-1">
                              <div className="flex justify-between text-[9px] font-bold text-muted-foreground mb-1 uppercase tracking-wide">
                                <span>Checklist</span>
                                <span>{percent(item.progress)}</span>
                              </div>
                              <Progress value={item.progress * 100} className="h-1.5 bg-muted/70" />
                            </div>

                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/60">
                              <span className="text-[10px] font-mono text-muted-foreground">{item.slaDiasAberta}d aberto</span>
                              {item.delayedStages.length > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="danger" className="h-5 px-1.5 text-[9px] font-semibold border-red-200 shadow-sm">Atraso</Badge>
                                  <Button
                                    size="icon"
                                    className="h-6 w-6 rounded border border-transparent hover:border-orange-200 bg-orange-100/50 hover:bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400 p-0 shadow-sm transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toast(`Cobrança enviada com sucesso para ${item.manager?.nome}`, "success");
                                    }}
                                    title="Cobrar Gestor via WhatsApp"
                                  >
                                    <Zap className="h-3 w-3 fill-orange-500 text-orange-500" />
                                  </Button>
                                </div>
                              ) : item.travada ? (
                                <Badge variant="warn" className="h-5 px-1.5 text-[9px] shadow-sm">Travada</Badge>
                              ) : (
                                <Badge variant="ok" className="h-5 px-1.5 text-[9px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border border-emerald-100 shadow-sm">Em dia</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedVaga && (
          <Card className="border-border shadow-lg ring-1 ring-slate-200/50">
            <CardHeader className="px-6 py-5 border-b border-border/50 bg-muted/30">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-background text-muted-foreground border-border font-normal">
                      #{selectedVaga.vaga.id.slice(0, 8)}
                    </Badge>
                    <Badge variant="secondary" className="font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20">
                      {selectedVaga.role?.nome}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Checklist de Atividades
                  </CardTitle>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground">SLA Corrente</p>
                  <p className="text-lg font-bold text-foreground">{selectedVaga.slaDiasAberta} dias</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4 max-h-[600px] overflow-auto">
              {selectedVaga.vaga.checklist.map((stage, index) => {
                const isCompleted = stage.status === "CONCLUIDA";
                const isLate = stage.prazo < date && !isCompleted;

                return (
                  <article
                    key={stage.id}
                    className={`group relative rounded-xl border p-4 transition-all duration-300 ${isCompleted ? "bg-muted/50 border-border opacity-80 hover:opacity-100" : "bg-background border-border shadow-sm hover:shadow-md hover:border-blue-200 dark:border-blue-800"}`}
                  >
                    {/* Connecting Line */}
                    {index < selectedVaga.vaga.checklist.length - 1 && (
                      <div className="absolute left-[19px] top-[50px] bottom-[-20px] w-[2px] bg-muted -z-10 group-hover:bg-blue-50 dark:bg-blue-900/20 transition-colors" />
                    )}

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${isCompleted ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400" : isLate ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400" : "bg-background border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"}`}>
                            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${isCompleted ? "text-muted-foreground line-through decoration-slate-300" : "text-foreground"}`}>
                              {stage.nome}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Responsável: {stage.ownerRole}
                            </p>
                          </div>
                        </div>
                        <div>
                          {stage.opcional && <Badge variant="secondary" className="text-[10px] mr-2">Opcional</Badge>}
                          {isLate && <Badge variant="danger" className="text-[10px]">Atrasada</Badge>}
                          {isCompleted && <Badge variant="ok" className="text-[10px]">Concluido</Badge>}
                        </div>
                      </div>

                      <div className="pl-11 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wide mb-1 block">Status</label>
                          <Select
                            value={stage.status}
                            onValueChange={(val) =>
                              updateRecruitmentStage(selectedVaga.vaga.id, stage.id, {
                                status: val as "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA"
                              })
                            }
                          >
                            <SelectTrigger className={`h-8 text-xs ${isCompleted ? "bg-emerald-50 dark:bg-emerald-900/20/50 border-emerald-100 text-emerald-700 dark:text-emerald-300" : ""}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDENTE">Pendente</SelectItem>
                              <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
                              <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wide mb-1 block">Prazo</label>
                          <Input
                            className="h-8 text-xs"
                            type="date"
                            value={stage.prazo}
                            onChange={(event) =>
                              updateRecruitmentStage(selectedVaga.vaga.id, stage.id, {
                                prazo: event.target.value
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wide mb-1 block">
                            Evidência <span className="font-normal text-muted-foreground/40 ml-1">({stage.evidenciaMinima})</span>
                          </label>
                          <Input
                            className="h-8 text-xs"
                            value={stage.evidencia ?? ""}
                            placeholder="Cole link ou texto..."
                            onChange={(event) =>
                              updateRecruitmentStage(selectedVaga.vaga.id, stage.id, {
                                evidencia: event.target.value
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </CardContent>
          </Card>
        )}
      </section>

      <aside className="space-y-6">
        <Card className="border-border shadow-sm">
          <CardHeader className="p-4 pb-2 border-b border-slate-50">
            <CardTitle className="inline-flex items-center gap-2 text-sm font-bold text-foreground/90">
              <AlarmClock className="h-4 w-4 text-orange-500 dark:text-orange-400" />
              Etapas Atrasadas por Gestor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <ul className="space-y-2">
              {reportAtrasadasPorGestor.map((item) => (
                <li key={item.gestorNome} className="rounded-lg bg-orange-50 dark:bg-orange-900/20/50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/40 p-2.5 flex justify-between items-center group hover:bg-orange-50 dark:bg-orange-900/20 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-background border border-orange-200 dark:border-orange-800 flex items-center justify-center text-[10px] font-bold text-orange-600 dark:text-orange-400">
                      {item.gestorNome.charAt(0)}
                    </div>
                    <p className="font-semibold text-xs text-foreground/90">{item.gestorNome}</p>
                  </div>
                  <Badge variant="danger" className="text-[10px] h-5 px-1.5 shadow-sm">{item.count} atrasos</Badge>
                </li>
              ))}
              {reportAtrasadasPorGestor.length === 0 && (
                <li className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-8 text-center bg-muted/30">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-muted-foreground/70" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Sem atrasos no momento.</p>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="p-4 pb-2 border-b border-slate-50">
            <CardTitle className="inline-flex items-center gap-2 text-sm font-bold text-foreground/90">
              <TimerReset className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              Tempo Médio por Etapa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <ul className="max-h-60 space-y-2 overflow-auto pr-1">
              {reportTempoMedioPorEtapa.map((item) => (
                <li key={item.stageName} className="rounded-lg border border-border/50 bg-background p-2.5 flex justify-between items-center hover:border-purple-200 dark:border-purple-800 transition-colors">
                  <p className="font-medium text-xs text-foreground/90 truncate max-w-[180px]" title={item.stageName}>{item.stageName}</p>
                  <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded">{item.media.toFixed(1)}d</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="p-4 pb-2 border-b border-slate-50">
            <CardTitle className="text-sm font-bold text-foreground/90 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Vagas Travadas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <ul className="space-y-2">
              {reportVagasTravadas.map((item) => (
                <li key={item.vaga.id} className="rounded-lg border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20/30 dark:bg-red-900/10 p-3 hover:bg-red-50 dark:bg-red-900/20 hover:shadow-sm transition-all cursor-pointer" onClick={() => setSelectedVagaId(item.vaga.id)}>
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-xs text-foreground">#{item.vaga.id.slice(0, 6)}</p>
                    <Badge variant="warn" className="text-[9px] h-4 px-1">
                      + {item.vaga.diasSemAvanco} dias parado
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-semibold text-muted-foreground/90 bg-background px-1.5 py-0.5 rounded border border-border/50">{item.company?.nome}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                    <span className="text-[10px] text-muted-foreground">{item.role?.nome}</span>
                  </div>
                </li>
              ))}
              {reportVagasTravadas.length === 0 && (
                <li className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-8 text-center bg-muted/30">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Inbox className="h-5 w-5 text-muted-foreground/70" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Fluxo fluindo bem.</p>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
