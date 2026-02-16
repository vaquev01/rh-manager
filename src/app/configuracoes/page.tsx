"use client";

import { useMemo } from "react";
import { Building2, KeyRound, ListChecks, ShieldCheck, Waypoints } from "lucide-react";

import { useAppState } from "@/components/state-provider";
import { ROLE_LABEL } from "@/lib/constants";
import { PermissionAction, Team, Unit } from "@/lib/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function ConfiguracoesPage() {
  const {
    state,
    setPermission,
    updatePaymentRule,
    updateAdditionalType,
    filters
  } = useAppState();

  const permissionActions: PermissionAction[] = Object.keys(
    state.permissions.ADMIN_GRUPO
  ) as PermissionAction[];

  const unitsByCompany = useMemo(() => {
    const map = new Map<string, Unit[]>();
    state.units.forEach((unit) => {
      const current = map.get(unit.companyId) ?? [];
      current.push(unit);
      map.set(unit.companyId, current);
    });
    return map;
  }, [state]);

  const teamsByUnit = useMemo(() => {
    const map = new Map<string, Team[]>();
    state.teams.forEach((team) => {
      const current = map.get(team.unitId) ?? [];
      current.push(team);
      map.set(team.unitId, current);
    });
    return map;
  }, [state]);

  return (
    <div className="page-enter space-y-4">
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="inline-flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Building2 className="h-5 w-5" />
            Multi-empresa e estrutura
          </CardTitle>
          <p className="mt-1 text-xs text-slate-500">
            Hierarquia ativa: Grupo → Empresa → Unidade → Time (2 empresas por padrao no seed).
          </p>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <p className="font-semibold text-slate-700">Grupo: {state.grupo.nome}</p>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              {state.companies.map((company) => (
                <article key={company.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-700">{company.nome}</p>
                  <ul className="mt-2 space-y-2 text-xs text-slate-600">
                    {(unitsByCompany.get(company.id) ?? []).map((unit) => (
                      <li key={unit.id} className="rounded border border-slate-200 bg-white p-2">
                        <p className="font-medium text-slate-700">Unidade: {unit.nome}</p>
                        <p>
                          Times: {(teamsByUnit.get(unit.id) ?? []).map((team) => team.nome).join(", ") || "-"}
                        </p>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1.2fr,1fr]">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="inline-flex items-center gap-2 text-base font-semibold text-slate-800">
              <ShieldCheck className="h-4 w-4" />
              RBAC por acao
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="overflow-auto">
              <table className="table-zebra min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th scope="col" className="px-2 py-2 font-medium text-slate-500">Papel</th>
                    {permissionActions.map((action) => (
                      <th scope="col" key={action} className="px-2 py-2 font-medium text-slate-500">
                        {action}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(Object.keys(state.permissions) as Array<keyof typeof state.permissions>).map((role) => (
                    <tr key={role} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-2 py-2 text-slate-700 font-medium">{ROLE_LABEL[role]}</td>
                      {permissionActions.map((action) => (
                        <td key={`${role}-${action}`} className="px-2 py-2">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-primary focus:ring-primary"
                            aria-label={`${ROLE_LABEL[role]}: ${action}`}
                            checked={state.permissions[role][action]}
                            onChange={(event) => setPermission(role, action, event.target.checked)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="inline-flex items-center gap-2 text-base font-semibold text-slate-800">
              <KeyRound className="h-4 w-4" />
              Tipos de adicional (fixos configuraveis)
            </CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              Regra: tipo OUTRO exige descricao no lancamento.
            </p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ul className="mt-2 space-y-2 text-xs text-slate-600">
              {state.additionalTypes.map((type) => (
                <li key={type.id} className="rounded-lg border border-slate-200 bg-white p-2">
                  <p className="font-semibold text-slate-700">{type.nome}</p>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                        checked={type.ativo}
                        onChange={(event) =>
                          updateAdditionalType(type.id, { ativo: event.target.checked })
                        }
                      />
                      Ativo
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                        checked={type.pagavelViaPixPorPadrao}
                        onChange={(event) =>
                          updateAdditionalType(type.id, {
                            pagavelViaPixPorPadrao: event.target.checked
                          })
                        }
                      />
                      PIX padrao
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                        checked={type.descricaoObrigatoria}
                        onChange={(event) =>
                          updateAdditionalType(type.id, {
                            descricaoObrigatoria: event.target.checked
                          })
                        }
                      />
                      Exige descricao
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="inline-flex items-center gap-2 text-base font-semibold text-slate-800">
            <Waypoints className="h-4 w-4" />
            Cargos e regras de pagamento (hora/diaria/turno)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="overflow-auto">
            <table className="table-zebra min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200">
                  <th scope="col" className="px-2 py-2 font-medium text-slate-500">Regra</th>
                  <th scope="col" className="px-2 py-2 font-medium text-slate-500">Escopo</th>
                  <th scope="col" className="px-2 py-2 font-medium text-slate-500">Tipo</th>
                  <th scope="col" className="px-2 py-2 font-medium text-slate-500">Valor/hora</th>
                  <th scope="col" className="px-2 py-2 font-medium text-slate-500">Diaria</th>
                  <th scope="col" className="px-2 py-2 font-medium text-slate-500">Valor/turno</th>
                  <th scope="col" className="px-2 py-2 font-medium text-slate-500">Qtd turnos padrao</th>
                </tr>
              </thead>
              <tbody>
                {state.paymentRules.map((rule) => {
                  const company = rule.companyId
                    ? state.companies.find((item) => item.id === rule.companyId)?.nome
                    : "Global";
                  const unit = rule.unitId
                    ? state.units.find((item) => item.id === rule.unitId)?.nome
                    : "Todas unidades";

                  return (
                    <tr key={rule.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-2 py-2 text-slate-700">{rule.id}</td>
                      <td className="px-2 py-2 text-slate-700">
                        <p className="font-medium">{company}</p>
                        <p className="text-slate-500">{unit}</p>
                      </td>
                      <td className="px-2 py-2">
                        <Select
                          className="h-8 text-xs"
                          value={rule.type}
                          onChange={(event) =>
                            updatePaymentRule(rule.id, {
                              type: event.target.value as "VALOR_HORA" | "DIARIA" | "TURNO"
                            })
                          }
                        >
                          <option value="VALOR_HORA">Valor hora</option>
                          <option value="DIARIA">Diaria</option>
                          <option value="TURNO">Turno</option>
                        </Select>
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          className="h-8 text-xs w-24"
                          type="number"
                          step={0.01}
                          value={rule.valorHora ?? 0}
                          onChange={(event) =>
                            updatePaymentRule(rule.id, {
                              valorHora: Number(event.target.value || "0")
                            })
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          className="h-8 text-xs w-24"
                          type="number"
                          step={0.01}
                          value={rule.valorDiaria ?? 0}
                          onChange={(event) =>
                            updatePaymentRule(rule.id, {
                              valorDiaria: Number(event.target.value || "0")
                            })
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          className="h-8 text-xs w-24"
                          type="number"
                          step={0.01}
                          value={rule.valorTurno ?? 0}
                          onChange={(event) =>
                            updatePaymentRule(rule.id, {
                              valorTurno: Number(event.target.value || "0")
                            })
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          className="h-8 text-xs w-16"
                          type="number"
                          step={1}
                          value={rule.qtdTurnosPadrao ?? 0}
                          onChange={(event) =>
                            updatePaymentRule(rule.id, {
                              qtdTurnosPadrao: Number(event.target.value || "0")
                            })
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1fr,1.2fr]">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-semibold text-slate-800">Templates por empresa/unidade/time</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ul className="mt-2 space-y-2 text-xs text-slate-600">
              {state.communicationTemplates.map((template) => (
                <li key={template.id} className="rounded-lg border border-slate-200 bg-white p-2">
                  <p className="font-semibold text-slate-700">{template.nome}</p>
                  <p>
                    Escopo: {template.companyId ?? "Global"} / {template.unitId ?? "Todas"} /{" "}
                    {template.teamId ?? "Todos"}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="inline-flex items-center gap-2 text-base font-semibold text-slate-800">
              <ListChecks className="h-4 w-4" />
              Auditoria completa (antes/depois, usuario, timestamp)
            </CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              Escopo atual filtrado: empresa {filters.companyId ?? "todas"}, unidade {filters.unitId ?? "todas"}.
            </p>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ul className="mt-2 max-h-72 space-y-2 overflow-auto text-xs text-slate-600">
              {[...state.auditLogs]
                .reverse()
                .map((entry) => (
                  <li key={entry.id} className="rounded-lg border border-slate-200 bg-white p-2">
                    <p className="font-semibold text-slate-700">{entry.acao}</p>
                    <p>
                      {entry.actorName} ({entry.actorRole}) · {new Date(entry.criadoEm).toLocaleString("pt-BR")}
                    </p>
                    <details className="mt-1">
                      <summary className="cursor-pointer">Before / After</summary>
                      <pre className="mt-1 overflow-auto rounded bg-slate-900 p-2 text-[10px] text-slate-100">
                        {JSON.stringify(
                          {
                            before: entry.before,
                            after: entry.after,
                            companyId: entry.companyId,
                            unitId: entry.unitId
                          },
                          null,
                          2
                        )}
                      </pre>
                    </details>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
