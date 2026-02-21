"use client";

import { AgentChat } from "@/components/agent/agent-chat";
import { Bot } from "lucide-react";

export default function AgentePage() {
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Page header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card/30">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                    <h1 className="font-semibold text-sm">Agente de RH — B-People</h1>
                    <p className="text-xs text-muted-foreground">IA com acesso em tempo real à sua base de dados</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Conectado ao banco de dados
                </div>
            </div>

            {/* Full-page chat */}
            <div className="flex-1 overflow-hidden">
                <AgentChat />
            </div>
        </div>
    );
}
