"use client";

import { useState } from "react";
import { Bot, X, Sparkles } from "lucide-react";
import { AgentChat } from "./agent-chat";

export function AgentWidget() {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Floating panel */}
            {open && (
                <div className="fixed bottom-24 right-6 z-50 w-[420px] h-[600px] bg-background border border-border rounded-2xl shadow-2xl shadow-black/30 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
                    {/* Close button overlay */}
                    <button
                        onClick={() => setOpen(false)}
                        className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <AgentChat compact />
                </div>
            )}

            {/* FAB button */}
            <button
                onClick={() => setOpen((v) => !v)}
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${open
                        ? "bg-background border border-border text-foreground"
                        : "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40"
                    }`}
                title="Agente de RH B-People"
            >
                {open ? <X className="h-5 w-5" /> : <Sparkles className="h-6 w-6" />}
            </button>
        </>
    );
}
