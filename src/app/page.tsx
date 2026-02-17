"use client";

import { type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
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
  Search,
  MoreVertical,
  Share2
} from "lucide-react";

import { useAppState } from "@/components/state-provider";
import { ScheduleBuilder } from "@/components/schedule-builder";
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
import { cn } from "@/lib/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Dialog } from "@/components/ui/dialog";
import { PersonDetailsSheet } from "@/components/person-details-sheet";

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
    downloadMonthlyPersonReportCsv,
    setSelectedPersonId
  } = useAppState();

  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [dashboardTab, setDashboardTab] = useState<"operacao" | "escala">("operacao");

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

  /* Removed local selectedPerson/History logic as it's now handled in PersonDetailsSheet */

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

  const copyScheduleSummary = () => {
    const header = `*Escala Detalhada - ${asDateLabel(date)}* \n\n`;
    const body = grouped.map(group => {
      const peopleList = group.people.map(p => {
        const line = lineByPersonId[p.id];
        const schedule = line?.schedule;
        const shiftLabel = schedule ? schedule.turns.map(t => `${t.inicio}-${t.fim}`).join(' e ') : 'Sem horário';
        return `• ${p.nome} (${shiftLabel})`;
      }).join('\n');
      return `*${group.teamLabel} - ${group.roleLabel}*\n${peopleList}`;
    }).join('\n\n');

    const text = header + body;
    navigator.clipboard.writeText(text);
    toast("Escala copiada!", "success");
  };

  const canEditStatus = checkPermission("EDITAR_STATUS");
  const canEditPayRule = checkPermission("EDITAR_REMUNERACAO_REGRA");
  const canClose = checkPermission("FECHAR_PAGAMENTOS_DIA");
  const canReopen = checkPermission("REABRIR_PAGAMENTOS_DIA");

  const validatedCount = paymentContext.lines.filter((l) => l.validadoHoras).length;
  const totalLines = paymentContext.lines.length;
  const closingProgress = totalLines > 0 ? validatedCount / totalLines : 0;

  const { toast } = useToast();

  const handleUpsertHours = (personId: string, hours: number, reason?: string) => {
    upsertHours(personId, hours, reason);
    toast("Horas atualizadas", "success");
  };

  return (
    <div className="page-enter space-y-6">
      <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        <Button
          variant={dashboardTab === "operacao" ? "outline" : "ghost"}
          size="sm"
          className={cn("gap-2", dashboardTab === "operacao" && "bg-white shadow-sm")}
          onClick={() => setDashboardTab("operacao")}
        >
          <Users className="h-4 w-4" />
          Operacao do dia
        </Button>
        <Button
          variant={dashboardTab === "escala" ? "outline" : "ghost"}
          size="sm"
          className={cn("gap-2", dashboardTab === "escala" && "bg-white shadow-sm")}
          onClick={() => setDashboardTab("escala")}
        >
          <Calendar className="h-4 w-4" />
          Planejador de escala
        </Button>
      </div>

      {dashboardTab === "escala" ? (
        <ScheduleBuilder />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.8fr,1fr]">
          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card variant="kpi" className="border-l-4 border-l-red-500">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs font-medium uppercase tracking-wide">Buracos</CardDescription>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold">{highlights.buracosEscala.length}</div>
                  <p className="text-xs text-muted-foreground">lacunas de escala</p>
                </CardContent>
              </Card>

              <Card variant="kpi" className="border-l-4 border-l-amber-500">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs font-medium uppercase tracking-wide">Sem PIX</CardDescription>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                      <CreditCard className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold">{highlights.semPixEscalados.length}</div>
                  <p className="text-xs text-muted-foreground">escalados sem chave</p>
                </CardContent>
              </Card>

              <Card variant="kpi" className="border-l-4 border-l-blue-500">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs font-medium uppercase tracking-wide">Pagamentos</CardDescription>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{highlights.pagamentosPendentes}</span>
                    <span className="text-sm text-muted-foreground">/</span>
                    <span className="text-lg font-semibold text-emerald-600">{highlights.pagamentosFechados}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">pendentes / fechados</p>
                </CardContent>
              </Card>

              <Card variant="kpi" className="border-l-4 border-l-teal-500">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs font-medium uppercase tracking-wide">Custo Dia</CardDescription>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-bold">{money(highlights.custoEstimado)}</div>
                  <p className="text-xs text-muted-foreground">{MODE_LABEL[paymentContext.config.mode]}</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Filtro rapido:</span>
              {[
                { key: "sem-pix", label: `Sem PIX (${highlights.semPixEscalados.length})`, variant: "danger" as const },
                { key: "docs-pendentes", label: `Docs pendentes (${highlights.docsCriticosPendentes})`, variant: "danger" as const },
                { key: "freelas", label: "Freelas", variant: "warn" as const },
                { key: "performance-critica", label: "Performance critica", variant: "danger" as const }
              ].map((chip) => (
                <Badge
                  key={chip.key}
                  variant={quickFilter === chip.key ? "default" : chip.variant}
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => setQuickFilter(quickFilter === chip.key ? null : chip.key)}
                >
                  {chip.label}
                </Badge>
              ))}
              {quickFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground hover:bg-transparent underline"
                  onClick={() => setQuickFilter(null)}
                >
                  Limpar
                </Button>
              )}
            </div>

            {highlights.buracosEscala.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm font-semibold">Alertas de cobertura</p>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-amber-700/80">
                  {highlights.buracosEscala.map((gap) => (
                    <li key={`${gap.unitName}-${gap.roleName}`}>
                      {gap.unitName} / {gap.roleName}: faltam <strong>{gap.falta}</strong> pessoa(s)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Organograma vivo</h2>
                  <p className="text-sm text-muted-foreground">Agrupado por lider / time / cargo · {totalPeopleCount} pessoa(s)</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 hidden sm:flex"
                    onClick={copyScheduleSummary}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Enviar Escala
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9 h-9 w-[200px]"
                      placeholder="Buscar pessoa..."
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                    />
                  </div>
                  <Badge variant="outline" className="h-9 px-3 text-sm font-normal">
                    <Calendar className="mr-2 h-3.5 w-3.5" />
                    {asDateLabel(date)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-6">
                {grouped.length === 0 && (
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
                    <Users className="h-10 w-10 text-muted-foreground/50" />
                    <p className="text-lg font-medium">Nenhuma pessoa encontrada</p>
                    <p className="text-sm text-muted-foreground">Tente ajustar os filtros ou a busca.</p>
                  </div>
                )}

                {grouped.map((group) => (
                  <div key={`${group.leaderLabel}-${group.teamLabel}-${group.roleLabel}`} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-md font-normal text-muted-foreground">
                        {group.leaderLabel} / {group.teamLabel}
                      </Badge>
                      <span className="text-sm font-semibold text-foreground">{group.roleLabel}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{group.people.length} pessoa(s)</span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {group.people.map((person) => {
                        const line = lineByPersonId[person.id];
                        const schedule = line?.schedule;
                        const unit = schedule ? unitsById[schedule.unidadeId] : undefined;
                        const personDocBadge = docsBadge(state, person.id);
                        const personPixBadge = pixBadge(person);
                        const currentHours = line?.hours ?? 0;

                        return (
                          <Card key={person.id} className="group overflow-hidden transition-all hover:shadow-md hover:border-primary/20 bg-background/60 backdrop-blur-sm">
                            <CardHeader className="p-4 pb-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
                                    {person.nome.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold leading-none text-slate-800">{person.nome}</h4>
                                    <p className="mt-1 text-xs text-muted-foreground">{group.roleLabel}</p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedPersonId(person.id)}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>

                            <CardContent className="p-4 pt-0">
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                <Badge variant={person.type === "FREELA" ? "warn" : "default"} className="h-5 px-1.5 text-[10px]">{TYPE_LABEL[person.type]}</Badge>
                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{STATUS_LABEL[person.status]}</Badge>
                                <Badge variant={personDocBadge === "OK" ? "ok" : "danger"} className="h-5 px-1.5 text-[10px]">DOC {personDocBadge}</Badge>
                                {!person.pixKey && <Badge variant="danger" className="h-5 px-1.5 text-[10px]">SEM PIX</Badge>}
                              </div>

                              <div className="rounded-lg bg-muted/40 p-2.5 text-xs">
                                {schedule ? (
                                  <div className="flex items-start gap-2">
                                    <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <div>
                                      <div className="font-medium">
                                        {schedule.turns.map(t => `${t.inicio}–${t.fim}`).join(" · ")}
                                      </div>
                                      <div className="text-muted-foreground mt-0.5">{unit?.nome}</div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>Sem escala</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>

                            {line && (
                              <CardFooter className="bg-muted/10 p-3 flex items-center justify-between text-xs border-t">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">Horas:</span>
                                  <Badge variant="outline" className="font-mono bg-white">{asHours(currentHours)}</Badge>
                                </div>
                                <div className="font-semibold">{money(line.total)}</div>
                              </CardFooter>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Calculadora do dia</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-3xl font-bold tracking-tight">{money(paymentContext.totalGeral)}</span>
                  <span className="text-xs text-muted-foreground">{paymentContext.lines.length} pessoas</span>
                </div>

                {totalLines > 0 && (
                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progresso</span>
                      <span>{Math.round(closingProgress * 100)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${closingProgress * 100}%` }} />
                    </div>
                    {paymentContext.locked && (
                      <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Dia fechado
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Button
                    variant={paymentContext.config.mode === "CUSTO" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setPaymentMode("CUSTO")}
                    disabled={paymentContext.locked}
                    className="w-full"
                  >
                    Custo
                  </Button>
                  <Button
                    variant={paymentContext.config.mode === "PAGAMENTO" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setPaymentMode("PAGAMENTO")}
                    disabled={paymentContext.locked}
                    className="w-full"
                  >
                    Pagamento
                  </Button>
                </div>

                <div className="space-y-4 rounded-lg border p-3 bg-muted/30">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Horas Padrao</label>
                    <Input
                      type="number"
                      className="h-8 mt-1"
                      min={0}
                      step={0.25}
                      disabled={paymentContext.locked}
                      value={paymentContext.config.horasPadraoDia}
                      onChange={(e) => setGlobalStandardHours(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Fonte de Horas</label>
                    <Select
                      className="h-8 mt-1"
                      disabled={paymentContext.locked}
                      value={paymentContext.config.fonteHoras}
                      onChange={(e) => setHoursSource(e.target.value as any)}
                    >
                      {Object.entries(HOURS_SOURCE_LABEL).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Adicional Global</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        className="h-8"
                        value={globalAdditionalDraft.tipo}
                        disabled={paymentContext.locked}
                        onChange={(e) => setGlobalAdditionalDraft(p => ({ ...p, tipo: e.target.value as any }))}
                      >
                        {additionalTypes.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                      </Select>
                      <Input
                        type="number"
                        className="h-8"
                        placeholder="Valor"
                        value={globalAdditionalDraft.valor}
                        disabled={paymentContext.locked}
                        onChange={(e) => setGlobalAdditionalDraft(p => ({ ...p, valor: Number(e.target.value) }))}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full h-8"
                      disabled={paymentContext.locked}
                      onClick={() => {
                        setGlobalAdditional({
                          ...globalAdditionalDraft,
                          descricao: globalAdditionalDraft.descricao.trim() || undefined
                        });
                        toast("Global aplicado", "success");
                      }}
                    >
                      Aplicar Global
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    {!showCloseConfirm ? (
                      <Button
                        className="w-full"
                        variant="outline"
                        disabled={paymentContext.locked || !canClose}
                        onClick={() => setShowCloseConfirm(true)}
                      >
                        <Lock className="mr-1 h-3.5 w-3.5" /> Fechar Dia
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        variant="danger"
                        onClick={() => {
                          closePaymentsDay();
                          setShowCloseConfirm(false);
                        }}
                      >
                        Confirmar
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      size="icon"
                      title="Validar Horas"
                      disabled={paymentContext.locked}
                      onClick={() => validateHours()}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5" />
                  Resumo PIX
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {paymentContext.pixSummary.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
                    Nenhum pagamento PIX
                  </div>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {paymentContext.pixSummary.map(pix => (
                      <li key={pix.personId} className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                        <div>
                          <div className="font-medium">{pix.nome}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{pix.chavePix}</div>
                        </div>
                        <div className="font-semibold text-emerald-600">{money(pix.valor)}</div>
                      </li>
                    ))}
                  </ul>
                )}
                {paymentContext.pixSummary.length > 0 && (
                  <div className="mt-3 pt-3 border-t flex justify-between font-bold text-sm">
                    <span>Total PIX</span>
                    <span className="text-emerald-700">{money(paymentContext.totalGeral)}</span>
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full mt-3" onClick={downloadPixCsv}>
                  <Download className="mr-2 h-3.5 w-3.5" /> Baixar CSV
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                  <Clock3 className="h-3.5 w-3.5" />
                  Auditoria
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <ul className="space-y-2 text-xs text-muted-foreground max-h-48 overflow-auto">
                  {state.auditLogs.slice().reverse().slice(0, 8).map(log => (
                    <li key={log.id} className="border-b last:border-0 pb-2 last:pb-0">
                      <p className="font-medium text-foreground">{log.acao}</p>
                      <p suppressHydrationWarning>{log.actorName} · {new Date(log.criadoEm).toLocaleTimeString()}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </aside>

          <PersonDetailsSheet />

        </div>
      )}
    </div>
  );
}
