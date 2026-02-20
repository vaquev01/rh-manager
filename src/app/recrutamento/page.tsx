"use client";

import { useMemo, useState } from "react";
import {
  AlarmClock, AlertTriangle, CheckCircle2, ClipboardList, Clock3,
  Inbox, MessageSquareWarning, TimerReset, Users, ChevronRight,
  LayoutList, LayoutGrid, Zap, FileText, Briefcase, Pencil
} from "lucide-react";

import { useToast } from "@/components/toast";
import { useAppState } from "@/components/state-provider";
import { daysBetween } from "@/lib/date";
import { percent } from "@/lib/format";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

/* ─── Default Job Description Template ─────────────────────── */
const DEFAULT_JOB_TEMPLATE = `## Sobre a Vaga

Buscamos profissional comprometido(a) para atuar na operação diária, contribuindo para a excelência no atendimento e na qualidade do serviço prestado.

## Responsabilidades Principais

- Executar as atividades da função conforme padrão operacional
- Manter a organização e a limpeza do ambiente de trabalho
- Participar de treinamentos obrigatórios e buscar desenvolvimento contínuo
- Colaborar com a equipe para atingir os indicadores de desempenho

## Requisitos

- Ensino Médio completo
- Disponibilidade de horário (escala 6x1)
- Experiência prévia na função será considerada como diferencial
- Boa comunicação e proatividade

## Oferecemos

- Remuneração competitiva
- Vale transporte e alimentação
- Oportunidade de crescimento profissional`;

type TopTab = "vagas" | "talentos";

export default function RecrutamentoPage() {
  const { state, date, filters, updateRecruitmentStage, chargeDelayedRecruitmentManagers } =
    useAppState();

  const [topTab, setTopTab] = useState<TopTab>("vagas");
  const [selectedVagaId, setSelectedVagaId] = useState<string | null>(
    state.recruitmentVagas[0]?.id ?? null
  );
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [lastChargeCount, setLastChargeCount] = useState<number>(0);
  const { toast } = useToast();

  // Job description drafts per vaga id
  const [descDrafts, setDescDrafts] = useState<Record<string, string>>({});
  const [editingDesc, setEditingDesc] = useState(false);

  /* ─── Data memos ────────────────────────────────────────── */

  const vagas = useMemo(() => {
    return state.recruitmentVagas.filter((vaga) => {
      if (filters.companyId && vaga.companyId !== filters.companyId) return false;
      if (filters.unitId && vaga.unitId !== filters.unitId) return false;
      if (filters.teamId && vaga.teamId !== filters.teamId) return false;
      if (filters.cargoId && vaga.cargoId !== filters.cargoId) return false;
      return true;
    });
  }, [state.recruitmentVagas, filters]);

  const vagasView = useMemo(() => {
    return vagas.map((vaga) => {
      const company = state.companies.find((i) => i.id === vaga.companyId);
      const unit = state.units.find((i) => i.id === vaga.unitId);
      const team = state.teams.find((i) => i.id === vaga.teamId);
      const role = state.roles.find((i) => i.id === vaga.cargoId);
      const manager = state.people.find((i) => i.id === vaga.gestorPersonId);
      const doneCount = vaga.checklist.filter((s) => s.status === "CONCLUIDA").length;
      const progress = vaga.checklist.length ? doneCount / vaga.checklist.length : 0;
      const delayedStages = vaga.checklist.filter(
        (s) => s.prazo < date && s.status !== "CONCLUIDA"
      );
      const travada = vaga.diasSemAvanco >= 3;
      const stageAtual = vaga.checklist.find((s) => s.id === vaga.etapaAtualId);

      return {
        vaga, company, unit, team, role, manager,
        progress, delayedStages, travada, stageAtual,
        slaDiasAberta: daysBetween(vaga.dataAbertura, date),
      };
    });
  }, [vagas, state, date]);

  const selectedVaga = vagasView.find((i) => i.vaga.id === selectedVagaId) ?? vagasView[0];

  /* ─── Reports ──────────────────────────────────────────── */

  const reportAtrasadasPorGestor = useMemo(() => {
    const map = new Map<string, { gestorNome: string; count: number }>();
    vagasView.forEach((item) => {
      if (!item.delayedStages.length) return;
      const key = item.vaga.gestorPersonId;
      const prev = map.get(key);
      if (prev) { prev.count += item.delayedStages.length; return; }
      map.set(key, { gestorNome: item.manager?.nome ?? "Gestor não identificado", count: item.delayedStages.length });
    });
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [vagasView]);

  const reportTempoMedioPorEtapa = useMemo(() => {
    const stageMap = new Map<string, { stageName: string; totalDias: number; count: number }>();
    vagasView.forEach((item) => {
      item.vaga.checklist.forEach((stage) => {
        const dias = daysBetween(item.vaga.dataAbertura, stage.prazo);
        const current = stageMap.get(stage.id) ?? { stageName: stage.nome, totalDias: 0, count: 0 };
        current.totalDias += dias;
        current.count += 1;
        stageMap.set(stage.id, current);
      });
    });
    return [...stageMap.values()]
      .map((e) => ({ stageName: e.stageName, media: e.count ? e.totalDias / e.count : 0 }))
      .sort((a, b) => b.media - a.media);
  }, [vagasView]);

  const reportVagasTravadas = useMemo(
    () => vagasView.filter((i) => i.travada || i.delayedStages.length > 0),
    [vagasView]
  );

  const kanbanColumns = useMemo(() => {
    const stages = new Set<string>();
    vagasView.forEach((v) => stages.add(v.stageAtual?.nome ?? "Início"));
    return Array.from(stages);
  }, [vagasView]);

  /* ─── KPI calcs ────────────────────────────────────────── */

  const totalVagas = vagasView.length;
  const noPrazoCount = vagasView.filter((i) => !i.travada && i.delayedStages.length === 0).length;
  const atrasadasCount = vagasView.filter((i) => i.delayedStages.length > 0).length;
  const slaMedio = totalVagas > 0 ? Math.round(vagasView.reduce((s, i) => s + i.slaDiasAberta, 0) / totalVagas) : 0;

  /* ─── Candidates ───────────────────────────────────────── */

  const candidatesView = useMemo(() => {
    return (state.recruitmentCandidates || []).filter((cand) => {
      if (filters.cargoId && cand.cargoId !== filters.cargoId) return false;
      return true;
    }).map((cand) => ({
      ...cand,
      role: state.roles.find((r) => r.id === cand.cargoId),
      vaga: state.recruitmentVagas.find((v) => v.id === cand.vagaId),
    }));
  }, [state.recruitmentCandidates, filters, state.roles, state.recruitmentVagas]);

  /* ─── Job Description helpers ──────────────────────────── */
  const currentDesc = selectedVaga
    ? descDrafts[selectedVaga.vaga.id] ?? selectedVaga.vaga.descricao ?? DEFAULT_JOB_TEMPLATE
    : "";

  /* ────────────────────────────────────────────────────────── */
  /*                        RENDER                              */
  /* ────────────────────────────────────────────────────────── */

  return (
    <div className="page-enter space-y-4">
      {/* ─── TOP BAR: Tabs + KPI pills + actions ──────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Tab buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-muted/60 p-0.5 rounded-lg border border-border/50 shadow-sm">
            <button
              onClick={() => setTopTab("vagas")}
              className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition-all flex items-center gap-1.5 ${topTab === "vagas" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              Vagas Abertas
            </button>
            <button
              onClick={() => setTopTab("talentos")}
              className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition-all flex items-center gap-1.5 ${topTab === "talentos" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Users className="h-3.5 w-3.5" />
              Banco de Talentos
            </button>
          </div>

          {/* KPI pills — only on Vagas tab */}
          {topTab === "vagas" && (
            <>
              <div className="h-4 w-px bg-border/70 hidden sm:block" />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 border border-border/50 text-[11px] font-semibold text-foreground/80">
                  <Users className="h-3 w-3 text-blue-500" />
                  {totalVagas} vagas
                </span>
                {noPrazoCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/30 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    {noPrazoCount} no prazo
                  </span>
                )}
                {atrasadasCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/30 text-[11px] font-semibold text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-3 w-3" />
                    {atrasadasCount} atrasada{atrasadasCount > 1 ? "s" : ""}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/40 border border-border/40 text-[11px] font-medium text-muted-foreground">
                  <Clock3 className="h-3 w-3" />
                  SLA {slaMedio}d
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right actions */}
        {topTab === "vagas" && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex bg-muted/60 p-0.5 rounded-lg border border-border/50 shadow-sm">
              <button
                onClick={() => setViewMode("list")}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 ${viewMode === "list" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <LayoutList className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 ${viewMode === "kanban" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs bg-muted/30 border-border text-foreground/80 hover:bg-muted gap-1.5"
              onClick={() => {
                const count = chargeDelayedRecruitmentManagers();
                setLastChargeCount(count);
                toast(`Cobrança enviada para ${count} gestor(es)`, count > 0 ? "success" : "info");
              }}
            >
              <MessageSquareWarning className="h-3.5 w-3.5" />
              Cobrar
            </Button>
          </div>
        )}
      </div>

      {/* ─── TAB: VAGAS ABERTAS ───────────────────────────── */}
      {topTab === "vagas" && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* ─── LEFT: Master List ────────────────────────── */}
          <div className="space-y-3">
            <Card className="border-border shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {viewMode === "list" ? (
                  <div className="overflow-auto max-h-[calc(100vh-200px)]">
                    <ul className="divide-y divide-border/50">
                      {vagasView.map((item) => {
                        const isSelected = selectedVaga?.vaga.id === item.vaga.id;
                        return (
                          <li
                            key={item.vaga.id}
                            onClick={() => setSelectedVagaId(item.vaga.id)}
                            className={`px-4 py-3 cursor-pointer transition-all duration-150 hover:bg-muted/40 ${isSelected ? "bg-blue-50/80 dark:bg-blue-900/20 border-l-2 border-l-blue-500" : "border-l-2 border-l-transparent"}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-foreground truncate">
                                  {item.role?.nome ?? "Cargo Indefinido"}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-muted-foreground">{item.company?.nome} · {item.unit?.nome}</span>
                                  <span className="text-[10px] text-muted-foreground/50">|</span>
                                  <span className="text-[10px] font-mono text-muted-foreground">{item.slaDiasAberta}d</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="w-16">
                                  <Progress value={item.progress * 100} className="h-1.5 bg-muted" />
                                  <p className="text-[9px] text-right text-muted-foreground mt-0.5">{percent(item.progress)}</p>
                                </div>
                                {item.delayedStages.length > 0 ? (
                                  <Badge variant="danger" className="text-[9px] h-5 px-1.5">Atraso</Badge>
                                ) : item.travada ? (
                                  <Badge variant="warn" className="text-[9px] h-5 px-1.5">Travada</Badge>
                                ) : (
                                  <Badge variant="ok" className="text-[9px] h-5 px-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border border-emerald-100">OK</Badge>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                      {vagasView.length === 0 && (
                        <li className="py-12 text-center text-sm text-muted-foreground">Nenhuma vaga encontrada.</li>
                      )}
                    </ul>
                  </div>
                ) : (
                  /* Kanban */
                  <div className="flex gap-4 p-4 overflow-x-auto min-h-[400px] items-start bg-slate-50/50 dark:bg-muted/10">
                    {kanbanColumns.map((col) => {
                      const colItems = vagasView.filter((v) => (v.stageAtual?.nome ?? "Início") === col);
                      return (
                        <div key={col} className="flex-shrink-0 w-72 flex flex-col gap-3">
                          <div className="flex items-center justify-between uppercase tracking-wider text-[10px] font-bold text-muted-foreground px-1">
                            <span>{col}</span>
                            <Badge variant="secondary" className="h-5 px-1.5 text-[9px] bg-white dark:bg-background border-border shadow-sm">{colItems.length}</Badge>
                          </div>
                          {colItems.map((item) => (
                            <div
                              key={item.vaga.id}
                              draggable
                              onClick={() => setSelectedVagaId(item.vaga.id)}
                              className={`bg-background border rounded-xl p-3.5 cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow-md transition-all ${selectedVagaId === item.vaga.id ? "ring-2 ring-blue-500/30 border-blue-400 shadow-md" : "border-border shadow-sm"}`}
                            >
                              <div className="flex justify-between items-start mb-1.5">
                                <div>
                                  <h4 className="font-bold text-xs text-foreground">{item.role?.nome ?? "Cargo"}</h4>
                                  <p className="text-[10px] text-muted-foreground/70">{item.company?.nome}</p>
                                </div>
                                <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-muted border border-border flex items-center justify-center text-[9px] font-bold text-muted-foreground" title={item.manager?.nome}>
                                  {item.manager?.nome.charAt(0)}
                                </div>
                              </div>
                              <Progress value={item.progress * 100} className="h-1 bg-muted/70 mb-2" />
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-mono text-muted-foreground">{item.slaDiasAberta}d</span>
                                {item.delayedStages.length > 0 ? (
                                  <div className="flex items-center gap-1">
                                    <Badge variant="danger" className="h-4 px-1 text-[8px]">Atraso</Badge>
                                    <button
                                      className="h-5 w-5 rounded bg-orange-100/50 hover:bg-orange-100 text-orange-600 flex items-center justify-center"
                                      onClick={(e) => { e.stopPropagation(); toast(`Cobrança enviada para ${item.manager?.nome}`, "success"); }}
                                    >
                                      <Zap className="h-2.5 w-2.5 fill-orange-500" />
                                    </button>
                                  </div>
                                ) : item.travada ? (
                                  <Badge variant="warn" className="h-4 px-1 text-[8px]">Travada</Badge>
                                ) : (
                                  <Badge variant="ok" className="h-4 px-1 text-[8px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">OK</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mini report cards below master list */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-border shadow-sm">
                <CardHeader className="p-3 pb-1.5">
                  <CardTitle className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                    <AlarmClock className="h-3.5 w-3.5 text-orange-500" />
                    Atrasos por Gestor
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <ul className="space-y-1.5 max-h-28 overflow-auto">
                    {reportAtrasadasPorGestor.map((item) => (
                      <li key={item.gestorNome} className="flex justify-between items-center text-[10px]">
                        <span className="text-foreground/80 truncate mr-2">{item.gestorNome}</span>
                        <Badge variant="danger" className="text-[8px] h-4 px-1 shrink-0">{item.count}</Badge>
                      </li>
                    ))}
                    {reportAtrasadasPorGestor.length === 0 && (
                      <li className="text-[10px] text-muted-foreground italic">Sem atrasos.</li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader className="p-3 pb-1.5">
                  <CardTitle className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                    <TimerReset className="h-3.5 w-3.5 text-purple-500" />
                    Tempo Médio / Etapa
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <ul className="space-y-1.5 max-h-28 overflow-auto">
                    {reportTempoMedioPorEtapa.map((item) => (
                      <li key={item.stageName} className="flex justify-between items-center text-[10px]">
                        <span className="text-foreground/80 truncate mr-2">{item.stageName}</span>
                        <span className="font-mono text-purple-600 dark:text-purple-400 font-bold shrink-0">{item.media.toFixed(0)}d</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ─── RIGHT: Detail Panel ─────────────────────── */}
          <div className="space-y-4">
            {selectedVaga ? (
              <>
                {/* Vaga header */}
                <Card className="border-border shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="outline" className="bg-background text-muted-foreground border-border font-normal text-[10px]">
                            #{selectedVaga.vaga.id.slice(0, 8)}
                          </Badge>
                          <Badge variant="secondary" className="font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 text-[10px]">
                            {selectedVaga.role?.nome}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {selectedVaga.company?.nome} · {selectedVaga.unit?.nome} · Gestor: <strong>{selectedVaga.manager?.nome}</strong>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-medium text-muted-foreground">SLA Corrente</p>
                        <p className="text-lg font-bold text-foreground">{selectedVaga.slaDiasAberta}d</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 flex items-center gap-3">
                      <Progress value={selectedVaga.progress * 100} className="h-2 flex-1 bg-muted" />
                      <span className="text-xs font-bold text-foreground">{percent(selectedVaga.progress)}</span>
                    </div>

                    {/* Channels */}
                    <div className="mt-4">
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Canais de Publicação</h4>
                      <div className="flex gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 bg-[#0A66C2]/10 border border-[#0A66C2]/20 rounded-lg px-2.5 py-1.5">
                          <span className="font-bold text-[#0A66C2] text-[10px]">in</span>
                          <span className="text-[10px] font-semibold text-foreground/80">LinkedIn</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg px-2.5 py-1.5">
                          <span className="font-bold text-blue-600 text-[10px] bg-blue-100 dark:bg-blue-800 rounded px-0.5">G</span>
                          <span className="text-[10px] font-semibold text-foreground/80">Gupy</span>
                        </div>
                        <Button variant="outline" size="sm" className="h-7 text-[10px] border-dashed text-muted-foreground">+ Canal</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card className="border-border shadow-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-blue-500" />
                      Linha do Tempo do Processo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 max-h-[400px] overflow-auto">
                    <div className="space-y-3 relative">
                      <div className="absolute left-[15px] top-3 bottom-6 w-[2px] bg-border -z-10" />
                      {selectedVaga.vaga.checklist.map((stage, index) => {
                        const done = stage.status === "CONCLUIDA";
                        const late = stage.prazo < date && !done;
                        return (
                          <div key={stage.id} className={`relative pl-9 py-2 ${done ? "opacity-70" : ""}`}>
                            <div className={`absolute left-[9px] top-3 h-3 w-3 rounded-full border-[3px] z-10 ${done ? "bg-emerald-500 border-emerald-100 dark:border-emerald-900" : late ? "bg-red-500 border-red-100 dark:border-red-900 animate-pulse" : "bg-blue-500 border-blue-100 dark:border-blue-900"}`} />
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`text-xs font-bold ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>{stage.nome}</span>
                                {stage.opcional && <Badge variant="secondary" className="text-[8px] h-4 px-1">Opc.</Badge>}
                                {late && <Badge variant="danger" className="text-[8px] h-4 px-1">Atraso</Badge>}
                                {done && <Badge variant="ok" className="text-[8px] h-4 px-1">✓</Badge>}
                              </div>
                              <span className="text-[10px] font-mono text-muted-foreground shrink-0">{stage.prazo}</span>
                            </div>
                            <div className="mt-2 grid grid-cols-3 gap-2">
                              <Select
                                value={stage.status}
                                onValueChange={(val) =>
                                  updateRecruitmentStage(selectedVaga.vaga.id, stage.id, {
                                    status: val as "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA",
                                  })
                                }
                              >
                                <SelectTrigger className="h-7 text-[10px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PENDENTE" className="text-[10px]">Pendente</SelectItem>
                                  <SelectItem value="EM_ANDAMENTO" className="text-[10px]">Em andamento</SelectItem>
                                  <SelectItem value="CONCLUIDA" className="text-[10px]">Concluída</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                className="h-7 text-[10px]"
                                type="date"
                                value={stage.prazo}
                                onChange={(e) =>
                                  updateRecruitmentStage(selectedVaga.vaga.id, stage.id, { prazo: e.target.value })
                                }
                              />
                              <Input
                                className="h-7 text-[10px]"
                                value={stage.evidencia ?? ""}
                                placeholder="Evidência…"
                                onChange={(e) =>
                                  updateRecruitmentStage(selectedVaga.vaga.id, stage.id, { evidencia: e.target.value })
                                }
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Job Description Template */}
                <Card className="border-border shadow-sm">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4 text-teal-500" />
                        Descritivo da Vaga
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] text-muted-foreground gap-1"
                        onClick={() => setEditingDesc(!editingDesc)}
                      >
                        <Pencil className="h-3 w-3" />
                        {editingDesc ? "Visualizar" : "Editar"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    {editingDesc ? (
                      <textarea
                        rows={12}
                        value={currentDesc}
                        onChange={(e) => setDescDrafts((prev) => ({ ...prev, [selectedVaga.vaga.id]: e.target.value }))}
                        className="w-full resize-y text-xs font-mono p-3 rounded-lg border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder="Cole ou edite o descritivo da vaga aqui…"
                      />
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap bg-muted/20 p-3 rounded-lg border border-border/50 max-h-[300px] overflow-auto">
                        {currentDesc || <span className="text-muted-foreground italic">Nenhum descritivo adicionado. Clique em Editar para começar.</span>}
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-[9px] text-muted-foreground">Template padrão carregado automaticamente · totalmente editável</p>
                      {editingDesc && (
                        <Button
                          size="sm"
                          className="h-6 text-[10px] bg-teal-600 hover:bg-teal-700 text-white"
                          onClick={() => {
                            setEditingDesc(false);
                            toast("Descritivo salvo para esta vaga", "success");
                          }}
                        >
                          Salvar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-border shadow-sm">
                <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3 border border-border/50">
                    <Inbox className="h-6 w-6 text-muted-foreground/60" />
                  </div>
                  <p className="text-sm font-semibold text-foreground/80 mb-1">Selecione uma vaga</p>
                  <p className="text-xs text-muted-foreground">Clique em uma vaga na lista à esquerda para ver o detalhe completo.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: BANCO DE TALENTOS ───────────────────────── */}
      {topTab === "talentos" && (
        <Card className="border-border shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {candidatesView.map((cand) => (
                <div key={cand.id} className="bg-background rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-all group cursor-pointer hover:border-blue-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-foreground leading-tight group-hover:text-blue-600 transition-colors">{cand.nome}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{cand.email}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{cand.telefone}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] bg-muted/30 shadow-sm">{cand.origem}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3 mb-1">
                    {cand.status === "NOVA_APLICACAO" && <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200">Nova Aplicação</Badge>}
                    {cand.status === "EM_PROCESSO" && <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200">Em Processo</Badge>}
                    {cand.status === "BANCO_TALENTOS" && <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-300">Banco</Badge>}
                    {cand.status === "APROVADO" && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200">Aprovado</Badge>}
                    {cand.status === "REPROVADO" && <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200">Reprovado</Badge>}
                    <Badge variant="secondary" className="text-[9px] bg-muted/40 text-foreground/80 font-normal">
                      {cand.role?.nome ?? "Múltiplos"}
                    </Badge>
                  </div>
                  {cand.vaga && (
                    <div className="mt-3 pt-3 border-t border-border/50 text-[10px] font-medium text-foreground/80 flex items-center justify-between">
                      <span className="text-muted-foreground/60">Vaga Ativa:</span>
                      <span
                        className="font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded cursor-pointer hover:underline"
                        onClick={() => { setTopTab("vagas"); setSelectedVagaId(cand.vagaId ?? null); }}
                      >
                        #{cand.vaga.id.slice(0, 6)}
                      </span>
                    </div>
                  )}
                  {cand.anotacoesRH && (
                    <p className="mt-2 text-[10px] text-muted-foreground italic bg-yellow-50 dark:bg-yellow-900/10 p-2 text-yellow-800 dark:text-yellow-200/70 rounded line-clamp-2 border border-yellow-100 dark:border-yellow-900/30">
                      &quot;{cand.anotacoesRH}&quot;
                    </p>
                  )}
                </div>
              ))}
              {candidatesView.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                  <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3 border border-border/50 shadow-sm">
                    <Inbox className="h-6 w-6 text-muted-foreground/60" />
                  </div>
                  <p className="text-sm font-semibold text-foreground/80 mb-1">Nenhum talento salvo.</p>
                  <p className="text-xs text-muted-foreground">Seu banco de talentos está vazio ou não corresponde aos filtros atuais.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
