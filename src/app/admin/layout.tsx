import { ReactNode } from "react";
import Link from "next/link";
import { Search, Bell, Settings, LogOut, Users, BarChart3, Building2, ShieldCheck, Activity } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Mobile Header (visible only on mobile) */}
            <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    <span className="font-bold">B People Admin</span>
                </div>
                <button className="p-2 hover:bg-slate-800 rounded-lg">
                    <Settings className="h-5 w-5 text-slate-400" />
                </button>
            </div>

            {/* Sidebar Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 min-h-screen sticky top-0">
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="h-6 w-6 text-emerald-400" />
                        <span className="font-bold text-white text-lg">Super Admin</span>
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">B People Backoffice</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-medium">
                        <BarChart3 className="h-4 w-4" /> Overview MRR
                    </Link>
                    <Link href="/admin/tenants" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                        <Building2 className="h-4 w-4" /> Tenants (Clientes)
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                        <Users className="h-4 w-4" /> Global Users
                    </Link>
                    <Link href="/admin/system" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                        <Activity className="h-4 w-4" /> System Health
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <Link href="/landing" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-sm">
                        <LogOut className="h-4 w-4" /> Sair do Admin
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Desktop Header */}
                <header className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 sticky top-0 z-10">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar tenant, usuário, invoice..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
                        </button>
                        <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center border-2 border-slate-200">
                            <span className="text-white text-xs font-bold">SA</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
