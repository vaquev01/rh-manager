"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { LayoutGrid, Megaphone, Briefcase, GraduationCap, Settings, RotateCcw, Moon, Sun, Users, LogOut, ShieldCheck, CalendarDays, Sparkles } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABEL } from "@/lib/constants";
import { useAppState } from "@/components/state-provider";
import { useAuth } from "@/components/auth-context";
import { NotificationCenter } from "@/components/notification-center";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Panorama RH",
    icon: LayoutGrid
  },
  {
    href: "/escala",
    label: "Escala",
    icon: CalendarDays
  },
  {
    href: "/equipe",
    label: "Equipe",
    icon: Users
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
    href: "/agente",
    label: "Agente IA",
    icon: Sparkles,
    badge: "IA",
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

  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen pb-10">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-teal-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Pular para conteudo principal
      </a>
      <header className="px-5 pt-4 md:px-8 md:pt-6">
        <div className="panel mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-black text-sm">B</span>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">B People · Multi-Empresa</p>
                <h1 className="text-lg font-semibold text-ink">Central Operacional</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground/90">
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
              {user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="button ghost inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                  title="Super Admin Backoffice"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <NotificationCenter />
              <button
                className="button ghost inline-flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => { logout(); window.location.href = "/landing"; }}
                title={`Sair (${user?.email})`}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </button>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2 border-b border-border/80 px-4 py-3 md:px-6">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all duration-200 ${active
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 font-medium text-emerald-700 dark:text-emerald-300 shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-slate-300 hover:text-foreground/90 hover:shadow-sm"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {(item as any).badge && (
                    <span className="ml-0.5 rounded-full bg-violet-600 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
                      {(item as any).badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-wrap items-end gap-3 px-4 py-3 md:px-6 bg-muted/20 border-b border-border/80">
            <label className="flex-1 min-w-[140px] text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Data
              <input
                className="input mt-1.5 h-8 text-xs font-medium"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>

            <label className="flex-1 min-w-[140px] text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Empresa
              <Select
                value={filters.companyId ?? ""}
                onValueChange={(val) =>
                  setFilters({
                    companyId: val || undefined,
                    unitId: undefined,
                    teamId: undefined
                  })
                }
              >
                <SelectTrigger className="mt-1.5 h-8 text-xs font-medium">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_COMPANIES">Todas</SelectItem>
                  {companyOptions.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="flex-1 min-w-[140px] text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Unidade
              <Select
                value={filters.unitId ?? ""}
                onValueChange={(val) =>
                  setFilters({
                    unitId: val || undefined,
                    teamId: undefined
                  })
                }
              >
                <SelectTrigger className="mt-1.5 h-8 text-xs font-medium">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_UNITS">Todas</SelectItem>
                  {unitOptions.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="flex-1 min-w-[140px] text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Time
              <Select
                value={filters.teamId ?? ""}
                onValueChange={(val) =>
                  setFilters({
                    teamId: val || undefined
                  })
                }
              >
                <SelectTrigger className="mt-1.5 h-8 text-xs font-medium">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_TEAMS">Todos</SelectItem>
                  {teamOptions.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="flex-1 min-w-[140px] text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Cargo
              <Select
                value={filters.cargoId ?? ""}
                onValueChange={(val) =>
                  setFilters({
                    cargoId: val || undefined
                  })
                }
              >
                <SelectTrigger className="mt-1.5 h-8 text-xs font-medium">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_ROLES">Todos</SelectItem>
                  {state.roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <div className="flex items-end w-full sm:w-auto">
              <button className="button w-full sm:w-auto h-8 text-xs" onClick={resetFilters}>
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
