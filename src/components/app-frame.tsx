"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { LayoutGrid, Megaphone, Briefcase, GraduationCap, Settings, RotateCcw, Moon, Sun } from "lucide-react";

import { ROLE_LABEL } from "@/lib/constants";
import { useAppState } from "@/components/state-provider";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutGrid
  },
  {
    href: "/comunicados",
    label: "Comunicados",
    icon: Megaphone
  },
  {
    href: "/recrutamento",
    label: "Recrutamento",
    icon: Briefcase
  },
  {
    href: "/desenvolvimento",
    label: "Desenvolvimento",
    icon: GraduationCap
  },
  {
    href: "/configuracoes",
    label: "Configuracoes",
    icon: Settings
  }
];

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [dark, setDark] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDark = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }, []);
  const {
    actor,
    date,
    setDate,
    filters,
    setFilters,
    resetFilters,
    state,
    resetState,
    paymentContext
  } = useAppState();

  const companyOptions = state.companies;
  const unitOptions = state.units.filter(
    (unit) => !filters.companyId || unit.companyId === filters.companyId
  );
  const teamOptions = state.teams.filter((team) => {
    const unit = state.units.find((candidate) => candidate.id === team.unitId);
    if (!unit) {
      return false;
    }
    if (filters.companyId && unit.companyId !== filters.companyId) {
      return false;
    }
    if (filters.unitId && team.unitId !== filters.unitId) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen pb-10">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-teal-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Pular para conteudo principal
      </a>
      <header className="px-5 pt-4 md:px-8 md:pt-6">
        <div className="panel mb-4 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-3 md:px-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">People Ops Multi-Empresa</p>
              <h1 className="text-lg font-semibold text-ink">Central Operacional</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="badge badge-ok">Perfil: {ROLE_LABEL[actor.role]}</span>
              <span className="badge badge-warn">Fechamento: {paymentContext.locked ? "Travado" : "Aberto"}</span>
              {!showResetConfirm ? (
                <button className="button ghost inline-flex items-center gap-2" onClick={() => setShowResetConfirm(true)}>
                  <RotateCcw className="h-4 w-4" />
                  Reset demo
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button className="button danger inline-flex items-center gap-1 px-2 py-1 text-xs" onClick={() => { resetState(); setShowResetConfirm(false); }}>
                    Confirmar reset
                  </button>
                  <button className="button ghost px-2 py-1 text-xs" onClick={() => setShowResetConfirm(false)}>
                    Cancelar
                  </button>
                </div>
              )}
              <button
                className="button ghost inline-flex items-center justify-center p-2"
                onClick={toggleDark}
                aria-label={dark ? "Modo claro" : "Modo escuro"}
                title={dark ? "Modo claro" : "Modo escuro"}
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2 border-b border-slate-200/80 px-4 py-3 md:px-6">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all duration-200 ${
                    active
                      ? "border-emerald-600 bg-emerald-50 font-medium text-emerald-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 hover:shadow-sm"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="grid grid-cols-2 gap-3 px-4 py-3 sm:grid-cols-3 md:grid-cols-6 md:px-6">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Data
              <input
                className="input mt-1"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>

            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Empresa
              <select
                className="select mt-1"
                value={filters.companyId ?? ""}
                onChange={(event) =>
                  setFilters({
                    companyId: event.target.value || undefined,
                    unitId: undefined,
                    teamId: undefined
                  })
                }
              >
                <option value="">Todas</option>
                {companyOptions.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Unidade
              <select
                className="select mt-1"
                value={filters.unitId ?? ""}
                onChange={(event) =>
                  setFilters({
                    unitId: event.target.value || undefined,
                    teamId: undefined
                  })
                }
              >
                <option value="">Todas</option>
                {unitOptions.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Time
              <select
                className="select mt-1"
                value={filters.teamId ?? ""}
                onChange={(event) =>
                  setFilters({
                    teamId: event.target.value || undefined
                  })
                }
              >
                <option value="">Todos</option>
                {teamOptions.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cargo
              <select
                className="select mt-1"
                value={filters.cargoId ?? ""}
                onChange={(event) =>
                  setFilters({
                    cargoId: event.target.value || undefined
                  })
                }
              >
                <option value="">Todos</option>
                {state.roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.nome}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <button className="button w-full" onClick={resetFilters}>
                Limpar filtros
              </button>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="px-5 md:px-8">{children}</main>
    </div>
  );
}
