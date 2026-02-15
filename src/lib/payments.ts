import {
  AdditionalDay,
  AppState,
  DayClosure,
  HoursDay,
  PaymentDayItem,
  PaymentMode,
  PaymentPanelConfig,
  PaymentRule,
  Person,
  ScheduleDay
} from "@/lib/types";

export interface ViewFilters {
  companyId?: string;
  unitId?: string;
  teamId?: string;
  cargoId?: string;
}

export interface ComputedAdditional {
  id: string;
  tipo: AdditionalDay["tipo"];
  valor: number;
  valorEfetivo: number;
  descricao?: string;
  pagavelViaPix: boolean;
  origem: "INDIVIDUAL" | "GLOBAL";
}

export interface ComputedPaymentLine {
  person: Person;
  schedule: ScheduleDay;
  hours: number;
  turnsCount: number;
  paymentRule: PaymentRule;
  base: number;
  additionals: ComputedAdditional[];
  total: number;
  pixValue: number;
  showPix: boolean;
  overrideFlag: boolean;
  motivoOverride?: string;
  validadoHoras: boolean;
  statusPago: "PENDENTE" | "PAGO";
}

export interface PaymentComputation {
  config: PaymentPanelConfig;
  lines: ComputedPaymentLine[];
  totalGeral: number;
  pixSummary: Array<{
    personId: string;
    nome: string;
    chavePix: string;
    valor: number;
  }>;
  closure?: DayClosure;
  locked: boolean;
}

function asSignedAdditionalValue(additional: { tipo: AdditionalDay["tipo"]; valor: number }): number {
  const base = Math.abs(additional.valor);
  return additional.tipo === "DESCONTO" ? -base : base;
}

function appliesToPersonType(
  personType: Person["type"],
  aplicarPara: AdditionalDay["aplicarPara"]
): boolean {
  if (aplicarPara === "TODOS") {
    return true;
  }
  if (aplicarPara === "SO_FREELAS") {
    return personType === "FREELA";
  }
  return personType === "FIXO";
}

function parseHour(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h + m / 60;
}

function scheduleHours(schedule: ScheduleDay): number {
  return schedule.turns.reduce((acc, turn) => {
    const raw = parseHour(turn.fim) - parseHour(turn.inicio);
    return acc + (raw > 0 ? raw : 0);
  }, 0);
}

function resolvePaymentRule(state: AppState, person: Person): PaymentRule {
  const personRule = person.paymentRuleId
    ? state.paymentRules.find((rule) => rule.id === person.paymentRuleId)
    : undefined;
  if (personRule) {
    return personRule;
  }

  const role = state.roles.find((currentRole) => currentRole.id === person.cargoId);
  const roleRule = role
    ? state.paymentRules.find((rule) => rule.id === role.defaultPaymentRuleId)
    : undefined;

  if (roleRule) {
    return roleRule;
  }

  return {
    id: "fallback-hourly",
    type: "VALOR_HORA",
    valorHora: 0
  };
}

function resolveConfig(state: AppState, date: string): PaymentPanelConfig {
  const existing = state.paymentPanelConfigs.find((config) => config.date === date);
  if (existing) {
    return existing;
  }

  return {
    date,
    mode: "CUSTO",
    fonteHoras: "ESCALA_PREVISTA",
    horasPadraoDia: 8
  };
}

function resolveHours(
  config: PaymentPanelConfig,
  schedule: ScheduleDay,
  existingHours: HoursDay | undefined
): { hours: number; overrideFlag: boolean; motivoOverride?: string; validadoHoras: boolean } {
  const fromSchedule = scheduleHours(schedule);
  const fromDefault = config.horasPadraoDia;

  if (!existingHours) {
    const fallbackHours = fromSchedule > 0 ? fromSchedule : fromDefault;
    return {
      hours: fallbackHours,
      overrideFlag: false,
      validadoHoras: false
    };
  }

  if (config.fonteHoras === "APONTAMENTO_REAL") {
    return {
      hours: existingHours.horas,
      overrideFlag: existingHours.overrideFlag,
      motivoOverride: existingHours.motivoOverride,
      validadoHoras: existingHours.validado
    };
  }

  if (existingHours.overrideFlag) {
    return {
      hours: existingHours.horas,
      overrideFlag: true,
      motivoOverride: existingHours.motivoOverride,
      validadoHoras: existingHours.validado
    };
  }

  const fallbackHours = fromSchedule > 0 ? fromSchedule : fromDefault;
  return {
    hours: fallbackHours,
    overrideFlag: false,
    validadoHoras: existingHours.validado
  };
}

function calculateBase(
  rule: PaymentRule,
  hours: number,
  schedule: ScheduleDay
): { base: number; turnsCount: number } {
  if (rule.type === "VALOR_HORA") {
    return {
      base: hours * (rule.valorHora ?? 0),
      turnsCount: schedule.turns.length
    };
  }

  if (rule.type === "DIARIA") {
    return {
      base: rule.valorDiaria ?? 0,
      turnsCount: schedule.turns.length
    };
  }

  const turnsCount = schedule.turns.length || rule.qtdTurnosPadrao || 1;
  return {
    base: (rule.valorTurno ?? 0) * turnsCount,
    turnsCount
  };
}

function isInFilters(person: Person, filters: ViewFilters): boolean {
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

function globalAdditionalForPerson(
  state: AppState,
  date: string,
  person: Person
): ComputedAdditional[] {
  const config = resolveConfig(state, date);
  const additional = config.additionalGlobal;
  if (!additional) {
    return [];
  }

  if (!appliesToPersonType(person.type, additional.aplicarPara)) {
    return [];
  }

  const normalizedValue = asSignedAdditionalValue({
    tipo: additional.tipo,
    valor: additional.valor
  });

  return [
    {
      id: `global-${date}-${person.id}`,
      tipo: additional.tipo,
      valor: additional.valor,
      valorEfetivo: normalizedValue,
      descricao: additional.descricao,
      pagavelViaPix: additional.pagavelViaPix,
      origem: "GLOBAL"
    }
  ];
}

function personAdditionals(state: AppState, date: string, personId: string): ComputedAdditional[] {
  return state.additionalDays
    .filter((additional) => additional.date === date && additional.personId === personId)
    .map((additional) => ({
      id: additional.id,
      tipo: additional.tipo,
      valor: additional.valor,
      valorEfetivo: asSignedAdditionalValue(additional),
      descricao: additional.descricao,
      pagavelViaPix: additional.pagavelViaPix,
      origem: "INDIVIDUAL" as const
    }));
}

function linePixValue(mode: PaymentMode, line: Omit<ComputedPaymentLine, "pixValue" | "showPix">): {
  pixValue: number;
  showPix: boolean;
} {
  const pixFromAdditionals = line.additionals
    .filter((additional) => additional.pagavelViaPix)
    .reduce((acc, additional) => acc + additional.valorEfetivo, 0);

  if (!line.person.pixKey) {
    return { pixValue: 0, showPix: false };
  }

  if (line.person.type === "FREELA") {
    const freelaValue = line.total;
    return {
      pixValue: freelaValue,
      showPix: freelaValue > 0
    };
  }

  const fixedValue = pixFromAdditionals;
  if (mode === "CUSTO" && fixedValue <= 0) {
    return {
      pixValue: 0,
      showPix: false
    };
  }

  return {
    pixValue: fixedValue,
    showPix: fixedValue > 0
  };
}

function paymentStatusForPerson(state: AppState, date: string, personId: string): "PENDENTE" | "PAGO" {
  const found = state.paymentLineStates.find(
    (lineStatus) => lineStatus.date === date && lineStatus.personId === personId
  );
  return found?.statusPago ?? "PENDENTE";
}

function closureMatchesFilters(closure: DayClosure, filters: ViewFilters): boolean {
  if ((closure.companyId ?? "") !== (filters.companyId ?? "")) {
    return false;
  }
  if ((closure.unitId ?? "") !== (filters.unitId ?? "")) {
    return false;
  }
  if ((closure.teamId ?? "") !== (filters.teamId ?? "")) {
    return false;
  }
  if ((closure.cargoId ?? "") !== (filters.cargoId ?? "")) {
    return false;
  }
  return true;
}

function activeClosure(state: AppState, date: string, filters: ViewFilters): DayClosure | undefined {
  return [...state.dayClosures]
    .reverse()
    .find(
      (closure) =>
        closure.date === date &&
        !closure.reabertoEm &&
        closureMatchesFilters(closure, filters)
    );
}

export function computePaymentContext(
  state: AppState,
  date: string,
  filters: ViewFilters = {}
): PaymentComputation {
  const config = resolveConfig(state, date);
  const closure = activeClosure(state, date, filters);

  const lines = state.schedules
    .filter((schedule) => schedule.date === date)
    .map((schedule) => {
      const person = state.people.find((candidate) => candidate.id === schedule.personId);
      if (!person) {
        return null;
      }
      if (!isInFilters(person, filters)) {
        return null;
      }

      const hoursEntry = state.hoursDays.find(
        (hoursDay) => hoursDay.date === date && hoursDay.personId === person.id
      );
      const resolvedHours = resolveHours(config, schedule, hoursEntry);
      const rule = resolvePaymentRule(state, person);
      const baseCalc = calculateBase(rule, resolvedHours.hours, schedule);
      const additionals = [...personAdditionals(state, date, person.id), ...globalAdditionalForPerson(state, date, person)];
      const total = baseCalc.base + additionals.reduce((acc, currentAdditional) => acc + currentAdditional.valorEfetivo, 0);
      const baseLine: Omit<ComputedPaymentLine, "pixValue" | "showPix"> = {
        person,
        schedule,
        hours: resolvedHours.hours,
        turnsCount: baseCalc.turnsCount,
        paymentRule: rule,
        base: baseCalc.base,
        additionals,
        total,
        overrideFlag: resolvedHours.overrideFlag,
        motivoOverride: resolvedHours.motivoOverride,
        validadoHoras: resolvedHours.validadoHoras,
        statusPago: paymentStatusForPerson(state, date, person.id)
      };
      const pix = linePixValue(config.mode, baseLine);
      return {
        ...baseLine,
        pixValue: pix.pixValue,
        showPix: pix.showPix
      };
    })
    .filter((line): line is ComputedPaymentLine => Boolean(line));

  const totalGeral = lines.reduce((acc, line) => acc + line.total, 0);

  const pixSummary = lines
    .filter((line) => line.showPix && line.pixValue > 0 && line.person.pixKey)
    .map((line) => ({
      personId: line.person.id,
      nome: line.person.nome,
      chavePix: line.person.pixKey ?? "",
      valor: line.pixValue
    }));

  return {
    config,
    lines,
    totalGeral,
    pixSummary,
    closure,
    locked: Boolean(closure)
  };
}

export function snapshotFromComputedLine(line: ComputedPaymentLine): PaymentDayItem {
  return {
    id: `item-${line.person.id}-${Date.now()}`,
    date: line.schedule.date,
    personId: line.person.id,
    valorBase: line.base,
    adicionais: line.additionals.map((additional) => ({
      tipo: additional.tipo,
      valor: additional.valorEfetivo,
      descricao: additional.descricao,
      pagavelViaPix: additional.pagavelViaPix
    })),
    total: line.total,
    pixSnapshot: line.showPix
      ? {
          chavePix: line.person.pixKey,
          valor: line.pixValue
        }
      : undefined,
    paymentRuleSnapshot: line.paymentRule,
    horasSnapshot: line.hours,
    statusPago: line.statusPago
  };
}
