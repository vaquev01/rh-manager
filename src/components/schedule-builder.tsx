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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertDialog } from "@/components/ui/alert-dialog";

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
    removeRole,
    duplicateDaySchedule,
    updatePersonData
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
  const [draggingDay, setDraggingDay] = useState<string | null>(null);
  const [targetDay, setTargetDay] = useState<string | null>(null);

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

  // ── Day Drag Handlers ──
  function handleDayDragStart(e: DragEvent, dayDate: string) {
    if (draggingScheduleId || draggingPersonId) return; // prevent conflict
    e.dataTransfer.setData(MIME, JSON.stringify({ type: "day", date: dayDate }));
    e.dataTransfer.effectAllowed = "copy";
    setDraggingDay(dayDate);
  }

  function handleDayDragOver(e: DragEvent, dayDate: string) {
    e.preventDefault();
    if (!draggingDay || draggingDay === dayDate) return;
    setTargetDay(dayDate);
    e.dataTransfer.dropEffect = "copy";
  }

  const [replConfirm, setReplConfirm] = useState<{ from: string; to: string } | null>(null);

  function handleDayDrop(e: DragEvent, toDay: string) {
    e.preventDefault();
    setTargetDay(null);
    setDraggingDay(null);

    try {
      const payload = JSON.parse(e.dataTransfer.getData(MIME));
      if (payload.type !== "day" || !activeUnit) return;

      const fromDay = payload.date;
      if (fromDay === toDay) return;

      setReplConfirm({ from: fromDay, to: toDay });
    } catch { }
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
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* ── LEFT: People Pool ── */}
      <Card className="flex w-full lg:w-[280px] shrink-0 flex-col h-full border-border bg-muted/50 shadow-none">
        <div className="px-4 py-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Users className="h-4 w-4 text-primary" />
            Equipe Disponível
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1">
            Arraste os cartões para a escala
          </p>
        </div>

        {/* Type Filter - Segmented Control */}
        <div className="px-4 pb-4">
          <div className="flex bg-slate-200/50 p-1 rounded-lg">
            <button
              onClick={() => setSelectedType("ALL")}
              className={cn(
                "flex-1 text-[10px] font-semibold py-1.5 rounded-md transition-all",
                selectedType === "ALL" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground/90"
              )}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedType("FIXO")}
              className={cn(
                "flex-1 text-[10px] font-semibold py-1.5 rounded-md transition-all",
                selectedType === "FIXO" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground/90"
              )}
            >
              Fixo
            </button>
            <button
              onClick={() => setSelectedType("FREELA")}
              className={cn(
                "flex-1 text-[10px] font-semibold py-1.5 rounded-md transition-all",
                selectedType === "FREELA" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground/90"
              )}
            >
              Freela
            </button>
          </div>
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
        <div className="px-4 pb-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              className="h-9 pl-9 text-xs bg-background border-border focus:border-primary/50 focus:ring-primary/20 transition-all shadow-sm"
              placeholder="Buscar por nome ou cargo..."
              value={searchPool}
              onChange={(e) => setSearchPool(e.target.value)}
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
                    "group relative flex items-center gap-3 rounded-xl border bg-background px-3 py-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-grab active:cursor-grabbing",
                    isBeingDragged && "opacity-40 ring-2 ring-primary ring-offset-2 scale-95"
                  )}
                >
                  {/* Hover Indicator */}
                  <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground/90 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {person.nome.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground/90">{person.nome}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Select
                        value={person.cargoId}
                        onValueChange={(val) => {
                          updatePersonData(person.id, { cargoId: val }, "ALTERAR_CARGO_RAPIDO");
                          toast("Cargo atualizado", "success");
                        }}
                      >
                        <SelectTrigger
                          className="h-4 px-1 text-[9px] bg-muted text-muted-foreground border-0 hover:bg-slate-200 cursor-pointer transition-colors w-auto gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>{personRole?.nome ?? "?"}</span>
                        </SelectTrigger>
                        <SelectContent>
                          {state.roles.map(r => (
                            <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-md border",
                        person.type === 'FIXO'
                          ? "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border-blue-100"
                          : "text-amber-700 bg-amber-50 border-amber-100"
                      )}>
                        {person.type === 'FIXO' ? 'Fixo' : 'Freela'}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPersonId(person.id);
                    }}
                  >
                    <Edit2 className="h-3.5 w-3.5 text-muted-foreground/70 hover:text-primary" />
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
              ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 scale-[1.02]"
              : isDragging && draggingScheduleId
                ? "border-red-300 bg-red-50 dark:bg-red-900/20/30 dark:bg-red-900/10 text-red-400"
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
            <Badge variant="outline" className="h-7 px-2.5 bg-muted/50">
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
        <Card className="flex-1 overflow-hidden flex flex-col shadow-md border-border">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs border-collapse relative">
              <thead className="sticky top-0 z-20">
                <tr className="bg-muted/50 border-b shadow-sm">
                  <th className="sticky left-0 z-30 bg-muted/95 backdrop-blur px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[200px] border-r shadow-[4px_0_24px_-8px_rgba(0,0,0,0.1)]">
                    Funcao / Cargo
                  </th>
                  {weekDates.map((d) => {
                    const isToday = d === date;
                    return (
                      <th
                        key={d}
                        draggable
                        onDragStart={(e) => handleDayDragStart(e, d)}
                        onDragOver={(e) => handleDayDragOver(e, d)}
                        onDrop={(e) => handleDayDrop(e, d)}
                        onDragLeave={() => setTargetDay(null)}
                        className={cn(
                          "px-2 py-3 text-center min-w-[160px] border-r last:border-r-0 transition-all cursor-grab active:cursor-grabbing hover:bg-muted/50 relative",
                          isToday ? "bg-primary/5" : "bg-background",
                          draggingDay === d && "opacity-50 dashed-border",
                          targetDay === d && "bg-primary/10 ring-2 ring-primary ring-inset z-10"
                        )}
                      >
                        <div className={cn("text-[10px] uppercase tracking-wider font-semibold mb-0.5 pointer-events-none", isToday ? "text-primary" : "text-muted-foreground")}>
                          {dayNameLong(d)}
                        </div>
                        <div className={cn("text-sm pointer-events-none", isToday ? "font-bold text-primary" : "font-medium text-foreground")}>
                          {shortDate(d)}
                        </div>

                        {/* Drag Handle Indicator */}
                        <div className="absolute top-1/2 left-2 -translate-y-1/2 opacity-0 hover:opacity-100 cursor-grab">
                          <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y relative">
                {visibleRoles.map((role) => {
                  const coverageKey = `${activeUnit.id}:${role.id}`;
                  const needed = coverageMap.get(coverageKey) ?? 0;

                  return (
                    <tr key={role.id} className="bg-background hover:bg-muted/30 transition-colors">
                      {/* Role header cell */}
                      <td className="sticky left-0 z-10 bg-background px-4 py-4 align-top border-r group-hover:bg-muted/30 shadow-[4px_0_24px_-8px_rgba(0,0,0,0.1)]">
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
                              "schedule-grid-cell px-2 py-2 align-top border-r last:border-r-0 transition-all duration-300 relative",
                              cellBg,
                              isDropTarget && "bg-primary/5 ring-inset ring-2 ring-primary/30 z-10",
                              isDragging && !isDropTarget && "bg-muted/50/80 grayscale-[0.5]"
                            )}
                            onDragOver={(e) => handleCellDragOver(e, { date: d, roleId: role.id })}
                            onDragLeave={handleCellDragLeave}
                            onDrop={(e) => handleCellDrop(e, { date: d, roleId: role.id })}
                          >
                            {/* Drop Target Indicator */}
                            {isDropTarget && (
                              <div className="absolute inset-2 border-2 border-dashed border-primary/40 rounded-lg flex items-center justify-center bg-background/50 backdrop-blur-[1px] pointer-events-none animate-in fade-in zoom-in duration-200">
                                <Plus className="h-6 w-6 text-primary" />
                              </div>
                            )}

                            <div className="space-y-2 min-h-[60px]">
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
                                      "group flex items-center gap-2 rounded-lg border bg-background pl-2 pr-1 py-1.5 shadow-sm transition-all hover:shadow-md hover:border-primary/30 cursor-grab active:cursor-grabbing",
                                      isMe && "opacity-30 scale-95 grayscale"
                                    )}
                                  >
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-[9px] font-bold text-muted-foreground/90 border border-white shadow-sm">
                                      {(person?.nome ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between">
                                        <p className="truncate text-[10px] font-semibold text-foreground/90 leading-tight">
                                          {person?.nome ?? sched.personId}
                                        </p>
                                      </div>
                                      {sched.turns[0] && (
                                        <p className="flex items-center gap-1 text-[9px] text-muted-foreground/70 mt-0.5">
                                          <Clock className="h-2.5 w-2.5" />
                                          {sched.turns[0].inicio}–{sched.turns[0].fim}
                                        </p>
                                      )}
                                    </div>

                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 -mr-0.5 rounded-full hover:bg-muted"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (person) setSelectedPersonId(person.id);
                                      }}
                                    >
                                      <Edit2 className="h-3 w-3 text-muted-foreground/70 hover:text-primary" />
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
                                      : "border-border text-muted-foreground/70"
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
                  <td className="sticky left-0 z-10 bg-background px-4 py-3 border-r border-b-0">
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
                  <td colSpan={7} className="bg-muted/30 border-b-0 p-2">
                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground/40 border-dashed border border-border rounded-lg mx-2">
                      +
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>


      <AlertDialog
        open={!!replConfirm}
        onOpenChange={(open) => !open && setReplConfirm(null)}
        title="Duplicar Escala"
        description={`Tem certeza que deseja copiar a escala de ${replConfirm ? dayNameLong(replConfirm.from) : ""} para ${replConfirm ? dayNameLong(replConfirm.to) : ""}? Isso substituirá toda a escala existente no dia de destino.`}
        confirmUnsafe
        onConfirm={() => {
          if (replConfirm && activeUnit) {
            duplicateDaySchedule(replConfirm.from, replConfirm.to, activeUnit.id);
            toast(`Escala copiada com sucesso`, "success");
          }
        }}
      />
    </div >
  );
}
