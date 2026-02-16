"use client";

import { useMemo, useState } from "react";
import { AlarmClock, AlertTriangle, CheckCircle2, ClipboardList, Clock3, Inbox, MessageSquareWarning, TimerReset, Users } from "lucide-react";

import { useToast } from "@/components/toast";

import { useAppState } from "@/components/state-provider";
import { daysBetween } from "@/lib/date";
import { percent } from "@/lib/format";

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
    <div className="page-enter grid gap-4 xl:grid-cols-[1.35fr,1fr]">
      <section className="space-y-4">
        <div className="kpi-grid">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm kpi-card kpi-info">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <Users className="h-4 w-4 text-blue-500" />
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Vagas abertas</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-800">{totalVagas}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm kpi-card kpi-success">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">No prazo</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-800">{noPrazoCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm kpi-card kpi-danger">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Atrasadas</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-800">{atrasadasCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm kpi-card kpi-accent">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                <Clock3 className="h-4 w-4 text-teal-600" />
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">SLA medio</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-800">{slaMedio} dias</p>
          </div>
        </div>

        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Vagas abertas + checklist padrão</h2>
            <button
              className="button secondary"
              onClick={() => {
                const count = chargeDelayedRecruitmentManagers();
                setLastChargeCount(count);
                toast(`Cobrança enviada para ${count} gestor(es)`, count > 0 ? "success" : "info");
              }}
            >
              <MessageSquareWarning className="mr-1 inline h-3.5 w-3.5" />
              Cobrar gestores atrasados
            </button>
          </div>

          <p className="mb-3 text-xs text-slate-500">
            Ultima cobrança acionou <strong>{lastChargeCount}</strong> gestor(es).
          </p>

          <div className="overflow-auto">
            <table className="table-zebra min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200">
                  <th scope="col" className="px-2 py-2">Empresa/Unidade</th>
                  <th scope="col" className="px-2 py-2">Time/Cargo</th>
                  <th scope="col" className="px-2 py-2">Gestor</th>
                  <th scope="col" className="px-2 py-2">Abertura</th>
                  <th scope="col" className="px-2 py-2">SLA</th>
                  <th scope="col" className="px-2 py-2">Etapa atual</th>
                  <th scope="col" className="px-2 py-2">Progresso</th>
                  <th scope="col" className="px-2 py-2">Alertas</th>
                </tr>
              </thead>
              <tbody>
                {vagasView.map((item) => (
                  <tr
                    key={item.vaga.id}
                    className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${
                      selectedVaga?.vaga.id === item.vaga.id ? "bg-emerald-50/50" : ""
                    }`}
                    onClick={() => setSelectedVagaId(item.vaga.id)}
                  >
                    <td className="px-2 py-2 text-slate-700">
                      <p>{item.company?.nome ?? "Empresa"}</p>
                      <p className="text-slate-500">{item.unit?.nome ?? "Unidade"}</p>
                    </td>
                    <td className="px-2 py-2 text-slate-700">
                      <p>{item.team?.nome ?? "Time"}</p>
                      <p className="text-slate-500">{item.role?.nome ?? "Cargo"}</p>
                    </td>
                    <td className="px-2 py-2 text-slate-700">{item.manager?.nome ?? "Gestor"}</td>
                    <td className="px-2 py-2 text-slate-700">{item.vaga.dataAbertura}</td>
                    <td className="px-2 py-2 text-slate-700">{item.slaDiasAberta} dias</td>
                    <td className="px-2 py-2 text-slate-700">{item.stageAtual?.nome ?? "-"}</td>
                    <td className="px-2 py-2 text-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="progress-bar w-16">
                          <div className="progress-bar-fill" style={{ width: `${Math.round(item.progress * 100)}%`, background: item.progress >= 1 ? '#10b981' : item.progress >= 0.5 ? '#3b82f6' : '#f59e0b' }} />
                        </div>
                        <span>{percent(item.progress)}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-1">
                        {item.delayedStages.length > 0 && (
                          <span className="badge badge-danger">Atrasada ({item.delayedStages.length})</span>
                        )}
                        {item.travada && <span className="badge badge-warn">Travada</span>}
                        {!item.travada && item.delayedStages.length === 0 && (
                          <span className="badge badge-ok">No prazo</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedVaga && (
          <div className="panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-800">
                <ClipboardList className="h-4 w-4" />
                Checklist da vaga {selectedVaga.vaga.id}
              </h3>
              <span className="text-xs text-slate-500">
                Gestor: {selectedVaga.manager?.nome ?? "-"} · SLA {selectedVaga.slaDiasAberta} dias
              </span>
            </div>

            <div className="space-y-2">
              {selectedVaga.vaga.checklist.map((stage) => (
                <article key={stage.id} className={`rounded-xl border p-3 ${stage.status === "CONCLUIDA" ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {stage.status === "CONCLUIDA" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      <p className={`text-sm font-semibold ${stage.status === "CONCLUIDA" ? "text-emerald-700 line-through" : "text-slate-700"}`}>{stage.nome}</p>
                      <p className="text-xs text-slate-500">
                        Dono: {stage.ownerRole} · Evidencia minima: {stage.evidenciaMinima}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {stage.opcional ? <span className="badge badge-warn">Opcional</span> : null}
                      {stage.prazo < date && stage.status !== "CONCLUIDA" ? (
                        <span className="badge badge-danger">Atrasada</span>
                      ) : (
                        <span className="badge badge-ok">No prazo</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 grid gap-2 md:grid-cols-3">
                    <label className="text-xs text-slate-500">
                      Status
                      <select
                        className="select mt-1"
                        value={stage.status}
                        onChange={(event) =>
                          updateRecruitmentStage(selectedVaga.vaga.id, stage.id, {
                            status: event.target.value as "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA"
                          })
                        }
                      >
                        <option value="PENDENTE">Pendente</option>
                        <option value="EM_ANDAMENTO">Em andamento</option>
                        <option value="CONCLUIDA">Concluida</option>
                      </select>
                    </label>

                    <label className="text-xs text-slate-500">
                      Prazo
                      <input
                        className="input mt-1"
                        type="date"
                        value={stage.prazo}
                        onChange={(event) =>
                          updateRecruitmentStage(selectedVaga.vaga.id, stage.id, {
                            prazo: event.target.value
                          })
                        }
                      />
                    </label>

                    <label className="text-xs text-slate-500">
                      Evidencia
                      <input
                        className="input mt-1"
                        value={stage.evidencia ?? ""}
                        placeholder="Nota, link ou arquivo"
                        onChange={(event) =>
                          updateRecruitmentStage(selectedVaga.vaga.id, stage.id, {
                            evidencia: event.target.value
                          })
                        }
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <aside className="space-y-4">
        <div className="panel p-4">
          <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
            <AlarmClock className="h-4 w-4" />
            Relatorio: etapas atrasadas por gestor
          </h3>
          <ul className="mt-2 space-y-2 text-xs text-slate-600">
            {reportAtrasadasPorGestor.map((item) => (
              <li key={item.gestorNome} className="rounded-lg border border-slate-200 bg-white p-2">
                <p className="font-semibold text-slate-700">{item.gestorNome}</p>
                <p>{item.count} etapa(s) atrasada(s)</p>
              </li>
            ))}
            {reportAtrasadasPorGestor.length === 0 && (
              <li className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 py-6 text-center">
                <ClipboardList className="h-6 w-6 text-slate-300" />
                <p className="text-xs text-slate-400">Sem atrasos no momento.</p>
              </li>
            )}
          </ul>
        </div>

        <div className="panel p-4">
          <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
            <TimerReset className="h-4 w-4" />
            Relatorio: tempo medio por etapa
          </h3>
          <ul className="mt-2 max-h-56 space-y-2 overflow-auto text-xs text-slate-600">
            {reportTempoMedioPorEtapa.map((item) => (
              <li key={item.stageName} className="rounded-lg border border-slate-200 bg-white p-2">
                <p className="font-semibold text-slate-700">{item.stageName}</p>
                <p>{item.media.toFixed(1)} dia(s) em media</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel p-4">
          <h3 className="text-sm font-semibold text-slate-800">Relatorio: vagas travadas</h3>
          <ul className="mt-2 space-y-2 text-xs text-slate-600">
            {reportVagasTravadas.map((item) => (
              <li key={item.vaga.id} className="rounded-lg border border-slate-200 bg-white p-2">
                <p className="font-semibold text-slate-700">{item.vaga.id}</p>
                <p>
                  {item.company?.nome} / {item.unit?.nome} · {item.role?.nome}
                </p>
                <p>
                  Sem avanco: {item.vaga.diasSemAvanco} dia(s) · atrasos: {item.delayedStages.length}
                </p>
              </li>
            ))}
            {reportVagasTravadas.length === 0 && (
              <li className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 py-6 text-center">
                <Inbox className="h-6 w-6 text-slate-300" />
                <p className="text-xs text-slate-400">Nenhuma vaga travada.</p>
              </li>
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}
