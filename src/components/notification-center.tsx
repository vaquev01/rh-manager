"use client";

import { useState, useMemo } from "react";
import { Bell, X, CheckCheck, Megaphone, Briefcase, CreditCard, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AppNotification {
    id: string;
    type: "info" | "warning" | "success" | "error";
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    icon?: "communication" | "recruitment" | "payment" | "alert" | "schedule";
}

// Mock notifications (will come from API/DB later)
function generateMockNotifications(): AppNotification[] {
    const now = Date.now();
    return [
        {
            id: "n1", type: "warning", title: "PIX ausente",
            message: "3 colaboradores sem chave PIX cadastrada.",
            timestamp: new Date(now - 1800000).toISOString(), read: false, icon: "payment",
        },
        {
            id: "n2", type: "info", title: "Comunicado enviado",
            message: "Disparo de onboarding enviado para 12 pessoas.",
            timestamp: new Date(now - 3600000).toISOString(), read: false, icon: "communication",
        },
        {
            id: "n3", type: "success", title: "Vaga preenchida",
            message: "Atendente Jr — Centro foi preenchida com sucesso.",
            timestamp: new Date(now - 7200000).toISOString(), read: true, icon: "recruitment",
        },
        {
            id: "n4", type: "warning", title: "Treinamento vencido",
            message: "2 colaboradores com certificação expirada.",
            timestamp: new Date(now - 86400000).toISOString(), read: true, icon: "alert",
        },
        {
            id: "n5", type: "info", title: "Escala publicada",
            message: "Escala da semana 10/02–16/02 confirmada.",
            timestamp: new Date(now - 172800000).toISOString(), read: true, icon: "schedule",
        },
    ];
}

const ICON_MAP = {
    communication: Megaphone,
    recruitment: Briefcase,
    payment: CreditCard,
    alert: AlertTriangle,
    schedule: Clock,
};

const TYPE_COLORS = {
    info: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    error: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
};

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "agora";
    if (m < 60) return `${m}min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
}

export function NotificationCenter() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>(generateMockNotifications);

    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const markRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="relative inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors"
                aria-label="Notificações"
            >
                <Bell className="h-4 w-4 text-muted-foreground" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                            <h4 className="text-xs font-bold text-foreground">Notificações</h4>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                                    >
                                        <CheckCheck className="h-3 w-3" />
                                        Marcar lidas
                                    </button>
                                )}
                                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.map((n) => {
                                const Icon = ICON_MAP[n.icon || "alert"];
                                return (
                                    <button
                                        key={n.id}
                                        onClick={() => markRead(n.id)}
                                        className={cn(
                                            "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors border-b border-border/50 last:border-0",
                                            !n.read && "bg-primary/[0.03]"
                                        )}
                                    >
                                        <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", TYPE_COLORS[n.type])}>
                                            <Icon className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className={cn("text-[11px] font-semibold truncate", n.read ? "text-muted-foreground" : "text-foreground")}>
                                                    {n.title}
                                                </p>
                                                {!n.read && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                                            <p className="text-[9px] text-muted-foreground/60 mt-1 font-mono">{timeAgo(n.timestamp)}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
