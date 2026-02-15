"use client";

import { useMemo, useState } from "react";
import { BookMarked, Brain, Inbox, Rocket, Target } from "lucide-react";

import { useToast } from "@/components/toast";

import { useAppState } from "@/components/state-provider";
import { CompetencyRole } from "@/lib/types";

export default function DesenvolvimentoPage() {
  const {
    state,
    filters,
    updateTrainingCompletion,
    sendFlashTraining,
    updateOnboardingProgress,
    updatePdiProgress
  } = useAppState();

  const [flashRecipients, setFlashRecipients] = useState<number>(0);
  const { toast } = useToast();

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

  return (
    <div className="page-enter space-y-4">
      <section className="panel p-4">
        <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-800">
          <Brain className="h-5 w-5" />
          Matriz de competencias por cargo
        </h2>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {visibleRoles.map((role) => {
            const competencies = competenciesByRole.get(role.id) ?? [];
            return (
              <article key={role.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-sm font-semibold text-slate-700">
                  {role.nome} · {role.nivel}
                </p>
                <p className="text-xs text-slate-500">Familia: {role.familia}</p>

                <ul className="mt-2 space-y-2 text-xs text-slate-600">
                  {competencies.map((competency) => (
                    <li key={competency.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <p className="font-semibold text-slate-700">{competency.competencia}</p>
                      <p>Peso: {competency.peso}</p>
                      <p>Criterio observavel: {competency.criterioObservavel}</p>
                    </li>
                  ))}
                  {competencies.length === 0 && (
                    <li className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-slate-200 py-4 text-center">
                      <Inbox className="h-5 w-5 text-slate-300" />
                      <p className="text-xs text-slate-400">Sem competências cadastradas.</p>
                    </li>
                  )}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr,1fr]">
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-800">
              <BookMarked className="h-4 w-4" />
              Treinamentos por cargo e pessoa
            </h3>
            <p className="text-xs text-slate-500">
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
                <tr className="border-b border-slate-200">
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
                  <tr key={completion.id} className="border-b border-slate-100">
                    <td className="px-2 py-2 text-slate-700">{person?.nome ?? completion.personId}</td>
                    <td className="px-2 py-2 text-slate-700">{training?.nome ?? completion.trainingId}</td>
                    <td className="px-2 py-2 text-slate-700">
                      {training ? roleById[training.cargoId]?.nome : "-"}
                    </td>
                    <td className="px-2 py-2 text-slate-700">
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
                    <td className="px-2 py-2 text-slate-700">{completion.concluidoEm ?? "-"}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel p-4">
          <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-800">
            <Rocket className="h-4 w-4" />
            Onboarding por cargo (1/7/14/30/60/90)
          </h3>

          <ul className="mt-3 max-h-[420px] space-y-2 overflow-auto text-xs text-slate-600">
            {onboardingRows.map((entry) => {
              if (!entry) {
                return null;
              }
              const { progress, item, person, role } = entry;
              return (
              <li key={progress.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="font-semibold text-slate-700">{person?.nome ?? progress.personId}</p>
                <p>
                  Cargo: {role?.nome ?? "-"} · Marco: D+{item?.marcoDia ?? "?"} · Owner: {item?.ownerRole}
                </p>
                <p>Tarefa: {item?.titulo ?? "Item onboarding"}</p>

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
        <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-800">
          <Target className="h-4 w-4" />
          PDI individual (lacuna → acao → prazo → responsavel)
        </h3>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {visiblePdiItems.map((item) => {
            const person = personById[item.personId];
            const manager = personById[item.responsavelPersonId];
            return (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                <p className="font-semibold text-slate-700">{person?.nome ?? item.personId}</p>
                <p className="text-xs text-slate-500">Responsavel: {manager?.nome ?? item.responsavelPersonId}</p>
                <p className="mt-2 text-slate-600">Lacuna: {item.lacuna}</p>
                <p className="text-slate-600">Acao: {item.acao}</p>
                <p className="text-slate-600">Prazo: {item.prazo}</p>

                <label className="mt-2 block text-xs text-slate-500">
                  Evolucao
                  <textarea
                    className="textarea mt-1"
                    value={item.evolucao}
                    onChange={(event) =>
                      updatePdiProgress(item.id, event.target.value, item.evidencia)
                    }
                  />
                </label>

                <label className="mt-2 block text-xs text-slate-500">
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
