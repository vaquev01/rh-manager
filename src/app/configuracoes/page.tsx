"use client";

import { useMemo } from "react";
import { Building2, KeyRound, ListChecks, ShieldCheck, Waypoints, Info } from "lucide-react";

import { useAppState } from "@/components/state-provider";
import { ROLE_LABEL } from "@/lib/constants";
import { PermissionAction, Team, Unit } from "@/lib/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

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
    <div className="page-enter space-y-6">
      <Card>
        <CardHeader className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">
                Multi-empresa e Estrutura
              </CardTitle>
              <p className="text-xs text-slate-500 font-medium">
                Hierarquia: Grupo → Empresa → Unidade → Time
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="bg-white px-3 py-1 text-sm font-bold text-slate-700 shadow-sm">
                Grupo: {state.grupo.nome}
              </Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {state.companies.map((company) => (
                <article key={company.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                    <p className="font-bold text-slate-800">{company.nome}</p>
                  </div>
                  <div className="p-3">
                    <ul className="space-y-3 text-xs text-slate-600">
                      {(unitsByCompany.get(company.id) ?? []).map((unit) => (
                        <li key={unit.id} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-2 w-2 rounded-full bg-blue-400" />
                            <p className="font-medium text-slate-700 text-sm">{unit.nome}</p>
                          </div>
                          <div className="pl-4">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Times</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(teamsByUnit.get(unit.id) ?? []).map((team) => (
                                <Badge key={team.id} variant="secondary" className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50">
                                  {team.nome}
                                </Badge>
                              ))}
                              {(teamsByUnit.get(unit.id) ?? []).length === 0 && <span className="text-slate-400 italic">Nenhum time</span>}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.5fr,1fr]">
        <Card>
          <CardHeader className="px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
              </div>
              <CardTitle className="text-base font-bold text-slate-800">
                Controle de Acesso (RBAC)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[400px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold text-slate-600 border-b">Papel</th>
                    {permissionActions.map((action) => (
                      <th scope="col" key={action} className="px-3 py-3 font-semibold text-slate-500 border-b text-center min-w-[80px]">
                        {action.replace('VER_', '').replace('EDITAR_', '').replace('ADMIN_', '')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(Object.keys(state.permissions) as Array<keyof typeof state.permissions>).map((role) => (
                    <tr key={role} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-slate-700 font-bold bg-white sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        {ROLE_LABEL[role]}
                      </td>
                      {permissionActions.map((action) => (
                        <td key={`${role}-${action}`} className="px-3 py-3 text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={state.permissions[role][action]}
                              onCheckedChange={(checked) => setPermission(role, action, checked)}
                              aria-label={`${ROLE_LABEL[role]}: ${action}`}
                              className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                            />
                          </div>
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
          <CardHeader className="px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <KeyRound className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-800">
                  Tipos de Adicional
                </CardTitle>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Configure regras para lançamentos extras
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-3">
              {state.additionalTypes.map((type) => (
                <li key={type.id} className="group rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-emerald-200 hover:shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-slate-800 flex items-center gap-2">
                      {type.nome}
                      {type.ativo ?
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 h-5 px-1.5 text-[9px]">Ativo</Badge> :
                        <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 h-5 px-1.5 text-[9px]">Inativo</Badge>
                      }
                    </p>
                    <Switch
                      checked={type.ativo}
                      onCheckedChange={(checked) => updateAdditionalType(type.id, { ativo: checked })}
                      className="scale-90 data-[state=checked]:bg-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 font-medium">PIX Padrão</span>
                      <Switch
                        checked={type.pagavelViaPixPorPadrao}
                        onCheckedChange={(checked) => updateAdditionalType(type.id, { pagavelViaPixPorPadrao: checked })}
                        className="scale-75 data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-600 font-medium">Exige Descrição</span>
                        <Tooltip content="Obrigatório preencher motivo ao lançar">
                          <Info className="h-3 w-3 text-slate-400" />
                        </Tooltip>
                      </div>
                      <Switch
                        checked={type.descricaoObrigatoria}
                        onCheckedChange={(checked) => updateAdditionalType(type.id, { descricaoObrigatoria: checked })}
                        className="scale-75 data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Waypoints className="h-4 w-4 text-purple-600" />
            </div>
            <CardTitle className="text-base font-bold text-slate-800">
              Regras de Pagamento
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-500">Regra</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Escopo</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Calculo</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Valor Hora</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Diária</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Valor Turno</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Turnos Padrão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.paymentRules.map((rule) => {
                  const company = rule.companyId
                    ? state.companies.find((item) => item.id === rule.companyId)?.nome
                    : "Global";
                  const unit = rule.unitId
                    ? state.units.find((item) => item.id === rule.unitId)?.nome
                    : "Todas unidades";

                  return (
                    <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-700 font-mono text-[10px]">{rule.id.substring(0, 8)}...</td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{company}</span>
                          <span className="text-[10px] text-slate-500">{unit}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          className="h-8 text-xs border-slate-200"
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
                      <td className="px-4 py-3">
                        <Input
                          className="h-8 text-xs w-24 border-slate-200"
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
                      <td className="px-4 py-3">
                        <Input
                          className="h-8 text-xs w-24 border-slate-200"
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
                      <td className="px-4 py-3">
                        <Input
                          className="h-8 text-xs w-24 border-slate-200"
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
                      <td className="px-4 py-3">
                        <Input
                          className="h-8 text-xs w-20 border-slate-200"
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

      <div className="grid gap-6 xl:grid-cols-[1fr,1.2fr]">
        <Card>
          <CardHeader className="px-6 py-4 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800">Templates de Comunicação</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-2">
              {state.communicationTemplates.map((template) => (
                <li key={template.id} className="rounded-xl border border-slate-200 bg-white p-3 hover:border-blue-200 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-700">{template.nome}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {template.companyId ? "Empresa" : "Global"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Escopo: {template.unitId ?? "Todas"} / {template.teamId ?? "Todos"}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-6 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <ListChecks className="h-4 w-4 text-slate-600" />
                </div>
                <CardTitle className="text-base font-bold text-slate-800">
                  Auditoria
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[400px]">
              <ul className="divide-y divide-slate-100">
                {[...state.auditLogs]
                  .reverse()
                  .slice(0, 50)
                  .map((entry) => (
                    <li key={entry.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-slate-500">{entry.actorName?.charAt(0) ?? "?"}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-800 text-sm truncate">{entry.acao.replace(/_/g, " ")}</p>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(entry.criadoEm).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {entry.actorName} ({entry.actorRole})
                          </p>

                          {!!entry.before && !!entry.after && (
                            <div className="mt-2 text-[10px] font-mono bg-slate-900 rounded-lg p-3 overflow-x-auto">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-red-300">
                                  <div className="uppercase opacity-50 mb-1">Antes</div>
                                  {JSON.stringify(entry.before ?? {}, null, 1)?.slice(0, 100)}
                                </div>
                                <div className="text-emerald-300">
                                  <div className="uppercase opacity-50 mb-1">Depois</div>
                                  {JSON.stringify(entry.after ?? {}, null, 1)?.slice(0, 100)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
