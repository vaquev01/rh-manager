"use client";

import { type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  CreditCard,
  DollarSign,
  Download,
  FileWarning,
  Info,
  Lock,
  TrendingUp,
  Unlock,
  UserRound,
  Users,
  X
} from "lucide-react";

import { useAppState } from "@/components/state-provider";
import { useToast } from "@/components/toast";
import { asDateLabel } from "@/lib/date";
import { asHours, money, percent } from "@/lib/format";
import {
  dashboardHighlights,
  docsBadge,
  groupedByOrg,
  personHistory,
  pixBadge
} from "@/lib/selectors";
import { AdditionalDay, Person } from "@/lib/types";

const STATUS_LABEL: Record<Person["status"], string> = {
  ATIVO: "Ativo",
  FERIAS: "Ferias",
  AFASTADO: "Afastado",
  OFF_HOJE: "Off hoje"
};

const TYPE_LABEL: Record<Person["type"], string> = {
  FIXO: "Fixo",
  FREELA: "Freela"
};

const MODE_LABEL = {
  CUSTO: "Modo Custo",
  PAGAMENTO: "Modo Pagamento"
};

const HOURS_SOURCE_LABEL = {
  ESCALA_PREVISTA: "Escala prevista",
  APONTAMENTO_REAL: "Apontamento real"
};

const PERFORMANCE_LABEL = {
  VERDE: "Boa",
  AMARELO: "Atencao",
  VERMELHO: "Critica"
};

interface AdditionalDraft {
  tipo: AdditionalDay["tipo"];
  valor: number;
  descricao: string;
  pagavelViaPix: boolean;
}

const emptyAdditionalDraft: AdditionalDraft = {
  tipo: "TRANSPORTE",
  valor: 0,
  descricao: "",
  pagavelViaPix: true
};

export default function DashboardPage() {
  const {
    state,
    date,
    filters,
    paymentContext,
    checkPermission,
    updatePersonData,
    updateScheduleTurn,
    upsertHours,
    validateHours,
    setPaymentMode,
    setHoursSource,
    setGlobalStandardHours,
    setGlobalAdditional,
    addIndividualAdditional,
    removeIndividualAdditional,
    setPaymentStatus,
    closePaymentsDay,
    reopenPaymentsDay,
    downloadPixCsv,
    downloadDayStatementCsv,
    downloadMonthlyPersonReportCsv
  } = useAppState();

  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [hoursDrafts, setHoursDrafts] = useState<Record<string, string>>({});
  const [hoursReasonDrafts, setHoursReasonDrafts] = useState<Record<string, string>>({});
  const [individualAdditionalDrafts, setIndividualAdditionalDrafts] = useState<
    Record<string, AdditionalDraft>
  >({});

  const [expandedPersonIds, setExpandedPersonIds] = useState<Set<string>>(new Set());
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [quickFilter, setQuickFilter] = useState<string | null>(null);

  const modalPanelRef = useRef<HTMLDivElement | null>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  const closePersonDetails = useCallback(() => {
    setSelectedPersonId(null);
    window.setTimeout(() => {
      lastActiveElementRef.current?.focus();
    }, 0);
  }, []);

  const openPersonDetails = useCallback(
    (event: MouseEvent<HTMLButtonElement>, personId: string) => {
      lastActiveElementRef.current = event.currentTarget;
      setSelectedPersonId(personId);
    },
    []
  );

  useEffect(() => {
    if (!selectedPersonId) {
      return;
    }

    const panel = modalPanelRef.current;
    if (panel) {
      const initialFocus = panel.querySelector<HTMLElement>("[data-modal-initial-focus]");
      (initialFocus ?? panel).focus();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePersonDetails();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const currentPanel = modalPanelRef.current;
      if (!currentPanel) {
        return;
      }

      const focusable = Array.from(
        currentPanel.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
        )
      ).filter((item) => !item.hasAttribute("disabled") && item.tabIndex !== -1);

      if (focusable.length === 0) {
        event.preventDefault();
        currentPanel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const isInside = Boolean(active && currentPanel.contains(active));

      if (event.shiftKey) {
        if (!isInside || active === first) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!isInside) {
        event.preventDefault();
        first.focus();
        return;
      }

      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closePersonDetails, selectedPersonId]);

  const togglePersonExpanded = (personId: string) => {
    setExpandedPersonIds((previous) => {
      const next = new Set(previous);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  };

  const [globalAdditionalDraft, setGlobalAdditionalDraft] = useState<{
    tipo: AdditionalDay["tipo"];
    valor: number;
    aplicarPara: AdditionalDay["aplicarPara"];
    pagavelViaPix: boolean;
    descricao: string;
  }>(() => ({
    tipo: paymentContext.config.additionalGlobal?.tipo ?? "ALIMENTACAO",
    valor: paymentContext.config.additionalGlobal?.valor ?? 0,
    aplicarPara: paymentContext.config.additionalGlobal?.aplicarPara ?? "SO_FREELAS",
    pagavelViaPix: paymentContext.config.additionalGlobal?.pagavelViaPix ?? true,
    descricao: paymentContext.config.additionalGlobal?.descricao ?? ""
  }));

  const groupedRaw = useMemo(
    () => groupedByOrg(state, filters, date),
    [state, filters, date]
  );

  const grouped = useMemo(() => {
    let filtered = groupedRaw;

    if (searchName.trim()) {
      const q = searchName.trim().toLowerCase();
      filtered = filtered
        .map((g) => ({ ...g, people: g.people.filter((p) => p.nome.toLowerCase().includes(q)) }))
        .filter((g) => g.people.length > 0);
    }

    if (quickFilter) {
      const predicate = (p: Person) => {
        switch (quickFilter) {
          case "sem-pix": return !p.pixKey;
          case "docs-pendentes": return docsBadge(state, p.id) !== "OK";
          case "freelas": return p.type === "FREELA";
          case "performance-critica": return p.performance.dia === "VERMELHO";
          default: return true;
        }
      };
      filtered = filtered
        .map((g) => ({ ...g, people: g.people.filter(predicate) }))
        .filter((g) => g.people.length > 0);
    }

    return filtered;
  }, [groupedRaw, searchName, quickFilter, state]);

  const totalPeopleCount = useMemo(
    () => grouped.reduce((acc, g) => acc + g.people.length, 0),
    [grouped]
  );

  const highlights = useMemo(
    () => dashboardHighlights(state, filters, date),
    [state, filters, date]
  );

  const selectedPerson = selectedPersonId
    ? state.people.find((person) => person.id === selectedPersonId)
    : undefined;

  const selectedHistory = selectedPerson
    ? personHistory(state, selectedPerson.id)
    : undefined;

  const additionalTypes = state.additionalTypes.filter((type) => type.ativo);

  const rolesById = useMemo(
    () => Object.fromEntries(state.roles.map((role) => [role.id, role])),
    [state.roles]
  );

  const unitsById = useMemo(
    () => Object.fromEntries(state.units.map((unit) => [unit.id, unit])),
    [state.units]
  );

  const lineByPersonId = useMemo(
    () => Object.fromEntries(paymentContext.lines.map((line) => [line.person.id, line])),
    [paymentContext.lines]
  );

  const canEditStatus = checkPermission("EDITAR_STATUS");
  const canEditPayRule = checkPermission("EDITAR_REMUNERACAO_REGRA");
  const canClose = checkPermission("FECHAR_PAGAMENTOS_DIA");
  const canReopen = checkPermission("REABRIR_PAGAMENTOS_DIA");

  const validatedCount = paymentContext.lines.filter((l) => l.validadoHoras).length;
  const totalLines = paymentContext.lines.length;
  const closingProgress = totalLines > 0 ? validatedCount / totalLines : 0;

  const { toast } = useToast();

  return (
    <div className="page-enter grid gap-4 lg:grid-cols-[1.8fr,1fr]">
      <section className="space-y-4">
        <div className="kpi-grid">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm kpi-card kpi-danger">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Buracos de escala</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-800">{highlights.buracosEscala.length}</p>
            <p className="mt-1 text-xs text-slate-400">lacunas por cargo/unidade</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm kpi-card kpi-warning">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                <CreditCard className="h-4 w-4 text-amber-500" />
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Sem PIX</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-800">{highlights.semPixEscalados.length}</p>
            <p className="mt-1 text-xs text-slate-400">escalados sem chave</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm kpi-card kpi-danger">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                <FileWarning className="h-4 w-4 text-red-500" />
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Docs criticos</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-800">{highlights.docsCriticosPendentes}</p>
            <p className="mt-1 text-xs text-slate-400">criticidade alta pendente</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm kpi-card kpi-info">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <Users className="h-4 w-4 text-blue-500" />
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Pagamentos</span>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800">{highlights.pagamentosPendentes}</span>
              <span className="text-sm text-slate-400">/</span>
              <span className="text-lg font-semibold text-emerald-600">{highlights.pagamentosFechados}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">pendentes / fechados</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm kpi-card kpi-accent">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                <TrendingUp className="h-4 w-4 text-teal-600" />
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Custo do dia</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-800">{money(highlights.custoEstimado)}</p>
            <p className="mt-1 text-xs text-slate-400">{MODE_LABEL[paymentContext.config.mode]}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Filtro rapido:</span>
          {[
            { key: "sem-pix", label: `Sem PIX (${highlights.semPixEscalados.length})`, color: "badge-danger" },
            { key: "docs-pendentes", label: `Docs pendentes (${highlights.docsCriticosPendentes})`, color: "badge-danger" },
            { key: "freelas", label: "Freelas", color: "badge-warn" },
            { key: "performance-critica", label: "Performance critica", color: "badge-danger" }
          ].map((chip) => (
            <button
              key={chip.key}
              className={`badge cursor-pointer transition ${quickFilter === chip.key ? "ring-2 ring-teal-500 ring-offset-1" : chip.color} hover:opacity-80`}
              onClick={() => setQuickFilter(quickFilter === chip.key ? null : chip.key)}
            >
              {chip.label}
            </button>
          ))}
          {quickFilter && (
            <button
              className="text-xs text-slate-400 underline hover:text-slate-600"
              onClick={() => setQuickFilter(null)}
            >
              Limpar
            </button>
          )}
        </div>

        {highlights.buracosEscala.length > 0 && (
          <div className="panel p-4">
            <p className="text-sm font-semibold text-slate-700">Alertas de cobertura</p>
            <ul className="mt-2 space-y-2 text-sm">
              {highlights.buracosEscala.map((gap) => (
                <li key={`${gap.unitName}-${gap.roleName}`} className="flex items-center gap-2 text-slate-600">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>
                    {gap.unitName} / {gap.roleName}: faltam {gap.falta} pessoa(s)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="panel p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Organograma vivo + escala do dia</h2>
              <p className="mt-0.5 text-xs text-slate-400">Agrupado por lider / time / cargo · <strong>{totalPeopleCount}</strong> pessoa(s)</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                className="input w-44 text-xs"
                placeholder="Buscar por nome…"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                aria-label="Buscar pessoa por nome"
              />
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500">{asDateLabel(date)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {grouped.length === 0 && (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <Users className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">Nenhuma pessoa encontrada para os filtros atuais.</p>
                <p className="text-xs text-slate-400">Tente ajustar empresa, unidade ou cargo nos filtros acima.</p>
              </div>
            )}

            {grouped.map((group) => (
              <article key={`${group.leaderLabel}-${group.teamLabel}-${group.roleLabel}`} className="rounded-2xl border border-slate-200/60 bg-white/70 p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="badge badge-ok">Lider: {group.leaderLabel}</span>
                  <span className="badge badge-warn">Time: {group.teamLabel}</span>
                  <span className="badge badge-info">Cargo: {group.roleLabel}</span>
                  <span className="ml-auto text-[11px] text-slate-400">{group.people.length} pessoa(s)</span>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {group.people.map((person) => {
                    const line = lineByPersonId[person.id];
                    const schedule = line?.schedule;
                    const unit = schedule ? unitsById[schedule.unidadeId] : undefined;
                    const personDocBadge = docsBadge(state, person.id);
                    const personPixBadge = pixBadge(person);
                    const currentHours = line?.hours ?? 0;
                    const hoursInput = hoursDrafts[person.id] ?? String(currentHours);
                    const reasonInput = hoursReasonDrafts[person.id] ?? "";
                    const isExpanded = expandedPersonIds.has(person.id);

                    return (
                      <div key={person.id} className="person-card rounded-xl border border-slate-200/80 bg-white p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
                              {person.nome.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{person.nome}</p>
                              <p className="text-[11px] text-slate-400">{rolesById[person.cargoId]?.nome ?? "Cargo"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className={`semaphore ${person.performance.dia.toLowerCase()}`} title={`Performance ${PERFORMANCE_LABEL[person.performance.dia]}`} />
                            <button
                              className="button ghost px-2 py-1 text-[11px]"
                              onClick={(event) => openPersonDetails(event, person.id)}
                            >
                              Detalhes
                            </button>
                          </div>
                        </div>

                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          <span className={`badge ${person.type === "FREELA" ? "badge-warn" : "badge-ok"}`}>{TYPE_LABEL[person.type]}</span>
                          <span className="badge badge-info">{STATUS_LABEL[person.status]}</span>
                          <span className={`badge ${personDocBadge === "OK" ? "badge-ok" : "badge-danger"}`}>
                            DOC {personDocBadge}
                          </span>
                          <span className={`badge ${personPixBadge === "OK" ? "badge-ok" : "badge-danger"}`}>
                            PIX {personPixBadge}
                          </span>
                        </div>

                        <div className="mt-2.5 rounded-lg bg-slate-50/80 p-2 text-xs text-slate-600">
                          {schedule ? (
                            <div className="flex items-start gap-2">
                              <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                              <div>
                                <p className="font-medium text-slate-700">
                                  {schedule.turns
                                    .map((turn) => `${turn.nome} ${turn.inicio}–${turn.fim}`)
                                    .join(" · ")}
                                </p>
                                <p className="mt-0.5 text-[11px] text-slate-400">{unit?.nome ?? "Unidade nao definida"}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-slate-400">Sem escala para hoje</p>
                          )}
                        </div>

                        {line && (
                          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                            <span>Horas: <strong className="text-slate-700">{asHours(currentHours)}</strong></span>
                            <span>Total: <strong className="text-slate-700">{money(line.total)}</strong></span>
                          </div>
                        )}

                        <button
                          className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200/60 bg-slate-50/50 py-1.5 text-[11px] font-medium text-slate-400 transition hover:bg-slate-100/80 hover:text-slate-600"
                          onClick={() => togglePersonExpanded(person.id)}
                        >
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {isExpanded ? "Recolher edicao" : "Editar"}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 space-y-2 border-t border-slate-100 pt-2">
                            <label className="text-xs text-slate-500">
                              Status
                              <select
                                className="select mt-1"
                                disabled={!canEditStatus || paymentContext.locked}
                                value={person.status}
                                onChange={(event) =>
                                  updatePersonData(
                                    person.id,
                                    { status: event.target.value as Person["status"] },
                                    "AJUSTAR_STATUS_PESSOA"
                                  )
                                }
                              >
                                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                              </select>
                            </label>

                            <div className="grid grid-cols-2 gap-2">
                              <label className="text-xs text-slate-500">
                                Tipo
                                <select
                                  className="select mt-1"
                                  disabled={!canEditPayRule || paymentContext.locked}
                                  value={person.type}
                                  onChange={(event) =>
                                    updatePersonData(
                                      person.id,
                                      { type: event.target.value as Person["type"] },
                                      "AJUSTAR_TIPO_PESSOA"
                                    )
                                  }
                                >
                                  <option value="FIXO">Fixo</option>
                                  <option value="FREELA">Freela</option>
                                </select>
                              </label>

                              <label className="text-xs text-slate-500">
                                Cargo
                                <select
                                  className="select mt-1"
                                  disabled={!canEditPayRule || paymentContext.locked}
                                  value={person.cargoId}
                                  onChange={(event) =>
                                    updatePersonData(
                                      person.id,
                                      { cargoId: event.target.value },
                                      "AJUSTAR_CARGO_PESSOA"
                                    )
                                  }
                                >
                                  {state.roles.map((role) => (
                                    <option key={role.id} value={role.id}>{role.nome}</option>
                                  ))}
                                </select>
                              </label>
                            </div>

                            <div className="grid grid-cols-[1fr,1fr,auto] items-end gap-2">
                              <label className="text-xs text-slate-500">
                                Horas hoje
                                <input
                                  className="input mt-1"
                                  type="number"
                                  min={0}
                                  step={0.25}
                                  disabled={paymentContext.locked}
                                  value={hoursInput}
                                  onChange={(event) =>
                                    setHoursDrafts((previous) => ({
                                      ...previous,
                                      [person.id]: event.target.value
                                    }))
                                  }
                                />
                              </label>
                              <label className="text-xs text-slate-500">
                                Motivo
                                <input
                                  className="input mt-1"
                                  placeholder="Opcional"
                                  disabled={paymentContext.locked}
                                  value={reasonInput}
                                  onChange={(event) =>
                                    setHoursReasonDrafts((previous) => ({
                                      ...previous,
                                      [person.id]: event.target.value
                                    }))
                                  }
                                />
                              </label>
                              <button
                                className="button primary"
                                disabled={paymentContext.locked}
                                onClick={() =>
                                  upsertHours(
                                    person.id,
                                    Number(hoursInput || "0"),
                                    reasonInput || undefined
                                  )
                                }
                              >
                                Salvar
                              </button>
                            </div>

                            {line?.overrideFlag && (
                              <p className="flex items-center gap-1 text-[11px] text-amber-700">
                                <Info className="h-3 w-3" />
                                Override ativo {line.motivoOverride ? `(${line.motivoOverride})` : ""}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <section className="panel p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                <DollarSign className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Calculadora do dia</h2>
                <p className="text-[11px] text-slate-400">{paymentContext.lines.length} escalados</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-slate-800">{money(paymentContext.totalGeral)}</p>
              <p className="text-[11px] text-slate-400">total geral</p>
            </div>
          </div>

          {totalLines > 0 && (
            <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">Progresso do fechamento</span>
                <span className="font-semibold text-slate-700">{validatedCount}/{totalLines} validados</span>
              </div>
              <div className="progress-bar mt-1.5">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.round(closingProgress * 100)}%`, background: closingProgress >= 1 ? '#10b981' : closingProgress >= 0.5 ? '#3b82f6' : '#f59e0b' }}
                />
              </div>
              {paymentContext.locked && (
                <p className="mt-1 text-[11px] font-medium text-emerald-600">Dia fechado com sucesso</p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`button ${paymentContext.config.mode === "CUSTO" ? "primary" : "ghost"}`}
                disabled={paymentContext.locked}
                onClick={() => setPaymentMode("CUSTO")}
              >
                <DollarSign className="mr-1 inline h-3.5 w-3.5" />
                Custo
              </button>
              <button
                className={`button ${paymentContext.config.mode === "PAGAMENTO" ? "primary" : "ghost"}`}
                disabled={paymentContext.locked}
                onClick={() => setPaymentMode("PAGAMENTO")}
              >
                <CreditCard className="mr-1 inline h-3.5 w-3.5" />
                Pagamento
              </button>
            </div>

            <label className="text-xs text-slate-500">
              Horas padrao global do dia
              <input
                type="number"
                min={0}
                step={0.25}
                className="input mt-1"
                disabled={paymentContext.locked}
                value={paymentContext.config.horasPadraoDia}
                onChange={(event) => setGlobalStandardHours(Number(event.target.value || "0"))}
              />
            </label>

            <label className="text-xs text-slate-500">
              Fonte de horas
              <select
                className="select mt-1"
                disabled={paymentContext.locked}
                value={paymentContext.config.fonteHoras}
                onChange={(event) =>
                  setHoursSource(
                    event.target.value as "ESCALA_PREVISTA" | "APONTAMENTO_REAL"
                  )
                }
              >
                {Object.entries(HOURS_SOURCE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Adicional global do dia</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <select
                  className="select"
                  aria-label="Tipo de adicional global"
                  title="Tipo de adicional global"
                  value={globalAdditionalDraft.tipo}
                  disabled={paymentContext.locked}
                  onChange={(event) =>
                    setGlobalAdditionalDraft((previous) => ({
                      ...previous,
                      tipo: event.target.value as AdditionalDay["tipo"]
                    }))
                  }
                >
                  {additionalTypes.map((type) => (
                    <option key={type.id} value={type.nome}>
                      {type.nome}
                    </option>
                  ))}
                </select>

                <input
                  className="input"
                  type="number"
                  aria-label="Valor do adicional global"
                  title="Valor do adicional global"
                  min={0}
                  step={0.01}
                  disabled={paymentContext.locked}
                  value={globalAdditionalDraft.valor}
                  onChange={(event) =>
                    setGlobalAdditionalDraft((previous) => ({
                      ...previous,
                      valor: Number(event.target.value || "0")
                    }))
                  }
                />

                <select
                  className="select"
                  aria-label="Aplicar adicional global para"
                  title="Aplicar adicional global para"
                  value={globalAdditionalDraft.aplicarPara}
                  disabled={paymentContext.locked}
                  onChange={(event) =>
                    setGlobalAdditionalDraft((previous) => ({
                      ...previous,
                      aplicarPara: event.target.value as AdditionalDay["aplicarPara"]
                    }))
                  }
                >
                  <option value="TODOS">Todos</option>
                  <option value="SO_FREELAS">So frilas</option>
                  <option value="SO_FIXOS">So fixos</option>
                </select>

                <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={globalAdditionalDraft.pagavelViaPix}
                    disabled={paymentContext.locked}
                    onChange={(event) =>
                      setGlobalAdditionalDraft((previous) => ({
                        ...previous,
                        pagavelViaPix: event.target.checked
                      }))
                    }
                  />
                  Pagavel via PIX
                </label>
              </div>

              <input
                className="input mt-2"
                placeholder="Descricao (obrigatoria se tipo OUTRO)"
                disabled={paymentContext.locked}
                value={globalAdditionalDraft.descricao}
                onChange={(event) =>
                  setGlobalAdditionalDraft((previous) => ({
                    ...previous,
                    descricao: event.target.value
                  }))
                }
              />

              <div className="mt-2 flex gap-2">
                <button
                  className="button secondary"
                  disabled={paymentContext.locked}
                  onClick={() => {
                    if (
                      globalAdditionalDraft.tipo === "OUTRO" &&
                      !globalAdditionalDraft.descricao.trim()
                    ) {
                      toast("Tipo OUTRO exige descrição.", "error");
                      return;
                    }
                    setGlobalAdditional({
                      ...globalAdditionalDraft,
                      descricao: globalAdditionalDraft.descricao.trim() || undefined
                    });
                    toast("Adicional global aplicado.", "success");
                  }}
                >
                  Aplicar global
                </button>
                <button
                  className="button ghost"
                  disabled={paymentContext.locked}
                  onClick={() => { setGlobalAdditional(undefined); toast("Adicional global removido.", "info"); }}
                >
                  Remover
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button className="button" disabled={paymentContext.locked} onClick={() => { validateHours(); toast("Horas validadas com sucesso.", "success"); }}>
                <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                Validar horas
              </button>
              {!showCloseConfirm ? (
                <button
                  className="button primary"
                  disabled={paymentContext.locked || !canClose}
                  onClick={() => setShowCloseConfirm(true)}
                >
                  <Lock className="mr-1 inline h-3.5 w-3.5" />
                  Fechar dia
                </button>
              ) : (
                <button
                  className="button danger"
                  onClick={() => {
                    closePaymentsDay();
                    setShowCloseConfirm(false);
                    toast("Dia fechado com sucesso. Edicao travada.", "success");
                  }}
                >
                  Confirmar fechamento
                </button>
              )}
            </div>

            {showCloseConfirm && !paymentContext.locked && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p>Acao irreversivel sem perfil de reabertura. Tem certeza?</p>
                <button className="button ghost ml-auto px-2 py-1 text-[11px]" onClick={() => setShowCloseConfirm(false)}>
                  Cancelar
                </button>
              </div>
            )}

            {paymentContext.locked && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-700">
                <p className="inline-flex items-center gap-1.5 font-semibold">
                  <Lock className="h-3.5 w-3.5" />
                  Fechamento ativo — edicao travada
                </p>
                <p className="mt-1 text-emerald-600/80">Somente perfis autorizados podem reabrir com motivo.</p>

                {!showReopenDialog ? (
                  <button
                    className="button mt-2"
                    disabled={!canReopen}
                    onClick={() => setShowReopenDialog(true)}
                  >
                    <Unlock className="mr-1 inline h-3.5 w-3.5" />
                    Reabrir fechamento
                  </button>
                ) : (
                  <div className="mt-2 space-y-2">
                    <label className="text-xs text-emerald-700">
                      Motivo da reabertura (obrigatorio)
                      <input
                        className="input mt-1"
                        placeholder="Ex: correcao de horas do turno noturno"
                        value={reopenReason}
                        onChange={(event) => setReopenReason(event.target.value)}
                        autoFocus
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        className="button secondary"
                        disabled={!reopenReason.trim()}
                        onClick={() => {
                          reopenPaymentsDay(reopenReason.trim());
                          setReopenReason("");
                          setShowReopenDialog(false);
                          toast("Fechamento reaberto.", "info");
                        }}
                      >
                        Confirmar reabertura
                      </button>
                      <button
                        className="button ghost"
                        onClick={() => {
                          setReopenReason("");
                          setShowReopenDialog(false);
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button className="button" onClick={() => { downloadPixCsv(); toast("CSV PIX gerado.", "success"); }}>
                <Download className="mr-1 inline h-3.5 w-3.5" /> CSV PIX
              </button>
              <button className="button" onClick={() => { downloadDayStatementCsv(); toast("CSV do dia gerado.", "success"); }}>
                <Download className="mr-1 inline h-3.5 w-3.5" /> CSV dia
              </button>
            </div>
          </div>
        </section>

        <section className="panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Linhas de pagamento</h3>
            <span className="badge badge-info">{paymentContext.lines.length}</span>
          </div>

          {paymentContext.lines.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 py-8 text-center">
              <UserRound className="h-7 w-7 text-slate-300" />
              <p className="text-xs text-slate-400">Nenhuma linha de pagamento para os filtros atuais.</p>
            </div>
          )}

          <div className="max-h-[560px] space-y-3 overflow-auto pr-1">
            {paymentContext.lines.map((line) => {
              const roleLabel = rolesById[line.person.cargoId]?.nome ?? "Cargo";
              const existingDraft =
                individualAdditionalDrafts[line.person.id] ?? emptyAdditionalDraft;

              return (
                <div key={line.person.id} className="rounded-xl border border-slate-200/80 bg-white p-3 transition hover:border-slate-300/80">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                        {line.person.nome.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{line.person.nome}</p>
                        <p className="text-[11px] text-slate-400">
                          {roleLabel} · {TYPE_LABEL[line.person.type]}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">{money(line.total)}</p>
                      <p className="text-[11px] text-slate-400">{line.person.pixKey || "Sem PIX"}</p>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-slate-50/60 p-1.5 text-xs text-slate-600">
                    <div>
                      Horas: <strong className="text-slate-700">{asHours(line.hours)}</strong>
                    </div>
                    <div>
                      Base: <strong className="text-slate-700">{money(line.base)}</strong>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-[1fr,1fr,auto] gap-2">
                    <input
                      className="input"
                      type="number"
                      aria-label={`Horas trabalhadas hoje de ${line.person.nome}`}
                      title={`Horas trabalhadas hoje de ${line.person.nome}`}
                      min={0}
                      step={0.25}
                      disabled={paymentContext.locked}
                      value={hoursDrafts[line.person.id] ?? line.hours}
                      onChange={(event) =>
                        setHoursDrafts((previous) => ({
                          ...previous,
                          [line.person.id]: event.target.value
                        }))
                      }
                    />
                    <input
                      className="input"
                      placeholder="Motivo override"
                      disabled={paymentContext.locked}
                      value={hoursReasonDrafts[line.person.id] ?? ""}
                      onChange={(event) =>
                        setHoursReasonDrafts((previous) => ({
                          ...previous,
                          [line.person.id]: event.target.value
                        }))
                      }
                    />
                    <button
                      className="button"
                      disabled={paymentContext.locked}
                      onClick={() => {
                        upsertHours(
                          line.person.id,
                          Number(hoursDrafts[line.person.id] ?? line.hours),
                          hoursReasonDrafts[line.person.id]
                        );
                        toast(`Horas de ${line.person.nome} atualizadas.`, "success");
                      }}
                    >
                      Ok
                    </button>
                  </div>

                  {line.overrideFlag && (
                    <p className="mt-1 text-[11px] text-amber-700">
                      Override ativo {line.motivoOverride ? `- ${line.motivoOverride}` : ""}
                    </p>
                  )}

                  <div className="mt-2 rounded-lg bg-slate-50 p-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Adicionais</p>
                    <ul className="mt-1 space-y-1 text-xs text-slate-600">
                      {line.additionals.length === 0 && <li>Nenhum adicional.</li>}
                      {line.additionals.map((additional) => (
                        <li key={additional.id} className="flex items-center justify-between gap-2">
                          <span>
                            {additional.tipo} {additional.origem === "GLOBAL" ? "(global)" : ""}
                            {additional.descricao ? ` · ${additional.descricao}` : ""}
                          </span>
                          <div className="flex items-center gap-2">
                            <span>{money(additional.valorEfetivo)}</span>
                            {additional.origem === "INDIVIDUAL" && !paymentContext.locked ? (
                              <button
                                className="button ghost px-2 py-0.5 text-[11px]"
                                onClick={() => { removeIndividualAdditional(additional.id); toast("Adicional removido.", "info"); }}
                              >
                                Remover
                              </button>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <select
                        className="select"
                        aria-label={`Tipo de adicional individual de ${line.person.nome}`}
                        title={`Tipo de adicional individual de ${line.person.nome}`}
                        disabled={paymentContext.locked}
                        value={existingDraft.tipo}
                        onChange={(event) =>
                          setIndividualAdditionalDrafts((previous) => ({
                            ...previous,
                            [line.person.id]: {
                              ...existingDraft,
                              tipo: event.target.value as AdditionalDay["tipo"]
                            }
                          }))
                        }
                      >
                        {additionalTypes.map((type) => (
                          <option key={type.id} value={type.nome}>
                            {type.nome}
                          </option>
                        ))}
                      </select>

                      <input
                        className="input"
                        type="number"
                        aria-label={`Valor do adicional individual de ${line.person.nome}`}
                        title={`Valor do adicional individual de ${line.person.nome}`}
                        min={0}
                        step={0.01}
                        disabled={paymentContext.locked}
                        value={existingDraft.valor}
                        onChange={(event) =>
                          setIndividualAdditionalDrafts((previous) => ({
                            ...previous,
                            [line.person.id]: {
                              ...existingDraft,
                              valor: Number(event.target.value || "0")
                            }
                          }))
                        }
                      />

                      <input
                        className="input col-span-2"
                        placeholder="Observacao (obrigatoria em OUTRO)"
                        disabled={paymentContext.locked}
                        value={existingDraft.descricao}
                        onChange={(event) =>
                          setIndividualAdditionalDrafts((previous) => ({
                            ...previous,
                            [line.person.id]: {
                              ...existingDraft,
                              descricao: event.target.value
                            }
                          }))
                        }
                      />

                      <label className="col-span-2 inline-flex items-center gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          disabled={paymentContext.locked}
                          checked={existingDraft.pagavelViaPix}
                          onChange={(event) =>
                            setIndividualAdditionalDrafts((previous) => ({
                              ...previous,
                              [line.person.id]: {
                                ...existingDraft,
                                pagavelViaPix: event.target.checked
                              }
                            }))
                          }
                        />
                        Pagavel via PIX
                      </label>
                    </div>

                    <button
                      className="button mt-2"
                      disabled={paymentContext.locked}
                      onClick={() => {
                        if (existingDraft.tipo === "OUTRO" && !existingDraft.descricao.trim()) {
                          toast("Tipo OUTRO exige descrição.", "error");
                          return;
                        }
                        addIndividualAdditional(line.person.id, {
                          tipo: existingDraft.tipo,
                          valor: existingDraft.valor,
                          descricao: existingDraft.descricao,
                          pagavelViaPix: existingDraft.pagavelViaPix
                        });
                        setIndividualAdditionalDrafts((previous) => ({
                          ...previous,
                          [line.person.id]: emptyAdditionalDraft
                        }));
                        toast("Adicional individual adicionado.", "success");
                      }}
                    >
                      Adicionar
                    </button>
                  </div>

                  {paymentContext.config.mode === "PAGAMENTO" && (
                    <label className="mt-2 block text-xs text-slate-500">
                      Status pagamento
                      <select
                        className="select mt-1"
                        disabled={paymentContext.locked}
                        value={line.statusPago}
                        onChange={(event) => {
                          setPaymentStatus(line.person.id, event.target.value as "PENDENTE" | "PAGO");
                          toast(`Status de ${line.person.nome}: ${event.target.value}.`, "success");
                        }}
                      >
                        <option value="PENDENTE">Pendente</option>
                        <option value="PAGO">Pago</option>
                      </select>
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel p-4">
          <div className="mb-2 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-800">Resumo PIX pronto</h3>
          </div>
          {paymentContext.pixSummary.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-slate-200 py-5 text-center">
              <CreditCard className="h-6 w-6 text-slate-300" />
              <p className="text-xs text-slate-400">Nenhum pagamento PIX para o modo/filtro atual.</p>
            </div>
          ) : (
            <>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {paymentContext.pixSummary.map((pixLine) => (
                  <li key={pixLine.personId} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50/60 px-2.5 py-1.5">
                    <div>
                      <span className="font-medium text-slate-700">{pixLine.nome}</span>
                      <span className="ml-1.5 text-[11px] text-slate-400">{pixLine.chavePix}</span>
                    </div>
                    <strong className="text-emerald-700">{money(pixLine.valor)}</strong>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between rounded-lg bg-teal-50/60 px-2.5 py-1.5 text-xs">
                <span className="font-medium text-teal-700">Total PIX</span>
                <strong className="text-teal-800">{money(paymentContext.totalGeral)}</strong>
              </div>
            </>
          )}
        </section>

        <section className="panel p-4">
          <div className="mb-2 flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-800">Auditoria recente</h3>
          </div>
          {state.auditLogs.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">Nenhum evento registrado.</p>
          ) : (
            <ul className="max-h-52 space-y-1.5 overflow-auto text-xs text-slate-600">
              {[...state.auditLogs]
                .reverse()
                .slice(0, 12)
                .map((entry) => (
                  <li key={entry.id} className="rounded-lg border border-slate-100 bg-white/80 p-2">
                    <p className="font-semibold text-slate-700">{entry.acao}</p>
                    <p className="text-[11px] text-slate-400">
                      {entry.actorName} · {new Date(entry.criadoEm).toLocaleString("pt-BR")}
                    </p>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </aside>

      {selectedPerson && selectedHistory && (
        <div
          className="modal-overlay fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 p-3"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closePersonDetails();
            }
          }}
        >
          <div
            ref={modalPanelRef}
            className="modal-panel h-full w-full max-w-2xl overflow-auto rounded-2xl bg-white p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`person-detail-title-${selectedPerson.id}`}
            tabIndex={-1}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-base font-bold text-teal-700">
                  {selectedPerson.nome.charAt(0)}
                </div>
                <div>
                  <h3
                    id={`person-detail-title-${selectedPerson.id}`}
                    className="text-lg font-semibold text-slate-800"
                  >
                    {selectedPerson.nome}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {rolesById[selectedPerson.cargoId]?.nome ?? "Cargo"} · {TYPE_LABEL[selectedPerson.type]}
                  </p>
                </div>
              </div>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                onClick={closePersonDetails}
                aria-label="Fechar painel"
                data-modal-initial-focus
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-semibold text-slate-700">Dados principais</p>
                <p className="mt-1 text-slate-600">Contato: {selectedPerson.contatoTelefone || "Nao informado"}</p>
                <p className="text-slate-600">PIX: {selectedPerson.pixKey || "Nao informado"}</p>
                <p className="text-slate-600">Status: {STATUS_LABEL[selectedPerson.status]}</p>
                <p className="text-slate-600">DOC: {docsBadge(state, selectedPerson.id)}</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-semibold text-slate-700">Performance detalhada</p>
                <p className="mt-1 text-slate-600">Dia: {PERFORMANCE_LABEL[selectedPerson.performance.dia]}</p>
                <p className="text-slate-600">Semana: {percent(selectedPerson.performance.semana ?? 0)}</p>
                <p className="text-slate-600">Mes: {percent(selectedPerson.performance.mes ?? 0)}</p>
                <p className="text-slate-600">Obs: {selectedPerson.performance.observacoes || "Sem observacoes"}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-xs text-slate-500">
                Contato
                <input
                  className="input mt-1"
                  value={selectedPerson.contatoTelefone ?? ""}
                  onChange={(event) =>
                    updatePersonData(
                      selectedPerson.id,
                      { contatoTelefone: event.target.value },
                      "ATUALIZAR_CONTATO_PESSOA"
                    )
                  }
                />
              </label>

              <label className="text-xs text-slate-500">
                Chave PIX
                <input
                  className="input mt-1"
                  disabled={!checkPermission("EDITAR_PIX")}
                  value={selectedPerson.pixKey ?? ""}
                  onChange={(event) =>
                    updatePersonData(
                      selectedPerson.id,
                      { pixKey: event.target.value },
                      "ATUALIZAR_PIX_PESSOA"
                    )
                  }
                />
              </label>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-700">Escala do dia (edicao rapida)</p>
              {lineByPersonId[selectedPerson.id]?.schedule?.turns.map((turn, index) => (
                <div key={`${selectedPerson.id}-turn-${index}`} className="mt-2 grid grid-cols-[1fr,1fr,1fr,auto] gap-2">
                  <input
                    className="input"
                    aria-label={`Nome do turno ${index + 1} de ${selectedPerson.nome}`}
                    title={`Nome do turno ${index + 1} de ${selectedPerson.nome}`}
                    value={turn.nome}
                    disabled={paymentContext.locked}
                    onChange={(event) =>
                      updateScheduleTurn(selectedPerson.id, index, { nome: event.target.value })
                    }
                  />
                  <input
                    className="input"
                    aria-label={`Hora inicial do turno ${index + 1} de ${selectedPerson.nome}`}
                    title={`Hora inicial do turno ${index + 1} de ${selectedPerson.nome}`}
                    value={turn.inicio}
                    disabled={paymentContext.locked}
                    onChange={(event) =>
                      updateScheduleTurn(selectedPerson.id, index, { inicio: event.target.value })
                    }
                  />
                  <input
                    className="input"
                    aria-label={`Hora final do turno ${index + 1} de ${selectedPerson.nome}`}
                    title={`Hora final do turno ${index + 1} de ${selectedPerson.nome}`}
                    value={turn.fim}
                    disabled={paymentContext.locked}
                    onChange={(event) =>
                      updateScheduleTurn(selectedPerson.id, index, { fim: event.target.value })
                    }
                  />
                  <span className="inline-flex items-center text-xs text-slate-500">turno</span>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Ultimos pagamentos</p>
                  <button
                    className="button ghost px-2 py-1 text-xs"
                    onClick={() => downloadMonthlyPersonReportCsv(selectedPerson.id)}
                  >
                    Export mensal CSV
                  </button>
                </div>
                <ul className="max-h-40 space-y-1 overflow-auto text-xs text-slate-600">
                  {selectedHistory.paymentItems.slice(0, 8).map((item) => (
                    <li key={item.id} className="rounded border border-slate-200 p-2">
                      <p className="font-medium text-slate-700">{item.date}</p>
                      <p>Total: {money(item.total)}</p>
                      <p>Horas: {asHours(item.horasSnapshot)}</p>
                    </li>
                  ))}
                  {selectedHistory.paymentItems.length === 0 && <li>Sem historico.</li>}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-2 text-sm font-semibold text-slate-700">Ultimas escalas/horas/adicionais</p>
                <ul className="max-h-40 space-y-1 overflow-auto text-xs text-slate-600">
                  {selectedHistory.schedules.slice(0, 4).map((schedule) => (
                    <li key={schedule.id} className="rounded border border-slate-200 p-2">
                      <p className="font-medium text-slate-700">Escala {schedule.date}</p>
                      <p>
                        {schedule.turns
                          .map((turn) => `${turn.nome} ${turn.inicio}-${turn.fim}`)
                          .join(" | ")}
                      </p>
                    </li>
                  ))}
                  {selectedHistory.hours.slice(0, 4).map((entry) => (
                    <li key={entry.id} className="rounded border border-slate-200 p-2">
                      <p className="font-medium text-slate-700">Horas {entry.date}</p>
                      <p>{asHours(entry.horas)}</p>
                    </li>
                  ))}
                  {selectedHistory.additionals.slice(0, 4).map((entry) => (
                    <li key={entry.id} className="rounded border border-slate-200 p-2">
                      <p className="font-medium text-slate-700">Adicional {entry.date}</p>
                      <p>
                        {entry.tipo}: {money(entry.tipo === "DESCONTO" ? -Math.abs(entry.valor) : Math.abs(entry.valor))}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
