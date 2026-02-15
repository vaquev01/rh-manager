import { TODAY } from "@/lib/date";
import { computePaymentContext, ViewFilters } from "@/lib/payments";
import { AppState, Person } from "@/lib/types";

export function filteredPeople(state: AppState, filters: ViewFilters): Person[] {
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
}

export function todayScheduledPersonIds(state: AppState, date: string): Set<string> {
  return new Set(
    state.schedules
      .filter((schedule) => schedule.date === date)
      .map((schedule) => schedule.personId)
  );
}

export function docsBadge(state: AppState, personId: string): "OK" | "PENDENTE" {
  const docs = state.documents.filter((doc) => doc.personId === personId);
  if (!docs.length) {
    return "PENDENTE";
  }
  return docs.some((doc) => doc.status === "PENDENTE") ? "PENDENTE" : "OK";
}

export function pixBadge(person: Person): "OK" | "FALTA" {
  return person.pixKey ? "OK" : "FALTA";
}

export function groupedByOrg(
  state: AppState,
  filters: ViewFilters,
  date: string = TODAY
): Array<{
  leaderLabel: string;
  teamLabel: string;
  roleLabel: string;
  people: Person[];
}> {
  const people = filteredPeople(state, filters);
  const scheduledIds = todayScheduledPersonIds(state, date);

  const map = new Map<
    string,
    {
      leaderLabel: string;
      teamLabel: string;
      roleLabel: string;
      people: Person[];
    }
  >();

  people
    .filter((person) => scheduledIds.has(person.id) || person.status !== "ATIVO")
    .forEach((person) => {
      const leader = person.leaderPersonId
        ? state.people.find((candidate) => candidate.id === person.leaderPersonId)
        : undefined;
      const team = state.teams.find((candidate) => candidate.id === person.teamId);
      const role = state.roles.find((candidate) => candidate.id === person.cargoId);

      const leaderLabel = leader ? leader.nome : "Sem lider definido";
      const teamLabel = team?.nome ?? "Sem time";
      const roleLabel = role?.nome ?? "Sem cargo";

      const key = `${leaderLabel}::${teamLabel}::${roleLabel}`;
      const current = map.get(key);
      if (!current) {
        map.set(key, {
          leaderLabel,
          teamLabel,
          roleLabel,
          people: [person]
        });
      } else {
        current.people.push(person);
      }
    });

  return [...map.values()].sort((a, b) => {
    const keyA = `${a.leaderLabel} ${a.teamLabel} ${a.roleLabel}`;
    const keyB = `${b.leaderLabel} ${b.teamLabel} ${b.roleLabel}`;
    return keyA.localeCompare(keyB, "pt-BR");
  });
}

export function dashboardHighlights(
  state: AppState,
  filters: ViewFilters,
  date: string
): {
  buracosEscala: Array<{ unitName: string; roleName: string; falta: number }>;
  semPixEscalados: Person[];
  docsCriticosPendentes: number;
  pagamentosPendentes: number;
  pagamentosFechados: number;
  custoEstimado: number;
} {
  const payment = computePaymentContext(state, date, filters);
  const scheduledIds = todayScheduledPersonIds(state, date);

  const scheduledPeople = state.people.filter((person) => {
    if (!scheduledIds.has(person.id)) {
      return false;
    }
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

  const buracosEscala: Array<{ unitName: string; roleName: string; falta: number }> = [];

  state.coverageTargets.forEach((target) => {
    if (filters.unitId && filters.unitId !== target.unitId) {
      return;
    }
    const unit = state.units.find((unitItem) => unitItem.id === target.unitId);
    if (!unit) {
      return;
    }
    if (filters.companyId && unit.companyId !== filters.companyId) {
      return;
    }

    const count = scheduledPeople.filter(
      (person) => person.unitId === target.unitId && person.cargoId === target.cargoId
    ).length;

    if (count < target.minimoHoje) {
      const role = state.roles.find((roleItem) => roleItem.id === target.cargoId);
      buracosEscala.push({
        unitName: unit.nome,
        roleName: role?.nome ?? "Cargo",
        falta: target.minimoHoje - count
      });
    }
  });

  const semPixEscalados = scheduledPeople.filter((person) => {
    const line = payment.lines.find((currentLine) => currentLine.person.id === person.id);
    const hasPayablePixAdditional = Boolean(
      line?.additionals.some(
        (additional) => additional.pagavelViaPix && additional.valorEfetivo > 0
      )
    );
    const isPixMandatory = person.type === "FREELA" || hasPayablePixAdditional;
    return isPixMandatory && !person.pixKey;
  });

  const docsCriticosPendentes = state.documents.filter((doc) => {
    if (doc.status !== "PENDENTE") {
      return false;
    }
    if (doc.criticidade !== "ALTA") {
      return false;
    }
    const person = state.people.find((candidate) => candidate.id === doc.personId);
    if (!person) {
      return false;
    }
    if (filters.companyId && person.companyId !== filters.companyId) {
      return false;
    }
    if (filters.unitId && person.unitId !== filters.unitId) {
      return false;
    }
    return true;
  }).length;

  const pagamentosPendentes = payment.lines.filter((line) => line.statusPago === "PENDENTE").length;
  const pagamentosFechados = payment.locked ? payment.lines.length : 0;

  return {
    buracosEscala,
    semPixEscalados,
    docsCriticosPendentes,
    pagamentosPendentes,
    pagamentosFechados,
    custoEstimado: payment.totalGeral
  };
}

export function personHistory(state: AppState, personId: string): {
  paymentItems: AppState["paymentDayItems"];
  hours: AppState["hoursDays"];
  schedules: AppState["schedules"];
  additionals: AppState["additionalDays"];
} {
  const paymentItems = state.paymentDayItems
    .filter((item) => item.personId === personId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const hours = state.hoursDays
    .filter((entry) => entry.personId === personId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const schedules = state.schedules
    .filter((entry) => entry.personId === personId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const additionals = state.additionalDays
    .filter((entry) => entry.personId === personId)
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    paymentItems,
    hours,
    schedules,
    additionals
  };
}
