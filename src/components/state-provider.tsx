"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import { MOCK_ACTOR } from "@/lib/constants";
import { monthKeyFromDate, nowIso, TODAY } from "@/lib/date";
import {
  computePaymentContext,
  snapshotFromComputedLine,
  ViewFilters
} from "@/lib/payments";
import { createInitialState } from "@/lib/mock-state";
import {
  AdditionalDay,
  AdditionalTypeConfig,
  AppState,
  AuditEntry,
  AutomationRule,
  CommunicationCampaign,
  CommunicationTemplate,
  ConnectorEvent,
  ConnectorWebhook,
  PaymentMode,
  PaymentRule,
  PaymentStatus,
  Person,
  RecruitmentStage,
  RecruitmentVaga,
  Shift,
  TrainingCompletion,
  UserRole,
  Role
} from "@/lib/types";

const STORAGE_KEY = "people-ops-state-v1";
const STORAGE_KEYS_COMPAT = [STORAGE_KEY, "people-ops-state"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidAppState(value: unknown): value is AppState {
  if (!isRecord(value)) return false;
  return (
    typeof value.version === "number" &&
    typeof value.updatedAt === "string" &&
    Array.isArray(value.people) &&
    Array.isArray(value.roles) &&
    Array.isArray(value.companies) &&
    Array.isArray(value.units) &&
    Array.isArray(value.teams) &&
    Array.isArray(value.auditLogs) &&
    isRecord(value.permissions)
  );
}

type AdditionalInput = {
  tipo: AdditionalDay["tipo"];
  valor: number;
  descricao?: string;
  pagavelViaPix: boolean;
};

type GlobalAdditionalInput = {
  tipo: AdditionalDay["tipo"];
  valor: number;
  aplicarPara: AdditionalDay["aplicarPara"];
  pagavelViaPix: boolean;
  descricao?: string;
};

type CommunicationInput = {
  templateId?: string;
  conteudoFinal: string;
  segmentacao: {
    companyId?: string;
    unitId?: string;
    teamId?: string;
    cargoId?: string;
    tipo?: Person["type"];
    status?: Person["status"];
  };
  gatilho?: CommunicationCampaign["gatilho"];
};

type WebhookInput = {
  id?: string;
  nome: string;
  endpoint: string;
  ativo: boolean;
  eventos: ConnectorWebhook["eventos"];
};

interface AppStateContextValue {
  state: AppState;
  actor: typeof MOCK_ACTOR;
  date: string;
  setDate: (value: string) => void;
  filters: ViewFilters;
  setFilters: (patch: Partial<ViewFilters>) => void;
  resetFilters: () => void;
  paymentContext: ReturnType<typeof computePaymentContext>;
  checkPermission: (action: keyof AppState["permissions"][UserRole]) => boolean;
  resetState: () => void;
  updatePersonData: (personId: string, patch: Partial<Person>, actionLabel: string) => void;
  updateScheduleTurn: (
    personId: string,
    turnIndex: number,
    patch: { inicio?: string; fim?: string; nome?: string }
  ) => void;
  upsertHours: (personId: string, hours: number, motivoOverride?: string) => void;
  validateHours: () => void;
  setPaymentMode: (mode: PaymentMode) => void;
  setHoursSource: (source: "ESCALA_PREVISTA" | "APONTAMENTO_REAL") => void;
  setGlobalStandardHours: (hours: number) => void;
  setGlobalAdditional: (value?: GlobalAdditionalInput) => void;
  addIndividualAdditional: (personId: string, payload: AdditionalInput) => void;
  removeIndividualAdditional: (additionalId: string) => void;
  setPaymentStatus: (personId: string, status: PaymentStatus) => void;
  closePaymentsDay: () => void;
  reopenPaymentsDay: (reason: string) => void;
  downloadPixCsv: () => void;
  downloadDayStatementCsv: () => void;
  downloadMonthlyPersonReportCsv: (personId: string) => void;
  sendCommunication: (input: CommunicationInput) => number;
  runCommunicationAutomations: () => { campanhas: number; destinatarios: number };
  upsertTemplate: (template: Omit<CommunicationTemplate, "id"> & { id?: string }) => void;
  toggleAutomationRule: (evento: AutomationRule["evento"], ativo: boolean) => void;
  upsertWebhook: (input: WebhookInput) => void;
  syncConnectorEvents: () => void;
  updateRecruitmentStage: (
    vagaId: string,
    stageId: string,
    patch: Partial<Pick<RecruitmentStage, "status" | "prazo" | "evidencia">>
  ) => void;
  chargeDelayedRecruitmentManagers: () => number;
  updateTrainingCompletion: (
    completionId: string,
    status: TrainingCompletion["status"]
  ) => void;
  sendFlashTraining: (trainingId: string) => number;
  updateOnboardingProgress: (
    progressId: string,
    status: "PENDENTE" | "CONCLUIDO" | "ATRASADO",
    evidencia?: string
  ) => void;
  updatePdiProgress: (pdiId: string, evolucao: string, evidencia?: string) => void;
  setPermission: (
    role: UserRole,
    action: keyof AppState["permissions"][UserRole],
    value: boolean
  ) => void;
  updatePaymentRule: (ruleId: string, patch: Partial<PaymentRule>) => void;
  updateAdditionalType: (typeId: string, patch: Partial<AdditionalTypeConfig>) => void;
  assignPersonToSchedule: (
    personId: string,
    date: string,
    unitId: string,
    roleId: string,
    turns: Shift[]
  ) => void;
  removeFromSchedule: (scheduleId: string) => void;
  updateCoverageTarget: (unitId: string, cargoId: string, minimo: number) => void;
  duplicateDaySchedule: (fromDay: string, toDay: string, unitId: string) => void;
  selectedPersonId: string | null;
  setSelectedPersonId: (id: string | null) => void;
  addRole: (nome: string, familia?: string, nivel?: string) => void;
  removeRole: (id: string) => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

function createAuditEntry(params: {
  acao: string;
  before?: unknown;
  after?: unknown;
  companyId?: string;
  unitId?: string;
}): AuditEntry {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actorId: MOCK_ACTOR.id,
    actorName: MOCK_ACTOR.nome,
    actorRole: MOCK_ACTOR.role,
    acao: params.acao,
    companyId: params.companyId,
    unitId: params.unitId,
    before: params.before,
    after: params.after,
    criadoEm: nowIso()
  };
}

function appendAudit(state: AppState, audit: AuditEntry): AppState {
  return {
    ...state,
    version: state.version + 1,
    updatedAt: nowIso(),
    auditLogs: [...state.auditLogs, audit]
  };
}

function updatePanelConfig(
  state: AppState,
  date: string,
  patch: Partial<AppState["paymentPanelConfigs"][number]>
): AppState["paymentPanelConfigs"] {
  const existingIdx = state.paymentPanelConfigs.findIndex((config) => config.date === date);
  if (existingIdx < 0) {
    return [
      ...state.paymentPanelConfigs,
      {
        date,
        mode: "CUSTO",
        fonteHoras: "ESCALA_PREVISTA",
        horasPadraoDia: 8,
        ...patch
      }
    ];
  }

  return state.paymentPanelConfigs.map((config, index) =>
    index === existingIdx ? { ...config, ...patch } : config
  );
}

function matchesSegmentation(
  person: Person,
  segmentation: CommunicationInput["segmentacao"]
): boolean {
  if (segmentation.companyId && person.companyId !== segmentation.companyId) {
    return false;
  }
  if (segmentation.unitId && person.unitId !== segmentation.unitId) {
    return false;
  }
  if (segmentation.teamId && person.teamId !== segmentation.teamId) {
    return false;
  }
  if (segmentation.cargoId && person.cargoId !== segmentation.cargoId) {
    return false;
  }
  if (segmentation.tipo && person.type !== segmentation.tipo) {
    return false;
  }
  if (segmentation.status && person.status !== segmentation.status) {
    return false;
  }
  return true;
}

function recipientsForAutomationRule(
  snapshot: AppState,
  rule: AutomationRule,
  date: string,
  filters: ViewFilters
): Person[] {
  if (rule.evento === "DOC_PENDENTE") {
    const personIds = new Set(
      snapshot.documents
        .filter((doc) => doc.status === "PENDENTE")
        .map((doc) => doc.personId)
    );
    return snapshot.people.filter(
      (person) => personIds.has(person.id) && matchesPersonWithFilters(person, filters)
    );
  }

  if (rule.evento === "ONBOARDING_ATRASADO") {
    const personIds = new Set(
      snapshot.onboardingProgress
        .filter((progress) => progress.status === "ATRASADO")
        .map((progress) => progress.personId)
    );
    return snapshot.people.filter(
      (person) => personIds.has(person.id) && matchesPersonWithFilters(person, filters)
    );
  }

  if (rule.evento === "TREINAMENTO_VENCIDO") {
    const personIds = new Set(
      snapshot.trainingCompletions
        .filter((completion) => completion.status === "VENCIDO")
        .map((completion) => completion.personId)
    );
    return snapshot.people.filter(
      (person) => personIds.has(person.id) && matchesPersonWithFilters(person, filters)
    );
  }

  if (rule.evento === "MUDANCA_ESCALA") {
    const personIds = new Set(
      snapshot.schedules
        .filter((schedule) => schedule.date === date)
        .map((schedule) => schedule.personId)
    );
    return snapshot.people.filter(
      (person) => personIds.has(person.id) && matchesPersonWithFilters(person, filters)
    );
  }

  const managerIds = new Set(
    snapshot.recruitmentVagas
      .filter((vaga) => matchesVagaWithFilters(vaga, filters))
      .filter((vaga) =>
        vaga.checklist.some((stage) => stage.prazo < date && stage.status !== "CONCLUIDA")
      )
      .map((vaga) => vaga.gestorPersonId)
  );
  return snapshot.people.filter(
    (person) => managerIds.has(person.id) && matchesPersonWithFilters(person, filters)
  );
}

function matchesPersonWithFilters(person: Person, filters: ViewFilters): boolean {
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
}

function matchesVagaWithFilters(vaga: RecruitmentVaga, filters: ViewFilters): boolean {
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
}

function csvEscape(value: string | number): string {
  const raw = String(value ?? "");
  if (raw.includes(";") || raw.includes("\n") || raw.includes('"')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function triggerCsvDownload(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function connectorEventExists(
  events: ConnectorEvent[],
  webhookId: string,
  evento: ConnectorEvent["evento"],
  payloadResumo: string
): boolean {
  return events.some(
    (current) =>
      current.webhookId === webhookId &&
      current.evento === evento &&
      current.payloadResumo === payloadResumo
  );
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => createInitialState());
  const [date, setDate] = useState<string>(TODAY);
  const [filters, setFiltersState] = useState<ViewFilters>({});
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  useEffect(() => {
    const raw = STORAGE_KEYS_COMPAT.map((key) => window.localStorage.getItem(key)).find(
      (value) => value
    );
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (isValidAppState(parsed)) {
        setState(parsed);
        return;
      }
    } catch {
      // ignore
    }

    setState(createInitialState());
  }, []);

  useEffect(() => {
    if (!isValidAppState(state)) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const paymentContext = useMemo(
    () => computePaymentContext(state, date, filters),
    [state, date, filters]
  );

  const checkPermission = useCallback(
    (action: keyof AppState["permissions"][UserRole]) => {
      return Boolean(state.permissions[MOCK_ACTOR.role]?.[action]);
    },
    [state.permissions]
  );

  const setFilters = useCallback((patch: Partial<ViewFilters>) => {
    setFiltersState((previous) => ({
      ...previous,
      ...patch
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  const resetState = useCallback(() => {
    setState(createInitialState());
    setDate(TODAY);
    setFiltersState({});
  }, []);

  const updatePersonData = useCallback(
    (personId: string, patch: Partial<Person>, actionLabel: string) => {
      setState((previous) => {
        const index = previous.people.findIndex((person) => person.id === personId);
        if (index < 0) {
          return previous;
        }
        const before = previous.people[index];
        const after = {
          ...before,
          ...patch,
          updatedAt: nowIso()
        };
        const people = previous.people.map((person, currentIndex) =>
          currentIndex === index ? after : person
        );
        const audit = createAuditEntry({
          acao: actionLabel,
          before,
          after,
          companyId: before.companyId,
          unitId: before.unitId
        });
        return appendAudit(
          {
            ...previous,
            people
          },
          audit
        );
      });
    },
    []
  );

  const updateScheduleTurn = useCallback(
    (
      personId: string,
      turnIndex: number,
      patch: { inicio?: string; fim?: string; nome?: string }
    ) => {
      setState((previous) => {
        const scheduleIndex = previous.schedules.findIndex(
          (schedule) => schedule.date === date && schedule.personId === personId
        );
        if (scheduleIndex < 0) {
          return previous;
        }
        const schedule = previous.schedules[scheduleIndex];
        if (!schedule.turns[turnIndex]) {
          return previous;
        }

        const updatedTurns = schedule.turns.map((turn, currentIndex) =>
          currentIndex === turnIndex ? { ...turn, ...patch } : turn
        );

        const after = {
          ...schedule,
          turns: updatedTurns
        };

        const schedules = previous.schedules.map((current, currentIndex) =>
          currentIndex === scheduleIndex ? after : current
        );

        const person = previous.people.find((candidate) => candidate.id === personId);
        const audit = createAuditEntry({
          acao: "AJUSTAR_ESCALA_DIA",
          before: schedule,
          after,
          companyId: person?.companyId,
          unitId: person?.unitId
        });

        return appendAudit(
          {
            ...previous,
            schedules
          },
          audit
        );
      });
    },
    [date]
  );

  const upsertHours = useCallback(
    (personId: string, hours: number, motivoOverride?: string) => {
      setState((previous) => {
        const existingIndex = previous.hoursDays.findIndex(
          (item) => item.date === date && item.personId === personId
        );
        if (existingIndex >= 0) {
          const before = previous.hoursDays[existingIndex];
          const after = {
            ...before,
            horas: Math.max(0, hours),
            overrideFlag: true,
            motivoOverride,
            fonte: "APONTAMENTO_REAL" as const
          };
          const hoursDays = previous.hoursDays.map((item, index) =>
            index === existingIndex ? after : item
          );
          const person = previous.people.find((candidate) => candidate.id === personId);
          const audit = createAuditEntry({
            acao: "OVERRIDE_HORAS_DIA",
            before,
            after,
            companyId: person?.companyId,
            unitId: person?.unitId
          });
          return appendAudit(
            {
              ...previous,
              hoursDays
            },
            audit
          );
        }

        const after = {
          id: `hours-${personId}-${Date.now()}`,
          date,
          personId,
          horas: Math.max(0, hours),
          fonte: "APONTAMENTO_REAL" as const,
          overrideFlag: true,
          motivoOverride,
          validado: false
        };
        const person = previous.people.find((candidate) => candidate.id === personId);
        const audit = createAuditEntry({
          acao: "CRIAR_OVERRIDE_HORAS_DIA",
          before: undefined,
          after,
          companyId: person?.companyId,
          unitId: person?.unitId
        });
        return appendAudit(
          {
            ...previous,
            hoursDays: [...previous.hoursDays, after]
          },
          audit
        );
      });
    },
    [date]
  );

  const validateHours = useCallback(() => {
    setState((previous) => {
      const computation = computePaymentContext(previous, date, filters);
      let hoursDays = [...previous.hoursDays];

      computation.lines.forEach((line) => {
        const idx = hoursDays.findIndex(
          (current) => current.date === date && current.personId === line.person.id
        );
        if (idx < 0) {
          hoursDays.push({
            id: `hours-${line.person.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            date,
            personId: line.person.id,
            horas: line.hours,
            fonte: computation.config.fonteHoras,
            overrideFlag: line.overrideFlag,
            motivoOverride: line.motivoOverride,
            validado: true
          });
          return;
        }

        hoursDays[idx] = {
          ...hoursDays[idx],
          horas: line.hours,
          validado: true
        };
      });

      const audit = createAuditEntry({
        acao: "VALIDAR_HORAS_DIA",
        before: previous.hoursDays.filter((item) => item.date === date),
        after: hoursDays.filter((item) => item.date === date),
        companyId: filters.companyId,
        unitId: filters.unitId
      });

      return appendAudit(
        {
          ...previous,
          hoursDays
        },
        audit
      );
    });
  }, [date, filters]);

  const setPaymentMode = useCallback(
    (mode: PaymentMode) => {
      setState((previous) => {
        if (!previous.permissions[MOCK_ACTOR.role].EDITAR_REMUNERACAO_REGRA) {
          return previous;
        }
        const paymentPanelConfigs = updatePanelConfig(previous, date, { mode });
        const audit = createAuditEntry({
          acao: "ALTERAR_MODO_PAGAMENTO_DIA",
          before: previous.paymentPanelConfigs.find((config) => config.date === date),
          after: paymentPanelConfigs.find((config) => config.date === date),
          companyId: filters.companyId,
          unitId: filters.unitId
        });
        return appendAudit(
          {
            ...previous,
            paymentPanelConfigs
          },
          audit
        );
      });
    },
    [date, filters]
  );

  const setHoursSource = useCallback(
    (source: "ESCALA_PREVISTA" | "APONTAMENTO_REAL") => {
      setState((previous) => {
        if (!previous.permissions[MOCK_ACTOR.role].EDITAR_REMUNERACAO_REGRA) {
          return previous;
        }
        const paymentPanelConfigs = updatePanelConfig(previous, date, { fonteHoras: source });
        const audit = createAuditEntry({
          acao: "ALTERAR_FONTE_HORAS",
          before: previous.paymentPanelConfigs.find((config) => config.date === date),
          after: paymentPanelConfigs.find((config) => config.date === date),
          companyId: filters.companyId,
          unitId: filters.unitId
        });
        return appendAudit(
          {
            ...previous,
            paymentPanelConfigs
          },
          audit
        );
      });
    },
    [date, filters]
  );

  const setGlobalStandardHours = useCallback(
    (hours: number) => {
      setState((previous) => {
        if (!previous.permissions[MOCK_ACTOR.role].EDITAR_REMUNERACAO_REGRA) {
          return previous;
        }
        const paymentPanelConfigs = updatePanelConfig(previous, date, {
          horasPadraoDia: Math.max(0, hours)
        });
        const audit = createAuditEntry({
          acao: "ALTERAR_HORAS_PADRAO_DIA",
          before: previous.paymentPanelConfigs.find((config) => config.date === date),
          after: paymentPanelConfigs.find((config) => config.date === date),
          companyId: filters.companyId,
          unitId: filters.unitId
        });
        return appendAudit(
          {
            ...previous,
            paymentPanelConfigs
          },
          audit
        );
      });
    },
    [date, filters]
  );

  const setGlobalAdditional = useCallback(
    (value?: GlobalAdditionalInput) => {
      setState((previous) => {
        if (!previous.permissions[MOCK_ACTOR.role].EDITAR_REMUNERACAO_REGRA) {
          return previous;
        }
        const paymentPanelConfigs = updatePanelConfig(previous, date, {
          additionalGlobal: value
            ? {
              ...value,
              valor: Math.abs(value.valor)
            }
            : undefined
        });
        const audit = createAuditEntry({
          acao: value ? "APLICAR_ADICIONAL_GLOBAL_DIA" : "REMOVER_ADICIONAL_GLOBAL_DIA",
          before: previous.paymentPanelConfigs.find((config) => config.date === date),
          after: paymentPanelConfigs.find((config) => config.date === date),
          companyId: filters.companyId,
          unitId: filters.unitId
        });
        return appendAudit(
          {
            ...previous,
            paymentPanelConfigs
          },
          audit
        );
      });
    },
    [date, filters]
  );

  const addIndividualAdditional = useCallback(
    (personId: string, payload: AdditionalInput) => {
      if (payload.tipo === "OUTRO" && !payload.descricao?.trim()) {
        return;
      }

      setState((previous) => {
        const person = previous.people.find((candidate) => candidate.id === personId);
        if (!person) {
          return previous;
        }

        const after: AdditionalDay = {
          id: `additional-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          date,
          personId,
          tipo: payload.tipo,
          valor: Math.abs(payload.valor),
          descricao: payload.descricao,
          globalFlag: false,
          aplicarPara: person.type === "FREELA" ? "SO_FREELAS" : "SO_FIXOS",
          pagavelViaPix: payload.pagavelViaPix
        };

        const additionalDays = [...previous.additionalDays, after];
        const audit = createAuditEntry({
          acao: "ADICIONAR_ADICIONAL_INDIVIDUAL",
          before: undefined,
          after,
          companyId: person.companyId,
          unitId: person.unitId
        });

        return appendAudit(
          {
            ...previous,
            additionalDays
          },
          audit
        );
      });
    },
    [date]
  );

  const removeIndividualAdditional = useCallback((additionalId: string) => {
    setState((previous) => {
      const target = previous.additionalDays.find((additional) => additional.id === additionalId);
      if (!target) {
        return previous;
      }
      const additionalDays = previous.additionalDays.filter(
        (additional) => additional.id !== additionalId
      );
      const person = target.personId
        ? previous.people.find((candidate) => candidate.id === target.personId)
        : undefined;

      const audit = createAuditEntry({
        acao: "REMOVER_ADICIONAL_INDIVIDUAL",
        before: target,
        after: undefined,
        companyId: person?.companyId,
        unitId: person?.unitId
      });

      return appendAudit(
        {
          ...previous,
          additionalDays
        },
        audit
      );
    });
  }, []);

  const setPaymentStatus = useCallback(
    (personId: string, status: PaymentStatus) => {
      setState((previous) => {
        const idx = previous.paymentLineStates.findIndex(
          (line) => line.date === date && line.personId === personId
        );
        let paymentLineStates = [...previous.paymentLineStates];
        if (idx < 0) {
          paymentLineStates.push({
            date,
            personId,
            statusPago: status
          });
        } else {
          paymentLineStates[idx] = {
            ...paymentLineStates[idx],
            statusPago: status
          };
        }

        const person = previous.people.find((candidate) => candidate.id === personId);
        const audit = createAuditEntry({
          acao: "ALTERAR_STATUS_PAGAMENTO_DIA",
          before: previous.paymentLineStates.find(
            (line) => line.date === date && line.personId === personId
          ),
          after: paymentLineStates.find(
            (line) => line.date === date && line.personId === personId
          ),
          companyId: person?.companyId,
          unitId: person?.unitId
        });

        return appendAudit(
          {
            ...previous,
            paymentLineStates
          },
          audit
        );
      });
    },
    [date]
  );

  const closePaymentsDay = useCallback(() => {
    setState((previous) => {
      if (!previous.permissions[MOCK_ACTOR.role].FECHAR_PAGAMENTOS_DIA) {
        return previous;
      }

      const computation = computePaymentContext(previous, date, filters);
      if (computation.locked) {
        return previous;
      }

      const items = computation.lines.map(snapshotFromComputedLine);
      const closure = {
        id: `closure-${date}-${Date.now()}`,
        date,
        modo: computation.config.mode,
        total: computation.totalGeral,
        companyId: filters.companyId,
        unitId: filters.unitId,
        teamId: filters.teamId,
        cargoId: filters.cargoId,
        fechadoPor: MOCK_ACTOR.id,
        fechadoEm: nowIso(),
        itens: items
      };

      const audit = createAuditEntry({
        acao: "FECHAR_PAGAMENTOS_DIA",
        before: undefined,
        after: closure,
        companyId: filters.companyId,
        unitId: filters.unitId
      });

      return appendAudit(
        {
          ...previous,
          paymentDayItems: [...previous.paymentDayItems, ...items],
          dayClosures: [...previous.dayClosures, closure]
        },
        audit
      );
    });
  }, [date, filters]);

  const reopenPaymentsDay = useCallback(
    (reason: string) => {
      if (!reason.trim()) {
        return;
      }

      setState((previous) => {
        if (!previous.permissions[MOCK_ACTOR.role].REABRIR_PAGAMENTOS_DIA) {
          return previous;
        }

        const closureIdx = [...previous.dayClosures]
          .reverse()
          .findIndex(
            (closure) =>
              closure.date === date &&
              !closure.reabertoEm &&
              (closure.companyId ?? "") === (filters.companyId ?? "") &&
              (closure.unitId ?? "") === (filters.unitId ?? "") &&
              (closure.teamId ?? "") === (filters.teamId ?? "") &&
              (closure.cargoId ?? "") === (filters.cargoId ?? "")
          );

        if (closureIdx < 0) {
          return previous;
        }

        const reversedIndex = previous.dayClosures.length - 1 - closureIdx;
        const target = previous.dayClosures[reversedIndex];
        const updated = {
          ...target,
          motivoReabertura: reason,
          reabertoPor: MOCK_ACTOR.id,
          reabertoEm: nowIso()
        };

        const dayClosures = previous.dayClosures.map((closure, index) =>
          index === reversedIndex ? updated : closure
        );

        const audit = createAuditEntry({
          acao: "REABRIR_PAGAMENTOS_DIA",
          before: target,
          after: updated,
          companyId: target.companyId,
          unitId: target.unitId
        });

        return appendAudit(
          {
            ...previous,
            dayClosures
          },
          audit
        );
      });
    },
    [date, filters]
  );

  const downloadPixCsv = useCallback(() => {
    const lines = paymentContext.pixSummary;
    const header = ["Nome", "Chave PIX", "Valor"];
    const rows = lines.map((line) => [line.nome, line.chavePix, line.valor.toFixed(2)]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => csvEscape(value)).join(";"))
      .join("\n");
    triggerCsvDownload(`resumo-pix-${date}.csv`, csv);
  }, [date, paymentContext.pixSummary]);

  const downloadDayStatementCsv = useCallback(() => {
    const header = [
      "Nome",
      "Cargo",
      "Tipo",
      "Horas",
      "Base",
      "Adicionais",
      "Total",
      "Status"
    ];
    const rows = paymentContext.lines.map((line) => {
      const role = state.roles.find((item) => item.id === line.person.cargoId);
      const totalAdicionais = line.additionals.reduce(
        (acc, additional) => acc + additional.valorEfetivo,
        0
      );
      return [
        line.person.nome,
        role?.nome ?? "Cargo nao definido",
        line.person.type,
        line.hours.toFixed(2),
        line.base.toFixed(2),
        totalAdicionais.toFixed(2),
        line.total.toFixed(2),
        line.statusPago
      ];
    });
    const csv = [header, ...rows]
      .map((row) => row.map((value) => csvEscape(value)).join(";"))
      .join("\n");

    triggerCsvDownload(`demonstrativo-dia-${date}.csv`, csv);
  }, [date, paymentContext.lines, state.roles]);

  const downloadMonthlyPersonReportCsv = useCallback(
    (personId: string) => {
      const month = monthKeyFromDate(date);
      const person = state.people.find((candidate) => candidate.id === personId);
      if (!person) {
        return;
      }

      const entries = state.paymentDayItems.filter(
        (item) => item.personId === personId && monthKeyFromDate(item.date) === month
      );

      const header = ["Data", "Horas", "Base", "Adicionais", "Total", "Status"];
      const rows = entries.map((entry) => {
        const adicionais = entry.adicionais.reduce((acc, additional) => acc + additional.valor, 0);
        return [
          entry.date,
          entry.horasSnapshot.toFixed(2),
          entry.valorBase.toFixed(2),
          adicionais.toFixed(2),
          entry.total.toFixed(2),
          entry.statusPago
        ];
      });

      const csv = [header, ...rows]
        .map((row) => row.map((value) => csvEscape(value)).join(";"))
        .join("\n");

      triggerCsvDownload(`relatorio-mensal-${person.nome.replace(/\s+/g, "-")}-${month}.csv`, csv);
    },
    [date, state.paymentDayItems, state.people]
  );

  const sendCommunication = useCallback(
    (input: CommunicationInput) => {
      if (!state.permissions[MOCK_ACTOR.role].DISPARAR_COMUNICADOS_MASSA) {
        return 0;
      }

      const recipientCount = state.people.filter((person) =>
        matchesSegmentation(person, input.segmentacao)
      ).length;

      setState((previous) => {
        if (!previous.permissions[MOCK_ACTOR.role].DISPARAR_COMUNICADOS_MASSA) {
          return previous;
        }
        const recipients = previous.people.filter((person) =>
          matchesSegmentation(person, input.segmentacao)
        );

        const campaign: CommunicationCampaign = {
          id: `campaign-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          templateId: input.templateId,
          conteudoFinal: input.conteudoFinal,
          segmentacao: input.segmentacao,
          gatilho: input.gatilho,
          criadoPor: MOCK_ACTOR.id,
          criadoEm: nowIso()
        };

        const logs = recipients.map((person) => ({
          id: `com-log-${Date.now()}-${person.id}`,
          campaignId: campaign.id,
          personId: person.id,
          enviadoEm: nowIso(),
          status: "ENVIADO" as const,
          templateId: campaign.templateId
        }));

        const connectorEvents = [...previous.connectorEvents];
        previous.connectorWebhooks
          .filter((webhook) => webhook.ativo && webhook.eventos.includes("AVISO_DISPARADO"))
          .forEach((webhook) => {
            const payloadResumo = `Campanha ${campaign.id} para ${recipients.length} pessoas`;
            if (
              connectorEventExists(
                connectorEvents,
                webhook.id,
                "AVISO_DISPARADO",
                payloadResumo
              )
            ) {
              return;
            }
            connectorEvents.push({
              id: `connector-event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              webhookId: webhook.id,
              evento: "AVISO_DISPARADO",
              payloadResumo,
              criadoEm: nowIso()
            });
          });

        const audit = createAuditEntry({
          acao: "DISPARAR_COMUNICADO_WHATSAPP",
          before: undefined,
          after: {
            campaign,
            destinatarios: recipients.length
          },
          companyId: input.segmentacao.companyId,
          unitId: input.segmentacao.unitId
        });

        return appendAudit(
          {
            ...previous,
            communicationCampaigns: [...previous.communicationCampaigns, campaign],
            communicationLogs: [...previous.communicationLogs, ...logs],
            connectorEvents
          },
          audit
        );
      });
      return recipientCount;
    },
    [state]
  );

  const runCommunicationAutomations = useCallback(() => {
    if (!state.permissions[MOCK_ACTOR.role].DISPARAR_COMUNICADOS_MASSA) {
      return { campanhas: 0, destinatarios: 0 };
    }

    const preview = state.automationRules
      .filter((rule) => rule.ativo)
      .reduce(
        (acc, rule) => {
          const recipients = recipientsForAutomationRule(state, rule, date, filters);
          if (recipients.length) {
            acc.campanhas += 1;
            acc.destinatarios += recipients.length;
          }
          return acc;
        },
        { campanhas: 0, destinatarios: 0 }
      );

    setState((previous) => {
      if (!previous.permissions[MOCK_ACTOR.role].DISPARAR_COMUNICADOS_MASSA) {
        return previous;
      }
      const activeRules = previous.automationRules.filter((rule) => rule.ativo);
      if (!activeRules.length) {
        return previous;
      }

      const newCampaigns: CommunicationCampaign[] = [];
      const newLogs: typeof previous.communicationLogs = [];
      const connectorEvents = [...previous.connectorEvents];

      const defaultMessageByEvent = (event: AutomationRule["evento"]) => {
        if (event === "DOC_PENDENTE") {
          return "Aviso: identificamos documentos pendentes no seu cadastro. Regularize ainda hoje.";
        }
        if (event === "ONBOARDING_ATRASADO") {
          return "Aviso: seu onboarding possui etapas atrasadas. Atualize evidencias e status.";
        }
        if (event === "TREINAMENTO_VENCIDO") {
          return "Aviso: ha treinamento vencido. Concluir e registrar comprovacao no sistema.";
        }
        if (event === "MUDANCA_ESCALA") {
          return "Aviso: houve mudanca na sua escala do dia. Confira horarios e unidade.";
        }
        return "Aviso: recrutamento atrasado sob sua responsabilidade. Atualize etapas hoje.";
      };

      activeRules.forEach((rule) => {
        const recipients = recipientsForAutomationRule(previous, rule, date, filters);
        if (!recipients.length) {
          return;
        }

        const template = rule.templateId
          ? previous.communicationTemplates.find((current) => current.id === rule.templateId)
          : undefined;

        const campaign: CommunicationCampaign = {
          id: `campaign-auto-${rule.evento}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          templateId: template?.id,
          conteudoFinal: template?.conteudo ?? defaultMessageByEvent(rule.evento),
          segmentacao: {},
          gatilho: rule.evento,
          criadoPor: MOCK_ACTOR.id,
          criadoEm: nowIso()
        };

        newCampaigns.push(campaign);

        recipients.forEach((person) => {
          newLogs.push({
            id: `com-log-auto-${campaign.id}-${person.id}-${Math.random().toString(36).slice(2, 6)}`,
            campaignId: campaign.id,
            personId: person.id,
            enviadoEm: nowIso(),
            status: "ENVIADO",
            templateId: campaign.templateId
          });
        });

        previous.connectorWebhooks
          .filter((webhook) => webhook.ativo)
          .forEach((webhook) => {
            const connectorEvent =
              rule.evento === "RECRUTAMENTO_ATRASADO"
                ? "RECRUTAMENTO_ATRASADO"
                : rule.evento === "TREINAMENTO_VENCIDO"
                  ? "TREINAMENTO_VENCIDO"
                  : "AVISO_DISPARADO";

            if (!webhook.eventos.includes(connectorEvent)) {
              return;
            }

            const payloadResumo = `${rule.evento}: campanha ${campaign.id} para ${recipients.length} pessoas`;
            if (
              connectorEventExists(
                connectorEvents,
                webhook.id,
                connectorEvent,
                payloadResumo
              )
            ) {
              return;
            }
            connectorEvents.push({
              id: `connector-event-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              webhookId: webhook.id,
              evento: connectorEvent,
              payloadResumo,
              criadoEm: nowIso()
            });
          });
      });

      if (!newCampaigns.length) {
        return previous;
      }

      const audit = createAuditEntry({
        acao: "EXECUTAR_AUTOMACOES_COMUNICADOS",
        before: undefined,
        after: {
          campanhas: preview.campanhas,
          destinatarios: preview.destinatarios
        },
        companyId: filters.companyId,
        unitId: filters.unitId
      });

      return appendAudit(
        {
          ...previous,
          communicationCampaigns: [...previous.communicationCampaigns, ...newCampaigns],
          communicationLogs: [...previous.communicationLogs, ...newLogs],
          connectorEvents
        },
        audit
      );
    });

    return preview;
  }, [date, filters, state]);

  const upsertTemplate = useCallback(
    (template: Omit<CommunicationTemplate, "id"> & { id?: string }) => {
      setState((previous) => {
        if (!template.id) {
          const created: CommunicationTemplate = {
            ...template,
            id: `template-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
          };
          const audit = createAuditEntry({
            acao: "CRIAR_TEMPLATE_COMUNICADO",
            before: undefined,
            after: created,
            companyId: created.companyId,
            unitId: created.unitId
          });
          return appendAudit(
            {
              ...previous,
              communicationTemplates: [...previous.communicationTemplates, created]
            },
            audit
          );
        }

        const index = previous.communicationTemplates.findIndex(
          (current) => current.id === template.id
        );
        if (index < 0) {
          return previous;
        }

        const before = previous.communicationTemplates[index];
        const after = { ...before, ...template };
        const communicationTemplates = previous.communicationTemplates.map((current, idx) =>
          idx === index ? after : current
        );

        const audit = createAuditEntry({
          acao: "ATUALIZAR_TEMPLATE_COMUNICADO",
          before,
          after,
          companyId: after.companyId,
          unitId: after.unitId
        });

        return appendAudit(
          {
            ...previous,
            communicationTemplates
          },
          audit
        );
      });
    },
    []
  );

  const toggleAutomationRule = useCallback(
    (evento: AutomationRule["evento"], ativo: boolean) => {
      setState((previous) => {
        const idx = previous.automationRules.findIndex((rule) => rule.evento === evento);
        if (idx < 0) {
          return previous;
        }
        const before = previous.automationRules[idx];
        const after = { ...before, ativo };

        const automationRules = previous.automationRules.map((rule, index) =>
          index === idx ? after : rule
        );

        const audit = createAuditEntry({
          acao: "TOGGLE_AUTOMACAO_COMUNICADOS",
          before,
          after,
          companyId: filters.companyId,
          unitId: filters.unitId
        });

        return appendAudit(
          {
            ...previous,
            automationRules
          },
          audit
        );
      });
    },
    [filters]
  );

  const upsertWebhook = useCallback((input: WebhookInput) => {
    setState((previous) => {
      if (!previous.permissions[MOCK_ACTOR.role].DISPARAR_COMUNICADOS_MASSA) {
        return previous;
      }
      if (!input.id) {
        const created: ConnectorWebhook = {
          id: `webhook-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          nome: input.nome,
          endpoint: input.endpoint,
          ativo: input.ativo,
          eventos: input.eventos
        };
        const audit = createAuditEntry({
          acao: "CRIAR_WEBHOOK_CONECTOR",
          before: undefined,
          after: created
        });
        return appendAudit(
          {
            ...previous,
            connectorWebhooks: [...previous.connectorWebhooks, created]
          },
          audit
        );
      }

      const idx = previous.connectorWebhooks.findIndex((webhook) => webhook.id === input.id);
      if (idx < 0) {
        return previous;
      }

      const before = previous.connectorWebhooks[idx];
      const after = {
        ...before,
        nome: input.nome,
        endpoint: input.endpoint,
        ativo: input.ativo,
        eventos: input.eventos
      };
      const connectorWebhooks = previous.connectorWebhooks.map((webhook, index) =>
        index === idx ? after : webhook
      );

      const audit = createAuditEntry({
        acao: "ATUALIZAR_WEBHOOK_CONECTOR",
        before,
        after
      });

      return appendAudit(
        {
          ...previous,
          connectorWebhooks
        },
        audit
      );
    });
  }, []);

  const syncConnectorEvents = useCallback(() => {
    setState((previous) => {
      const connectorEvents = [...previous.connectorEvents];

      previous.connectorWebhooks
        .filter((webhook) => webhook.ativo && webhook.eventos.includes("RECRUTAMENTO_ATRASADO"))
        .forEach((webhook) => {
          previous.recruitmentVagas.forEach((vaga) => {
            const delayed = vaga.checklist.some(
              (stage) => stage.prazo < date && stage.status !== "CONCLUIDA"
            );
            if (!delayed) {
              return;
            }
            const payloadResumo = `Vaga ${vaga.id} atrasada (gestor ${vaga.gestorPersonId})`;
            if (
              connectorEventExists(
                connectorEvents,
                webhook.id,
                "RECRUTAMENTO_ATRASADO",
                payloadResumo
              )
            ) {
              return;
            }
            connectorEvents.push({
              id: `connector-event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              webhookId: webhook.id,
              evento: "RECRUTAMENTO_ATRASADO",
              payloadResumo,
              criadoEm: nowIso()
            });
          });
        });

      previous.connectorWebhooks
        .filter((webhook) => webhook.ativo && webhook.eventos.includes("TREINAMENTO_VENCIDO"))
        .forEach((webhook) => {
          previous.trainingCompletions
            .filter((completion) => completion.status === "VENCIDO")
            .forEach((completion) => {
              const payloadResumo = `Treinamento vencido para pessoa ${completion.personId} (${completion.trainingId})`;
              if (
                connectorEventExists(
                  connectorEvents,
                  webhook.id,
                  "TREINAMENTO_VENCIDO",
                  payloadResumo
                )
              ) {
                return;
              }
              connectorEvents.push({
                id: `connector-event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                webhookId: webhook.id,
                evento: "TREINAMENTO_VENCIDO",
                payloadResumo,
                criadoEm: nowIso()
              });
            });
        });

      const audit = createAuditEntry({
        acao: "SINCRONIZAR_EVENTOS_CONECTORES",
        before: previous.connectorEvents.length,
        after: connectorEvents.length,
        companyId: filters.companyId,
        unitId: filters.unitId
      });

      return appendAudit(
        {
          ...previous,
          connectorEvents
        },
        audit
      );
    });
  }, [date, filters]);

  const updateRecruitmentStage = useCallback(
    (
      vagaId: string,
      stageId: string,
      patch: Partial<Pick<RecruitmentStage, "status" | "prazo" | "evidencia">>
    ) => {
      setState((previous) => {
        if (!previous.permissions[MOCK_ACTOR.role].EDITAR_ETAPAS_RECRUTAMENTO) {
          return previous;
        }
        const vagaIndex = previous.recruitmentVagas.findIndex((vaga) => vaga.id === vagaId);
        if (vagaIndex < 0) {
          return previous;
        }

        const vaga = previous.recruitmentVagas[vagaIndex];
        const stageIndex = vaga.checklist.findIndex((stage) => stage.id === stageId);
        if (stageIndex < 0) {
          return previous;
        }

        const beforeStage = vaga.checklist[stageIndex];
        const afterStage = {
          ...beforeStage,
          ...patch,
          atualizadoEm: nowIso()
        };

        const checklist = vaga.checklist.map((stage, index) =>
          index === stageIndex ? afterStage : stage
        );

        const firstPending = checklist.find((stage) => stage.status !== "CONCLUIDA");
        const afterVaga = {
          ...vaga,
          checklist,
          etapaAtualId: firstPending ? firstPending.id : checklist[checklist.length - 1]?.id,
          diasSemAvanco: patch.status === "CONCLUIDA" ? 0 : vaga.diasSemAvanco
        };

        const recruitmentVagas = previous.recruitmentVagas.map((current, index) =>
          index === vagaIndex ? afterVaga : current
        );

        const audit = createAuditEntry({
          acao: "ATUALIZAR_ETAPA_RECRUTAMENTO",
          before: beforeStage,
          after: afterStage,
          companyId: vaga.companyId,
          unitId: vaga.unitId
        });

        return appendAudit(
          {
            ...previous,
            recruitmentVagas
          },
          audit
        );
      });
    },
    []
  );

  const chargeDelayedRecruitmentManagers = useCallback(() => {
    if (!state.permissions[MOCK_ACTOR.role].DISPARAR_COMUNICADOS_MASSA) {
      return 0;
    }

    const delayedPreview = state.recruitmentVagas
      .filter((vaga) => matchesVagaWithFilters(vaga, filters))
      .filter((vaga) =>
        vaga.checklist.some((stage) => stage.prazo < date && stage.status !== "CONCLUIDA")
      );
    const recipients = Array.from(new Set(delayedPreview.map((vaga) => vaga.gestorPersonId))).length;

    setState((previous) => {
      if (!previous.permissions[MOCK_ACTOR.role].DISPARAR_COMUNICADOS_MASSA) {
        return previous;
      }
      const delayed = previous.recruitmentVagas
        .filter((vaga) => matchesVagaWithFilters(vaga, filters))
        .filter((vaga) =>
          vaga.checklist.some((stage) => stage.prazo < date && stage.status !== "CONCLUIDA")
        );
      if (!delayed.length) {
        return previous;
      }

      const managerIds = Array.from(new Set(delayed.map((vaga) => vaga.gestorPersonId)));
      const campaignId = `campaign-recr-delay-${Date.now()}`;

      const campaign: CommunicationCampaign = {
        id: campaignId,
        conteudoFinal:
          "Alerta: existem etapas de recrutamento atrasadas sob sua responsabilidade. Favor atualizar hoje.",
        segmentacao: {},
        gatilho: "RECRUTAMENTO_ATRASADO",
        criadoPor: MOCK_ACTOR.id,
        criadoEm: nowIso()
      };

      const communicationLogs = managerIds.map((managerId) => ({
        id: `com-log-${Date.now()}-${managerId}`,
        campaignId,
        personId: managerId,
        enviadoEm: nowIso(),
        status: "ENVIADO" as const
      }));

      const connectorEvents = [...previous.connectorEvents];
      previous.connectorWebhooks
        .filter((webhook) => webhook.ativo && webhook.eventos.includes("RECRUTAMENTO_ATRASADO"))
        .forEach((webhook) => {
          const payloadResumo = `Cobranca gestores recrutamento: ${managerIds.join(",")}`;
          if (
            connectorEventExists(
              connectorEvents,
              webhook.id,
              "RECRUTAMENTO_ATRASADO",
              payloadResumo
            )
          ) {
            return;
          }
          connectorEvents.push({
            id: `connector-event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            webhookId: webhook.id,
            evento: "RECRUTAMENTO_ATRASADO",
            payloadResumo,
            criadoEm: nowIso()
          });
        });

      const audit = createAuditEntry({
        acao: "COBRAR_GESTORES_RECRUTAMENTO_ATRASADO",
        before: undefined,
        after: { vagas: delayed.map((vaga) => vaga.id), gestores: managerIds },
        companyId: filters.companyId,
        unitId: filters.unitId
      });

      return appendAudit(
        {
          ...previous,
          communicationCampaigns: [...previous.communicationCampaigns, campaign],
          communicationLogs: [...previous.communicationLogs, ...communicationLogs],
          connectorEvents
        },
        audit
      );
    });

    return recipients;
  }, [date, filters, state]);

  const updateTrainingCompletion = useCallback(
    (completionId: string, status: TrainingCompletion["status"]) => {
      setState((previous) => {
        const idx = previous.trainingCompletions.findIndex(
          (completion) => completion.id === completionId
        );
        if (idx < 0) {
          return previous;
        }

        const before = previous.trainingCompletions[idx];
        const after = {
          ...before,
          status,
          concluidoEm: status === "EM_DIA" ? date : before.concluidoEm
        };

        const trainingCompletions = previous.trainingCompletions.map((completion, index) =>
          index === idx ? after : completion
        );

        const person = previous.people.find((candidate) => candidate.id === before.personId);
        const audit = createAuditEntry({
          acao: "ATUALIZAR_STATUS_TREINAMENTO",
          before,
          after,
          companyId: person?.companyId,
          unitId: person?.unitId
        });

        return appendAudit(
          {
            ...previous,
            trainingCompletions
          },
          audit
        );
      });
    },
    [date]
  );

  const sendFlashTraining = useCallback((trainingId: string) => {
    if (!state.permissions[MOCK_ACTOR.role].DISPARAR_COMUNICADOS_MASSA) {
      return 0;
    }

    const previewTraining = state.trainings.find((item) => item.id === trainingId);
    if (!previewTraining) {
      return 0;
    }

    const recipients = state.trainingCompletions.filter(
      (completion) =>
        completion.trainingId === trainingId &&
        (completion.status === "PENDENTE" || completion.status === "VENCIDO")
    ).length;

    setState((previous) => {
      if (!previous.permissions[MOCK_ACTOR.role].DISPARAR_COMUNICADOS_MASSA) {
        return previous;
      }
      const training = previous.trainings.find((item) => item.id === trainingId);
      if (!training) {
        return previous;
      }

      const targetCompletions = previous.trainingCompletions.filter(
        (completion) =>
          completion.trainingId === trainingId &&
          (completion.status === "PENDENTE" || completion.status === "VENCIDO")
      );
      if (!targetCompletions.length) {
        return previous;
      }

      const campaign: CommunicationCampaign = {
        id: `campaign-training-${Date.now()}`,
        conteudoFinal: `Treinamento relampago: ${training.nome}. Concluir hoje e anexar evidencia no sistema.`,
        segmentacao: {
          cargoId: training.cargoId
        },
        gatilho: "TREINAMENTO_VENCIDO",
        criadoPor: MOCK_ACTOR.id,
        criadoEm: nowIso()
      };

      const communicationLogs = targetCompletions.map((completion) => ({
        id: `com-log-${Date.now()}-${completion.id}`,
        campaignId: campaign.id,
        personId: completion.personId,
        enviadoEm: nowIso(),
        status: "ENVIADO" as const
      }));

      const connectorEvents = [...previous.connectorEvents];
      previous.connectorWebhooks
        .filter((webhook) => webhook.ativo && webhook.eventos.includes("TREINAMENTO_VENCIDO"))
        .forEach((webhook) => {
          const payloadResumo = `Treinamento relampago ${training.id} para ${targetCompletions.length} pessoas`;
          if (
            connectorEventExists(
              connectorEvents,
              webhook.id,
              "TREINAMENTO_VENCIDO",
              payloadResumo
            )
          ) {
            return;
          }
          connectorEvents.push({
            id: `connector-event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            webhookId: webhook.id,
            evento: "TREINAMENTO_VENCIDO",
            payloadResumo,
            criadoEm: nowIso()
          });
        });

      const audit = createAuditEntry({
        acao: "ENVIAR_TREINAMENTO_RELAMPAGO_WHATSAPP",
        before: undefined,
        after: {
          trainingId,
          destinatarios: targetCompletions.length
        }
      });

      return appendAudit(
        {
          ...previous,
          communicationCampaigns: [...previous.communicationCampaigns, campaign],
          communicationLogs: [...previous.communicationLogs, ...communicationLogs],
          connectorEvents
        },
        audit
      );
    });

    return recipients;
  }, [state]);

  const updateOnboardingProgress = useCallback(
    (progressId: string, status: "PENDENTE" | "CONCLUIDO" | "ATRASADO", evidencia?: string) => {
      setState((previous) => {
        const idx = previous.onboardingProgress.findIndex((progress) => progress.id === progressId);
        if (idx < 0) {
          return previous;
        }

        const before = previous.onboardingProgress[idx];
        const after = {
          ...before,
          status,
          evidencia
        };
        const onboardingProgress = previous.onboardingProgress.map((progress, index) =>
          index === idx ? after : progress
        );

        const person = previous.people.find((candidate) => candidate.id === before.personId);
        const audit = createAuditEntry({
          acao: "ATUALIZAR_ONBOARDING_PROGRESSO",
          before,
          after,
          companyId: person?.companyId,
          unitId: person?.unitId
        });

        return appendAudit(
          {
            ...previous,
            onboardingProgress
          },
          audit
        );
      });
    },
    []
  );

  const updatePdiProgress = useCallback((pdiId: string, evolucao: string, evidencia?: string) => {
    setState((previous) => {
      const idx = previous.pdiItems.findIndex((item) => item.id === pdiId);
      if (idx < 0) {
        return previous;
      }
      const before = previous.pdiItems[idx];
      const after = {
        ...before,
        evolucao,
        evidencia
      };
      const pdiItems = previous.pdiItems.map((item, index) => (index === idx ? after : item));
      const person = previous.people.find((candidate) => candidate.id === before.personId);
      const audit = createAuditEntry({
        acao: "ATUALIZAR_PDI_EVOLUCAO",
        before,
        after,
        companyId: person?.companyId,
        unitId: person?.unitId
      });
      return appendAudit(
        {
          ...previous,
          pdiItems
        },
        audit
      );
    });
  }, []);

  const setPermission = useCallback(
    (
      role: UserRole,
      action: keyof AppState["permissions"][UserRole],
      value: boolean
    ) => {
      setState((previous) => {
        const before = previous.permissions[role][action];
        const permissions = {
          ...previous.permissions,
          [role]: {
            ...previous.permissions[role],
            [action]: value
          }
        };
        const audit = createAuditEntry({
          acao: "ATUALIZAR_PERMISSAO_RBAC",
          before,
          after: value,
          companyId: filters.companyId,
          unitId: filters.unitId
        });

        return appendAudit(
          {
            ...previous,
            permissions
          },
          audit
        );
      });
    },
    [filters]
  );

  const updatePaymentRule = useCallback((ruleId: string, patch: Partial<PaymentRule>) => {
    setState((previous) => {
      if (!previous.permissions[MOCK_ACTOR.role].EDITAR_REMUNERACAO_REGRA) {
        return previous;
      }
      const idx = previous.paymentRules.findIndex((rule) => rule.id === ruleId);
      if (idx < 0) {
        return previous;
      }
      const before = previous.paymentRules[idx];
      const after = {
        ...before,
        ...patch
      };
      const paymentRules = previous.paymentRules.map((rule, index) =>
        index === idx ? after : rule
      );
      const audit = createAuditEntry({
        acao: "ATUALIZAR_REGRA_PAGAMENTO",
        before,
        after,
        companyId: after.companyId,
        unitId: after.unitId
      });
      return appendAudit(
        {
          ...previous,
          paymentRules
        },
        audit
      );
    });
  }, []);

  const updateAdditionalType = useCallback(
    (typeId: string, patch: Partial<AdditionalTypeConfig>) => {
      setState((previous) => {
        if (!previous.permissions[MOCK_ACTOR.role].EDITAR_REMUNERACAO_REGRA) {
          return previous;
        }
        const idx = previous.additionalTypes.findIndex((type) => type.id === typeId);
        if (idx < 0) {
          return previous;
        }
        const before = previous.additionalTypes[idx];
        const after = {
          ...before,
          ...patch
        };
        const additionalTypes = previous.additionalTypes.map((type, index) =>
          index === idx ? after : type
        );
        const audit = createAuditEntry({
          acao: "ATUALIZAR_TIPO_ADICIONAL",
          before,
          after,
          companyId: filters.companyId,
          unitId: filters.unitId
        });
        return appendAudit(
          {
            ...previous,
            additionalTypes
          },
          audit
        );
      });
    },
    [filters]
  );

  const assignPersonToSchedule = useCallback(
    (personId: string, targetDate: string, unitId: string, roleId: string, turns: Shift[]) => {
      setState((previous) => {
        const exists = previous.schedules.find(
          (s) => s.date === targetDate && s.personId === personId
        );
        if (exists) {
          const after = { ...exists, unitId, roleId, turns };
          const schedules = previous.schedules.map((s) =>
            s.id === exists.id ? after : s
          );
          const audit = createAuditEntry({
            acao: "ATUALIZAR_ESCALA",
            before: exists,
            after,
            unitId
          });
          return appendAudit({ ...previous, schedules }, audit);
        }
        const newSchedule = {
          id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          date: targetDate,
          personId,
          unidadeId: unitId,
          roleId,
          turns
        };
        const audit = createAuditEntry({
          acao: "CRIAR_ESCALA",
          after: newSchedule,
          unitId
        });
        return appendAudit(
          { ...previous, schedules: [...previous.schedules, newSchedule] },
          audit
        );
      });
    },
    []
  );

  const removeFromSchedule = useCallback((scheduleId: string) => {
    setState((previous) => {
      const target = previous.schedules.find((s) => s.id === scheduleId);
      if (!target) return previous;
      const audit = createAuditEntry({
        acao: "REMOVER_ESCALA",
        before: target,
        unitId: target.unidadeId
      });
      return appendAudit(
        { ...previous, schedules: previous.schedules.filter((s) => s.id !== scheduleId) },
        audit
      );
    });
  }, []);

  const updateCoverageTarget = useCallback(
    (unitId: string, cargoId: string, minimo: number) => {
      setState((previous) => {
        const idx = previous.coverageTargets.findIndex(
          (t) => t.unitId === unitId && t.cargoId === cargoId
        );
        if (idx >= 0) {
          const before = previous.coverageTargets[idx];
          const after = { ...before, minimoHoje: minimo };
          const coverageTargets = previous.coverageTargets.map((t, i) =>
            i === idx ? after : t
          );
          const audit = createAuditEntry({
            acao: "ATUALIZAR_COBERTURA",
            before,
            after,
            unitId
          });
          return appendAudit({ ...previous, coverageTargets }, audit);
        }
        const newTarget = {
          id: `cv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          unitId,
          cargoId,
          minimoHoje: minimo
        };
        const audit = createAuditEntry({
          acao: "CRIAR_COBERTURA",
          after: newTarget,
          unitId
        });
        return appendAudit(
          { ...previous, coverageTargets: [...previous.coverageTargets, newTarget] },
          audit
        );
      });
    },
    []
  );

  const addRole = useCallback((nome: string, familia: string = "OPERACAO", nivel: string = "JUNIOR") => {
    setState((previous) => {
      const newRole: Role = {
        id: `role-${Date.now()}`,
        nome,
        familia,
        nivel,
        defaultType: "FIXO",
        defaultPaymentRuleId: "rule-padrao"
      };

      const audit = createAuditEntry({
        acao: "CRIAR_CARGO",
        before: undefined,
        after: newRole,
        companyId: filters.companyId,
        unitId: filters.unitId
      });

      return appendAudit(
        {
          ...previous,
          roles: [...previous.roles, newRole]
        },
        audit
      );
    });
  }, [filters]);

  const removeRole = useCallback((roleId: string) => {
    setState((previous) => {
      const role = previous.roles.find((r) => r.id === roleId);
      if (!role) return previous;

      const roles = previous.roles.filter((r) => r.id !== roleId);
      const audit = createAuditEntry({
        acao: "REMOVER_CARGO",
        before: role,
        after: undefined,
        companyId: filters.companyId,
        unitId: filters.unitId
      });

      return appendAudit(
        {
          ...previous,
          roles
        },
        audit
      );
    });
  }, [filters]);

  const duplicateDaySchedule = useCallback((fromDay: string, toDay: string, unitId: string) => {
    setState((previous) => {
      // 1. Find schedules to copy
      const sourceSchedules = previous.schedules.filter(
        (s) => s.date === fromDay && s.unidadeId === unitId
      );

      if (sourceSchedules.length === 0) return previous;

      // 2. Remove existing schedules on target day
      const schedulesWithoutTarget = previous.schedules.filter(
        (s) => !(s.date === toDay && s.unidadeId === unitId)
      );

      // 3. Create new schedules
      const newSchedules = sourceSchedules.map((source) => ({
        ...source,
        id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: toDay
      }));

      const audit = createAuditEntry({
        acao: "DUPLICAR_DIA_ESCALA",
        before: { from: fromDay, count: sourceSchedules.length },
        after: { to: toDay, unitId },
        unitId
      });

      return appendAudit(
        {
          ...previous,
          schedules: [...schedulesWithoutTarget, ...newSchedules]
        },
        audit
      );
    });
  }, []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      actor: MOCK_ACTOR,
      date,
      setDate,
      filters,
      setFilters,
      resetFilters,
      paymentContext,
      checkPermission,
      resetState,
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
      sendCommunication,
      runCommunicationAutomations,
      upsertTemplate,
      toggleAutomationRule,
      upsertWebhook,
      syncConnectorEvents,
      updateRecruitmentStage,
      chargeDelayedRecruitmentManagers,
      updateTrainingCompletion,
      sendFlashTraining,
      updateOnboardingProgress,
      updatePdiProgress,
      setPermission,
      updatePaymentRule,
      updateAdditionalType,
      assignPersonToSchedule,
      removeFromSchedule,
      updateCoverageTarget,
      duplicateDaySchedule,
      selectedPersonId,
      setSelectedPersonId,
      addRole,
      removeRole
    }),
    [
      addIndividualAdditional,
      assignPersonToSchedule,
      chargeDelayedRecruitmentManagers,
      checkPermission,
      closePaymentsDay,
      date,
      downloadDayStatementCsv,
      downloadMonthlyPersonReportCsv,
      downloadPixCsv,
      filters,
      paymentContext,
      removeIndividualAdditional,
      reopenPaymentsDay,
      resetFilters,
      resetState,
      sendCommunication,
      runCommunicationAutomations,
      setFilters,
      setGlobalAdditional,
      setGlobalStandardHours,
      setHoursSource,
      setPaymentMode,
      setPaymentStatus,
      setPermission,
      state,
      syncConnectorEvents,
      toggleAutomationRule,
      updateAdditionalType,
      updateOnboardingProgress,
      updatePaymentRule,
      updatePdiProgress,
      updatePersonData,
      updateRecruitmentStage,
      updateScheduleTurn,
      updateTrainingCompletion,
      upsertHours,
      upsertTemplate,
      upsertWebhook,
      validateHours,
      sendFlashTraining,
      sendFlashTraining,
      removeFromSchedule,
      updateCoverageTarget,
      duplicateDaySchedule
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState precisa ser utilizado dentro do AppStateProvider");
  }
  return context;
}
