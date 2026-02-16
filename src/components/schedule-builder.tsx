"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X
} from "lucide-react";

import { useAppState } from "@/components/state-provider";
import { useToast } from "@/components/toast";

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function getWeekDates(referenceDate: string): string[] {
  const d = new Date(referenceDate + "T12:00:00");
  const dayOfWeek = d.getDay();
  const monday = addDays(referenceDate, -((dayOfWeek + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function shortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

function dayName(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return DAY_NAMES[d.getDay()];
}

const DEFAULT_SHIFTS = [
  { label: "Manha (08–14)", nome: "Manha", inicio: "08:00", fim: "14:00" },
  { label: "Tarde (14–22)", nome: "Tarde", inicio: "14:00", fim: "22:00" },
  { label: "Integral (08–18)", nome: "Integral", inicio: "08:00", fim: "18:00" },
  { label: "Noite (18–02)", nome: "Noite", inicio: "18:00", fim: "02:00" }
];

export function ScheduleBuilder() {
  const {
    state,
    date,
    filters,
    assignPersonToSchedule,
    removeFromSchedule,
    updateCoverageTarget
  } = useAppState();
  const { toast } = useToast();

  const [weekOffset, setWeekOffset] = useState(0);
  const [assignPopup, setAssignPopup] = useState<{
    date: string;
    roleId: string;
    unitId: string;
  } | null>(null);
  const [selectedShift, setSelectedShift] = useState(0);
  const [editingCoverage, setEditingCoverage] = useState<{
    unitId: string;
    roleId: string;
  } | null>(null);
  const [coverageInput, setCoverageInput] = useState("");

  const referenceDate = useMemo(
    () => addDays(date, weekOffset * 7),
    [date, weekOffset]
  );
  const weekDates = useMemo(() => getWeekDates(referenceDate), [referenceDate]);

  const filteredUnits = useMemo(() => {
    let units = state.units;
    if (filters.companyId) {
      units = units.filter((u) => u.companyId === filters.companyId);
    }
    if (filters.unitId) {
      units = units.filter((u) => u.id === filters.unitId);
    }
    return units;
  }, [state.units, filters.companyId, filters.unitId]);

  const activeUnit = filteredUnits[0];

  const visibleRoles = useMemo(() => {
    if (filters.cargoId) {
      return state.roles.filter((r) => r.id === filters.cargoId);
    }
    return state.roles;
  }, [state.roles, filters.cargoId]);

  const schedulesInWeek = useMemo(() => {
    const dateSet = new Set(weekDates);
    return state.schedules.filter(
      (s) =>
        dateSet.has(s.date) &&
        (!activeUnit || s.unidadeId === activeUnit.id)
    );
  }, [state.schedules, weekDates, activeUnit]);

  const coverageMap = useMemo(() => {
    const map = new Map<string, number>();
    state.coverageTargets.forEach((t) => {
      if (activeUnit && t.unitId !== activeUnit.id) return;
      map.set(`${t.unitId}:${t.cargoId}`, t.minimoHoje);
    });
    return map;
  }, [state.coverageTargets, activeUnit]);

  const peopleByUnit = useMemo(() => {
    let people = state.people.filter(
      (p) => p.status === "ATIVO" || p.status === "OFF_HOJE"
    );
    if (activeUnit) {
      people = people.filter((p) => p.unitId === activeUnit.id);
    }
    if (filters.companyId) {
      people = people.filter((p) => p.companyId === filters.companyId);
    }
    return people;
  }, [state.people, activeUnit, filters.companyId]);

  const allAvailablePeople = useMemo(() => {
    return state.people.filter(
      (p) => p.status === "ATIVO" || p.status === "OFF_HOJE"
    );
  }, [state.people]);

  const rolesById = useMemo(
    () => Object.fromEntries(state.roles.map((r) => [r.id, r])),
    [state.roles]
  );

  function getAssigned(dayDate: string, roleId: string) {
    return schedulesInWeek.filter((s) => {
      const schedRole = s.roleId ?? state.people.find((p) => p.id === s.personId)?.cargoId;
      return s.date === dayDate && schedRole === roleId;
    });
  }

  function getPersonName(personId: string): string {
    return state.people.find((p) => p.id === personId)?.nome ?? personId;
  }

  function getAvailableForSlot(dayDate: string, roleId: string) {
    const alreadyAssigned = new Set(
      schedulesInWeek
        .filter((s) => s.date === dayDate)
        .map((s) => s.personId)
    );
    return allAvailablePeople.filter((p) => !alreadyAssigned.has(p.id));
  }

  function handleAssign(personId: string) {
    if (!assignPopup) return;
    const shift = DEFAULT_SHIFTS[selectedShift];
    assignPersonToSchedule(
      personId,
      assignPopup.date,
      assignPopup.unitId,
      assignPopup.roleId,
      [{ nome: shift.nome, inicio: shift.inicio, fim: shift.fim, unidadeId: assignPopup.unitId }]
    );
    toast(
      `${getPersonName(personId)} escalado(a) como ${rolesById[assignPopup.roleId]?.nome ?? "?"} em ${shortDate(assignPopup.date)}`,
      "success"
    );
    setAssignPopup(null);
  }

  function handleRemove(scheduleId: string) {
    const sched = state.schedules.find((s) => s.id === scheduleId);
    if (sched) {
      removeFromSchedule(scheduleId);
      toast(`${getPersonName(sched.personId)} removido(a) da escala`, "info");
    }
  }

  function handleSaveCoverage() {
    if (!editingCoverage) return;
    const val = parseInt(coverageInput, 10);
    if (isNaN(val) || val < 0) return;
    updateCoverageTarget(editingCoverage.unitId, editingCoverage.roleId, val);
    toast("Meta de cobertura atualizada", "success");
    setEditingCoverage(null);
  }

  if (!activeUnit) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 py-12 text-center">
        <Calendar className="h-8 w-8 text-slate-300" />
        <p className="text-sm text-slate-500">Selecione uma unidade nos filtros para montar a escala</p>
      </div>
    );
  }

  const available = assignPopup ? getAvailableForSlot(assignPopup.date, assignPopup.roleId) : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-semibold text-slate-800">
            Planejador de escala — {activeUnit.nome}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="button ghost p-1.5"
            onClick={() => setWeekOffset((w) => w - 1)}
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            className="button ghost px-2 py-1 text-xs"
            onClick={() => setWeekOffset(0)}
          >
            Hoje
          </button>
          <button
            className="button ghost p-1.5"
            onClick={() => setWeekOffset((w) => w + 1)}
            aria-label="Proxima semana"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50">
              <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-600 min-w-[140px]">
                Cargo / Funcao
              </th>
              {weekDates.map((d) => {
                const isToday = d === date;
                return (
                  <th
                    key={d}
                    className={`px-2 py-2 text-center font-medium min-w-[130px] ${isToday ? "bg-teal-50 text-teal-700" : "text-slate-500"}`}
                  >
                    <div className="text-[11px] uppercase">{dayName(d)}</div>
                    <div className={`text-sm ${isToday ? "font-bold" : ""}`}>{shortDate(d)}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRoles.map((role) => {
              const coverageKey = `${activeUnit.id}:${role.id}`;
              const needed = coverageMap.get(coverageKey) ?? 0;
              return (
                <tr key={role.id} className="border-t border-slate-100">
                  <td className="sticky left-0 z-10 bg-white px-3 py-2">
                    <div className="flex items-center justify-between gap-1">
                      <div>
                        <p className="font-semibold text-slate-700">{role.nome}</p>
                        <p className="text-[10px] text-slate-400">{role.familia}</p>
                      </div>
                      {editingCoverage?.unitId === activeUnit.id &&
                      editingCoverage?.roleId === role.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            className="input w-12 px-1 py-0.5 text-center text-xs"
                            value={coverageInput}
                            onChange={(e) => setCoverageInput(e.target.value)}
                            min={0}
                            autoFocus
                            aria-label="Meta de cobertura"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveCoverage();
                              if (e.key === "Escape") setEditingCoverage(null);
                            }}
                          />
                          <button
                            className="text-teal-600 hover:text-teal-800"
                            onClick={handleSaveCoverage}
                            title="Salvar"
                          >
                            ✓
                          </button>
                        </div>
                      ) : (
                        <button
                          className="badge badge-info cursor-pointer hover:opacity-80"
                          onClick={() => {
                            setEditingCoverage({ unitId: activeUnit.id, roleId: role.id });
                            setCoverageInput(String(needed));
                          }}
                          title="Editar meta de cobertura"
                        >
                          <Users className="mr-0.5 inline h-3 w-3" />
                          {needed}
                        </button>
                      )}
                    </div>
                  </td>
                  {weekDates.map((d) => {
                    const assigned = getAssigned(d, role.id);
                    const count = assigned.length;
                    const gap = needed - count;
                    const isToday = d === date;

                    let cellBg = "bg-white";
                    if (isToday) cellBg = "bg-teal-50/30";
                    if (gap > 0 && needed > 0) cellBg = isToday ? "bg-red-50/60" : "bg-red-50/40";
                    if (gap <= 0 && needed > 0) cellBg = isToday ? "bg-emerald-50/60" : "bg-emerald-50/40";

                    return (
                      <td key={d} className={`px-1.5 py-1.5 align-top ${cellBg} border-l border-slate-100`}>
                        <div className="space-y-1">
                          {assigned.map((sched) => (
                            <div
                              key={sched.id}
                              className="group flex items-center justify-between gap-1 rounded-lg bg-white px-2 py-1 shadow-sm border border-slate-100"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-700">
                                  {getPersonName(sched.personId)}
                                </p>
                                {sched.turns[0] && (
                                  <p className="flex items-center gap-0.5 text-[10px] text-slate-400">
                                    <Clock className="inline h-2.5 w-2.5" />
                                    {sched.turns[0].inicio}–{sched.turns[0].fim}
                                  </p>
                                )}
                              </div>
                              <button
                                className="opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-600 p-0.5"
                                onClick={() => handleRemove(sched.id)}
                                title="Remover da escala"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}

                          {gap > 0 && needed > 0 && (
                            <p className="flex items-center gap-0.5 text-[10px] font-medium text-red-500">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              falta {gap}
                            </p>
                          )}

                          <button
                            className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-slate-200 py-1 text-[10px] text-slate-400 hover:border-teal-400 hover:text-teal-600 transition"
                            onClick={() =>
                              setAssignPopup({
                                date: d,
                                roleId: role.id,
                                unitId: activeUnit.id
                              })
                            }
                          >
                            <Plus className="h-3 w-3" />
                            Escalar
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-emerald-200 bg-emerald-50" /> Completo
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-red-200 bg-red-50" /> Falta cobertura
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-slate-200 bg-white" /> Sem meta definida
        </span>
      </div>

      {assignPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <UserPlus className="h-4 w-4 text-teal-600" />
                  Escalar pessoa
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">
                  {rolesById[assignPopup.roleId]?.nome ?? "?"} — {dayName(assignPopup.date)}{" "}
                  {shortDate(assignPopup.date)}
                </p>
              </div>
              <button
                className="rounded-lg p-1 hover:bg-slate-100"
                onClick={() => setAssignPopup(null)}
                aria-label="Fechar"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="mb-3">
              <label className="text-xs font-medium text-slate-500">Turno</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {DEFAULT_SHIFTS.map((shift, idx) => (
                  <button
                    key={shift.nome}
                    className={`rounded-lg border px-3 py-2 text-xs transition ${
                      selectedShift === idx
                        ? "border-teal-500 bg-teal-50 text-teal-700 font-medium"
                        : "border-slate-200 text-slate-600 hover:border-teal-300"
                    }`}
                    onClick={() => setSelectedShift(idx)}
                  >
                    {shift.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">
                Pessoas disponiveis ({available.length})
              </label>
              <div className="mt-1 max-h-[250px] space-y-1 overflow-auto">
                {available.length === 0 && (
                  <p className="py-4 text-center text-xs text-slate-400">
                    Todos ja estao escalados neste dia
                  </p>
                )}
                {available.map((person) => {
                  const personRole = rolesById[person.cargoId];
                  return (
                    <button
                      key={person.id}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-left transition hover:border-teal-400 hover:bg-teal-50/50"
                      onClick={() => handleAssign(person.id)}
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-700">{person.nome}</p>
                        <p className="text-[11px] text-slate-400">
                          {personRole?.nome ?? "?"} · {person.type}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-teal-500" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
