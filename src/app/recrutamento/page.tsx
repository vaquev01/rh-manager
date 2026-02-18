"use client";

import { useMemo, useState } from "react";
import { AlarmClock, AlertTriangle, CheckCircle2, ClipboardList, Clock3, Inbox, MessageSquareWarning, TimerReset, Users, ChevronRight } from "lucide-react";

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
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Vagas</span>
                  <p className="text-2xl font-bold text-slate-800 leading-none mt-1">{totalVagas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="kpi-card kpi-success border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">No Prazo</span>
                  <p className="text-2xl font-bold text-emerald-700 leading-none mt-1">{noPrazoCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="kpi-card kpi-danger border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Atrasadas</span>
                  <p className="text-2xl font-bold text-red-700 leading-none mt-1">{atrasadasCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="kpi-card kpi-accent border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                  <Clock3 className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">SLA Médio</span>
                  <p className="text-2xl font-bold text-teal-700 leading-none mt-1">{slaMedio} <span className="text-sm font-medium text-slate-500">dias</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="px-6 py-4 border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">Pipeline de Vagas</CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-1">
                  Acompanhamento em tempo real do checklist
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => {
                  const count = chargeDelayedRecruitmentManagers();
                  setLastChargeCount(count);
                  toast(`Cobrança enviada para ${count} gestor(es)`, count > 0 ? "success" : "info");
                }}
              >
                <MessageSquareWarning className="mr-2 h-3.5 w-3.5" />
                Cobrar Gestores
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-auto max-h-[500px]">
              <table className="min-w-full text-left text-xs bg-white">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-semibold text-slate-500">Vaga</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-500">Gestor</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-500">SLA</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-500">Etapa Atual</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-500">Progresso</th>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-500 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vagasView.map((item) => (
                    <tr
                      key={item.vaga.id}
                      className={`group cursor-pointer hover:bg-slate-50 transition-all duration-200 ${selectedVaga?.vaga.id === item.vaga.id ? "bg-blue-50/60 hover:bg-blue-50/80" : ""
                        }`}
                      onClick={() => setSelectedVagaId(item.vaga.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm mb-0.5">{item.role?.nome ?? "Cargo Indefinido"}</span>
                          <span className="text-[10px] text-slate-500">
                            {item.company?.nome} · {item.unit?.nome}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">
                            {item.manager?.nome.charAt(0)}
                          </div>
                          <span className="text-slate-700 font-medium">{item.manager?.nome.split(' ')[0] ?? "Gestor"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600 font-mono text-[10px]">
                        {item.vaga.dataAbertura} <span className="text-slate-300 mx-1">|</span> {item.slaDiasAberta}d
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                          <span className="text-slate-700">{item.stageAtual?.nome ?? "Início"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 w-32">
                        <div className="space-y-1.5">
                          <Progress value={item.progress * 100} className="h-1.5 bg-slate-100" />
                          <p className="text-[10px] text-right font-medium text-slate-500">{percent(item.progress)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {item.delayedStages.length > 0 ? (
                          <Badge variant="danger" className="h-6 px-2">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {item.delayedStages.length} Atraso(s)
                          </Badge>
                        ) : item.travada ? (
                          <Badge variant="warn" className="h-6 px-2">Travada</Badge>
                        ) : (
                          <Badge variant="ok" className="h-6 px-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200">No Prazo</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {selectedVaga && (
          <Card className="border-slate-200 shadow-lg ring-1 ring-slate-200/50">
            <CardHeader className="px-6 py-5 border-b border-slate-100 bg-slate-50/30">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-white text-slate-500 border-slate-200 font-normal">
                      #{selectedVaga.vaga.id.slice(0, 8)}
                    </Badge>
                    <Badge variant="secondary" className="font-semibold text-blue-700 bg-blue-50">
                      {selectedVaga.role?.nome}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-800">
                    Checklist de Atividades
                  </CardTitle>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-500">SLA Corrente</p>
                  <p className="text-lg font-bold text-slate-800">{selectedVaga.slaDiasAberta} dias</p>
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
                    className={`group relative rounded-xl border p-4 transition-all duration-300 ${isCompleted ? "bg-slate-50/50 border-slate-200 opacity-80 hover:opacity-100" : "bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200"}`}
                  >
                    {/* Connecting Line */}
                    {index < selectedVaga.vaga.checklist.length - 1 && (
                      <div className="absolute left-[19px] top-[50px] bottom-[-20px] w-[2px] bg-slate-100 -z-10 group-hover:bg-blue-50 transition-colors" />
                    )}

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${isCompleted ? "bg-emerald-50 border-emerald-200 text-emerald-600" : isLate ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-blue-200 text-blue-600"}`}>
                            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${isCompleted ? "text-slate-500 line-through decoration-slate-300" : "text-slate-800"}`}>
                              {stage.nome}
                            </p>
                            <p className="text-[10px] text-slate-500">
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
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Status</label>
                          <Select
                            value={stage.status}
                            onValueChange={(val) =>
                              updateRecruitmentStage(selectedVaga.vaga.id, stage.id, {
                                status: val as "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA"
                              })
                            }
                          >
                            <SelectTrigger className={`h-8 text-xs ${isCompleted ? "bg-emerald-50/50 border-emerald-100 text-emerald-700" : ""}`}>
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
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Prazo</label>
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
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">
                            Evidência <span className="font-normal text-slate-300 ml-1">({stage.evidenciaMinima})</span>
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
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="p-4 pb-2 border-b border-slate-50">
            <CardTitle className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
              <AlarmClock className="h-4 w-4 text-orange-500" />
              Etapas Atrasadas por Gestor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <ul className="space-y-2">
              {reportAtrasadasPorGestor.map((item) => (
                <li key={item.gestorNome} className="rounded-lg bg-orange-50/50 border border-orange-100 p-2.5 flex justify-between items-center group hover:bg-orange-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-white border border-orange-200 flex items-center justify-center text-[10px] font-bold text-orange-600">
                      {item.gestorNome.charAt(0)}
                    </div>
                    <p className="font-semibold text-xs text-slate-700">{item.gestorNome}</p>
                  </div>
                  <Badge variant="danger" className="text-[10px] h-5 px-1.5 shadow-sm">{item.count} atrasos</Badge>
                </li>
              ))}
              {reportAtrasadasPorGestor.length === 0 && (
                <li className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-8 text-center bg-slate-50/30">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="text-xs font-medium text-slate-500">Sem atrasos no momento.</p>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="p-4 pb-2 border-b border-slate-50">
            <CardTitle className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
              <TimerReset className="h-4 w-4 text-purple-500" />
              Tempo Médio por Etapa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <ul className="max-h-60 space-y-2 overflow-auto pr-1">
              {reportTempoMedioPorEtapa.map((item) => (
                <li key={item.stageName} className="rounded-lg border border-slate-100 bg-white p-2.5 flex justify-between items-center hover:border-purple-200 transition-colors">
                  <p className="font-medium text-xs text-slate-700 truncate max-w-[180px]" title={item.stageName}>{item.stageName}</p>
                  <span className="font-mono text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{item.media.toFixed(1)}d</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="p-4 pb-2 border-b border-slate-50">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Vagas Travadas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <ul className="space-y-2">
              {reportVagasTravadas.map((item) => (
                <li key={item.vaga.id} className="rounded-lg border border-red-100 bg-red-50/30 p-3 hover:bg-red-50 hover:shadow-sm transition-all cursor-pointer" onClick={() => setSelectedVagaId(item.vaga.id)}>
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-xs text-slate-800">#{item.vaga.id.slice(0, 6)}</p>
                    <Badge variant="warn" className="text-[9px] h-4 px-1">
                      + {item.vaga.diasSemAvanco} dias parado
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-semibold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-100">{item.company?.nome}</span>
                    <ChevronRight className="h-3 w-3 text-slate-300" />
                    <span className="text-[10px] text-slate-500">{item.role?.nome}</span>
                  </div>
                </li>
              ))}
              {reportVagasTravadas.length === 0 && (
                <li className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-8 text-center bg-slate-50/30">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <Inbox className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="text-xs font-medium text-slate-500">Fluxo fluindo bem.</p>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
