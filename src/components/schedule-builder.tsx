"use client";

import { type DragEvent, useCallback, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  GripVertical,
  Search,
  Trash2,
  User,
  Users,
  Edit2,
  Plus,
  X
} from "lucide-react";

import { useAppState } from "@/components/state-provider";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";
import { PersonType } from "@/lib/types";

// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const DAY_NAMES_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const DAY_NAMES_LONG = ["Domingo", "Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado"];

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

function dayNameShort(dateStr: string): string {
  return DAY_NAMES_SHORT[new Date(dateStr + "T12:00:00").getDay()];
}

function dayNameLong(dateStr: string): string {
  return DAY_NAMES_LONG[new Date(dateStr + "T12:00:00").getDay()];
}

const SHIFTS = [
  { id: "manha", label: "Manha", sub: "08:00–14:00", nome: "Manha", inicio: "08:00", fim: "14:00" },
  { id: "tarde", label: "Tarde", sub: "14:00–22:00", nome: "Tarde", inicio: "14:00", fim: "22:00" },
  { id: "integral", label: "Integral", sub: "08:00–18:00", nome: "Integral", inicio: "08:00", fim: "18:00" },
  { id: "noite", label: "Noite", sub: "18:00–02:00", nome: "Noite", inicio: "18:00", fim: "02:00" }
];

const MIME = "text/plain";

interface DropTarget {
  date: string;
  roleId: string;
}

export function ScheduleBuilder() {
  const {
    state,
    date,
    filters,
    assignPersonToSchedule,
    removeFromSchedule,
    updateCoverageTarget,
    setSelectedPersonId,
    addRole,
    removeRole
  } = useAppState();
  const { toast } = useToast();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedShiftIdx, setSelectedShiftIdx] = useState(2);
  const [selectedType, setSelectedType] = useState<PersonType | "ALL">("ALL");
  const [searchPool, setSearchPool] = useState("");
  const [draggingPersonId, setDraggingPersonId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<DropTarget | null>(null);
  const [editingCoverage, setEditingCoverage] = useState<{
    unitId: string;
    roleId: string;
  } | null>(null);
  const [coverageInput, setCoverageInput] = useState("");

  const trashRef = useRef<HTMLDivElement>(null);
  const [trashOver, setTrashOver] = useState(false);
  const [draggingScheduleId, setDraggingScheduleId] = useState<string | null>(null);

  const referenceDate = useMemo(() => addDays(date, weekOffset * 7), [date, weekOffset]);
  const weekDates = useMemo(() => getWeekDates(referenceDate), [referenceDate]);

  const filteredUnits = useMemo(() => {
    let units = state.units;
    if (filters.companyId) units = units.filter((u) => u.companyId === filters.companyId);
    if (filters.unitId) units = units.filter((u) => u.id === filters.unitId);
    return units;
  }, [state.units, filters.companyId, filters.unitId]);

  const activeUnit = filteredUnits[0];

  const visibleRoles = useMemo(() => {
    if (filters.cargoId) return state.roles.filter((r) => r.id === filters.cargoId);
    return state.roles;
  }, [state.roles, filters.cargoId]);

  const schedulesInWeek = useMemo(() => {
    const dateSet = new Set(weekDates);
    return state.schedules.filter(
      (s) => dateSet.has(s.date) && (!activeUnit || s.unidadeId === activeUnit.id)
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

  const allAvailablePeople = useMemo(
    () => state.people.filter((p) => p.status === "ATIVO" || p.status === "OFF_HOJE"),
    [state.people]
  );

  const rolesById = useMemo(
    () => Object.fromEntries(state.roles.map((r) => [r.id, r])),
    [state.roles]
  );

  const peopleById = useMemo(
    () => Object.fromEntries(state.people.map((p) => [p.id, p])),
    [state.people]
  );

  const getAssigned = useCallback(
    (dayDate: string, roleId: string) =>
      schedulesInWeek.filter((s) => {
        const schedRole = s.roleId ?? peopleById[s.personId]?.cargoId;
        return s.date === dayDate && schedRole === roleId;
      }),
    [schedulesInWeek, peopleById]
  );

  const poolPeople = useMemo(() => {
    let pool = allAvailablePeople;
    if (activeUnit) pool = pool.filter((p) => p.unitId === activeUnit.id || p.companyId === activeUnit.companyId);
    if (selectedType !== "ALL") pool = pool.filter((p) => p.type === selectedType);
    if (searchPool.trim()) {
      const q = searchPool.toLowerCase();
      pool = pool.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          (rolesById[p.cargoId]?.nome ?? "").toLowerCase().includes(q)
      );
    }
    return pool;
  }, [allAvailablePeople, activeUnit, selectedType, searchPool, rolesById]);

  const selectedShift = SHIFTS[selectedShiftIdx];

  // ── Drag handlers: pool → grid ──
  function handlePoolDragStart(e: DragEvent, personId: string) {
    e.dataTransfer.setData(MIME, JSON.stringify({ type: "pool", personId }));
    e.dataTransfer.effectAllowed = "copy";
    setDraggingPersonId(personId);
    setDraggingScheduleId(null);
  }

  function handleChipDragStart(e: DragEvent, scheduleId: string, personId: string) {
    e.dataTransfer.setData(MIME, JSON.stringify({ type: "move", scheduleId, personId }));
    e.dataTransfer.effectAllowed = "move";
    setDraggingScheduleId(scheduleId);
    setDraggingPersonId(personId);
  }

  function handleCellDragOver(e: DragEvent, target: DropTarget) {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggingScheduleId ? "move" : "copy";
    setDragOverTarget(target);
  }

  function handleCellDragLeave() {
    setDragOverTarget(null);
  }

  function handleCellDrop(e: DragEvent, target: DropTarget) {
    e.preventDefault();
    setDragOverTarget(null);
    setDraggingPersonId(null);

    try {
      const payload = JSON.parse(e.dataTransfer.getData(MIME));
      if (!activeUnit) return;

      if (payload.type === "move" && payload.scheduleId) {
        removeFromSchedule(payload.scheduleId);
      }

      const alreadyOnDay = schedulesInWeek.find(
        (s) => s.date === target.date && s.personId === payload.personId
      );
      if (alreadyOnDay && payload.type !== "move") {
        toast(`${peopleById[payload.personId]?.nome ?? "Pessoa"} ja esta escalado(a) neste dia`, "warning");
        return;
      }

      assignPersonToSchedule(
        payload.personId,
        target.date,
        activeUnit.id,
        target.roleId,
        [{ nome: selectedShift.nome, inicio: selectedShift.inicio, fim: selectedShift.fim, unidadeId: activeUnit.id }]
      );
      toast(
        `${peopleById[payload.personId]?.nome ?? "?"} → ${rolesById[target.roleId]?.nome ?? "?"} (${dayNameShort(target.date)})`,
        "success"
      );
    } catch {
      /* ignore invalid data */
    }
    setDraggingScheduleId(null);
  }

  function handleDragEnd() {
    setDraggingPersonId(null);
    setDragOverTarget(null);
    setDraggingScheduleId(null);
    setTrashOver(false);
  }

  // ── Trash drop zone (for removing) ──
  function handleTrashDragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setTrashOver(true);
  }

  function handleTrashDrop(e: DragEvent) {
    e.preventDefault();
    setTrashOver(false);
    try {
      const payload = JSON.parse(e.dataTransfer.getData(MIME));
      if (payload.type === "move" && payload.scheduleId) {
        removeFromSchedule(payload.scheduleId);
        toast(`${peopleById[payload.personId]?.nome ?? "Pessoa"} removido(a) da escala`, "info");
      }
    } catch {
      /* ignore */
    }
    handleDragEnd();
  }

  function handleSaveCoverage() {
    if (!editingCoverage) return;
    const val = parseInt(coverageInput, 10);
    if (isNaN(val) || val < 0) return;
    updateCoverageTarget(editingCoverage.unitId, editingCoverage.roleId, val);
    toast("Meta de cobertura atualizada", "success");
    setEditingCoverage(null);
  }

  // ── Weekly stats ──
  const weekStats = useMemo(() => {
    let totalNeeded = 0;
    let totalAssigned = 0;
    for (const d of weekDates) {
      for (const role of visibleRoles) {
        const key = activeUnit ? `${activeUnit.id}:${role.id}` : "";
        const needed = coverageMap.get(key) ?? 0;
        const assigned = getAssigned(d, role.id).length;
        totalNeeded += needed;
        totalAssigned += assigned;
      }
    }
    return { totalNeeded, totalAssigned, gap: totalNeeded - totalAssigned };
  }, [weekDates, visibleRoles, activeUnit, coverageMap, getAssigned]);

  if (!activeUnit) {
    return (
      <Card className="flex flex-col items-center justify-center p-16 text-center border-dashed">
        <Calendar className="h-10 w-10 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground">Nenhuma unidade selecionada</h3>
        <p className="text-sm text-muted-foreground">Selecione uma unidade nos filtros para montar a escala</p>
      </Card>
    );
  }

  const isDragging = draggingPersonId !== null;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* ── LEFT: People Pool ── */}
      <Card className="flex w-full lg:w-[280px] shrink-0 flex-col h-full border-slate-200">
        <div className="border-b px-4 py-3 bg-muted/30">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-primary" />
            Equipe disponivel
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Arraste para o quadro ao lado
          </p>
        </div>

        {/* Type Filter */}
        <div className="px-3 py-2 bg-slate-50 border-b flex gap-1">
          <Button
            variant={selectedType === "ALL" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedType("ALL")}
            className="flex-1 h-7 text-[10px]"
          >
            Todos
          </Button>
          <Button
            variant={selectedType === "FIXO" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedType("FIXO")}
            className="flex-1 h-7 text-[10px]"
          >
            Fixo
          </Button>
          <Button
            variant={selectedType === "FREELA" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedType("FREELA")}
            className="flex-1 h-7 text-[10px]"
          >
            Freela
          </Button>
        </div>

        {/* Shift selector */}
        <div className="border-b px-3 py-3 bg-muted/10">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
            Turno ao escalar
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SHIFTS.map((shift, idx) => (
              <Button
                key={shift.id}
                variant={selectedShiftIdx === idx ? "primary" : "outline"}
                size="sm"
                className={cn(
                  "h-auto flex-col items-start px-2 py-1.5 text-left transition-all",
                  selectedShiftIdx === idx ? "border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary" : "text-muted-foreground"
                )}
                onClick={() => setSelectedShiftIdx(idx)}
              >
                <div className="font-semibold text-[11px] leading-none mb-0.5">{shift.label}</div>
                <div className="text-[9px] opacity-80 font-mono">{shift.inicio}-{shift.fim}</div>
              </Button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              className="h-9 pl-8 text-xs bg-muted/20"
              placeholder="Buscar pessoa..."
              value={searchPool}
              onChange={(e) => setSearchPool(e.target.value)}
              aria-label="Buscar pessoa"
            />
          </div>
        </div>

        {/* People list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
          <div className="space-y-2">
            {poolPeople.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center">
                <Search className="h-8 w-8 text-muted-foreground/30 mb-2" />
                Nenhuma pessoa encontrada
              </div>
            )}
            {poolPeople.map((person) => {
              const personRole = rolesById[person.cargoId];
              const isBeingDragged = draggingPersonId === person.id;
              return (
                <div
                  key={person.id}
                  draggable
                  onDragStart={(e) => handlePoolDragStart(e, person.id)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border bg-card px-3 py-2 shadow-sm transition-all hover:shadow-md hover:border-primary/50 cursor-grab active:cursor-grabbing",
                    isBeingDragged && "opacity-50 ring-2 ring-primary ring-offset-2"
                  )}
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {person.nome.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <div className="truncate">
                      <p className="truncate text-xs font-medium text-foreground">{person.nome}</p>
                      <p className="truncate text-[10px] text-muted-foreground flex items-center gap-1">
                        <Badge variant="outline" className="h-3.5 px-1 text-[8px]">{person.type.charAt(0)}</Badge>
                        {personRole?.nome ?? "?"}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPersonId(person.id);
                    }}
                  >
                    <Edit2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trash zone */}
        <div
          ref={trashRef}
          onDragOver={handleTrashDragOver}
          onDragLeave={() => setTrashOver(false)}
          onDrop={handleTrashDrop}
          className={cn(
            "mx-3 mb-3 mt-auto flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 text-xs font-medium transition-all duration-200",
            trashOver
              ? "border-red-500 bg-red-50 text-red-600 scale-[1.02]"
              : isDragging && draggingScheduleId
                ? "border-red-300 bg-red-50/30 text-red-400"
                : "border-muted text-muted-foreground"
          )}
        >
          <Trash2 className={cn("h-4 w-4", trashOver && "animate-bounce")} />
          {draggingScheduleId ? "Solte aqui para remover" : "Lixeira"}
        </div>
      </Card>

      {/* ── RIGHT: Schedule Grid ── */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden h-full">
        {/* Header bar */}
        <Card className="flex shrink-0 items-center justify-between p-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground leading-none">
                  {activeUnit.nome}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Escala Semanal</p>
              </div>
            </div>

            <div className="h-8 w-px bg-border mx-2" />

            <div className="flex items-center gap-1 rounded-md bg-muted p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setWeekOffset((w) => w - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-3 text-xs font-medium"
                onClick={() => setWeekOffset(0)}
              >
                Hoje
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setWeekOffset((w) => w + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex items-center gap-3 text-xs">
            <Badge variant="outline" className="h-7 px-2.5 bg-slate-50">
              {weekStats.totalAssigned} / {weekStats.totalNeeded} escalados
            </Badge>

            {weekStats.gap > 0 ? (
              <Badge variant="danger" className="h-7 px-2.5">
                <AlertTriangle className="mr-1.5 h-3 w-3" />
                {weekStats.gap} vagas abertas
              </Badge>
            ) : weekStats.totalNeeded > 0 ? (
              <Badge variant="ok" className="h-7 px-2.5">
                Escala completa
              </Badge>
            ) : null}
          </div>
        </Card>

        {/* Grid */}
        <Card className="flex-1 overflow-hidden flex flex-col shadow-md border-slate-200">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs border-collapse relative">
              <thead className="sticky top-0 z-20">
                <tr className="bg-slate-50 border-b shadow-sm">
                  <th className="sticky left-0 z-30 bg-slate-100/95 backdrop-blur px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[200px] border-r">
                    Funcao / Cargo
                  </th>
                  {weekDates.map((d) => {
                    const isToday = d === date;
                    return (
                      <th
                        key={d}
                        className={cn(
                          "px-2 py-3 text-center min-w-[160px] border-r last:border-r-0 transition-colors",
                          isToday ? "bg-primary/5" : "bg-white"
                        )}
                      >
                        <div className={cn("text-[10px] uppercase tracking-wider font-semibold mb-0.5", isToday ? "text-primary" : "text-muted-foreground")}>
                          {dayNameLong(d)}
                        </div>
                        <div className={cn("text-sm", isToday ? "font-bold text-primary" : "font-medium text-foreground")}>
                          {shortDate(d)}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibleRoles.map((role) => {
                  const coverageKey = `${activeUnit.id}:${role.id}`;
                  const needed = coverageMap.get(coverageKey) ?? 0;

                  return (
                    <tr key={role.id} className="bg-white hover:bg-slate-50/30 transition-colors">
                      {/* Role header cell */}
                      <td className="sticky left-0 z-10 bg-white px-4 py-4 align-top border-r group-hover:bg-slate-50/30">
                        <div className="flex flex-col gap-2">
                          <div>
                            <p className="font-semibold text-foreground text-sm flex items-center gap-2 group/role">
                              {role.nome}
                              <button
                                className="opacity-0 group-hover/role:opacity-100 hover:text-red-500 transition-opacity"
                                onClick={() => {
                                  if (confirm(`Remover cargo ${role.nome}?`)) {
                                    removeRole(role.id);
                                  }
                                }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{role.familia} · {role.nivel}</p>
                          </div>

                          <div className="mt-1">
                            {editingCoverage?.unitId === activeUnit.id &&
                              editingCoverage?.roleId === role.id ? (
                              <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                                <Input
                                  type="number"
                                  className="h-7 w-16 text-center text-xs px-1"
                                  value={coverageInput}
                                  onChange={(e) => setCoverageInput(e.target.value)}
                                  min={0}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveCoverage();
                                    if (e.key === "Escape") setEditingCoverage(null);
                                  }}
                                />
                                <Button
                                  size="sm"
                                  className="h-7 px-2 text-[10px]"
                                  onClick={handleSaveCoverage}
                                >
                                  OK
                                </Button>
                              </div>
                            ) : (
                              <button
                                className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1.5 text-[10px] font-semibold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/20"
                                onClick={() => {
                                  setEditingCoverage({ unitId: activeUnit.id, roleId: role.id });
                                  setCoverageInput(String(needed));
                                }}
                              >
                                <Users className="h-3 w-3" />
                                {needed} pessoas/dia
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Day cells */}
                      {weekDates.map((d) => {
                        const assigned = getAssigned(d, role.id);
                        const count = assigned.length;
                        const gap = needed - count;
                        const isToday = d === date;
                        const isDropTarget =
                          dragOverTarget?.date === d && dragOverTarget?.roleId === role.id;

                        let cellBg = "";
                        if (isToday) cellBg = "bg-primary/5";

                        const emptySlots = Math.max(0, gap);

                        return (
                          <td
                            key={d}
                            className={cn(
                              "schedule-grid-cell px-2 py-2 align-top border-r last:border-r-0 transition-all duration-200",
                              cellBg,
                              isDropTarget && "bg-primary/10 ring-2 ring-inset ring-primary/50",
                              isDragging && !isDropTarget && "bg-slate-50/50"
                            )}
                            onDragOver={(e) => handleCellDragOver(e, { date: d, roleId: role.id })}
                            onDragLeave={handleCellDragLeave}
                            onDrop={(e) => handleCellDrop(e, { date: d, roleId: role.id })}
                          >
                            <div className="space-y-1.5 min-h-[60px]">
                              {/* Assigned people chips */}
                              {assigned.map((sched) => {
                                const person = peopleById[sched.personId];
                                const isMe = draggingScheduleId === sched.id;
                                return (
                                  <div
                                    key={sched.id}
                                    draggable
                                    onDragStart={(e) => handleChipDragStart(e, sched.id, sched.personId)}
                                    onDragEnd={handleDragEnd}
                                    className={cn(
                                      "group flex items-center gap-2 rounded-md border bg-white px-2 py-1.5 shadow-sm transition-all hover:shadow-md hover:border-primary/40 cursor-grab active:cursor-grabbing pr-1",
                                      isMe && "opacity-40 scale-95"
                                    )}
                                  >
                                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                                      {(person?.nome ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-[11px] font-medium text-foreground leading-tight">
                                        {person?.nome ?? sched.personId}
                                      </p>
                                      {sched.turns[0] && (
                                        <p className="flex items-center gap-1 text-[9px] text-muted-foreground mt-0.5">
                                          <Clock className="h-2.5 w-2.5" />
                                          {sched.turns[0].inicio}–{sched.turns[0].fim}
                                        </p>
                                      )}
                                    </div>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-5 w-5 opacity-0 group-hover:opacity-100 -mr-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (person) setSelectedPersonId(person.id);
                                      }}
                                    >
                                      <Edit2 className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                  </div>
                                );
                              })}

                              {/* Empty slots visualization */}
                              {Array.from({ length: emptySlots }, (_, i) => (
                                <div
                                  key={`empty-${i}`}
                                  className={cn(
                                    "flex items-center justify-center gap-1.5 rounded-md border border-dashed py-2 text-[10px] font-medium transition-colors",
                                    isDragging
                                      ? "border-primary/40 bg-primary/5 text-primary"
                                      : "border-slate-200 text-slate-400"
                                  )}
                                >
                                  <User className="h-3 w-3 opacity-50" />
                                  <span>Vaga {i + 1}</span>
                                </div>
                              ))}

                              {/* No coverage set or Full */}
                              {needed === 0 && count === 0 && (
                                <div className="h-full flex items-center justify-center min-h-[40px]">
                                  <div className="h-1 w-1 rounded-full bg-slate-200" />
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Add Role Row */}
                <tr>
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-b-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed text-xs h-8"
                      onClick={() => {
                        const nome = prompt("Nome do novo cargo:");
                        if (nome) addRole(nome);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-2" />
                      Adicionar Cargo
                    </Button>
                  </td>
                  <td colSpan={7} className="bg-slate-50/50"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
