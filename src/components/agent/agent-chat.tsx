"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Square, Bot, User, Database, Loader2, Sparkles, Trash2 } from "lucide-react";
import { useAgentChat, type ChatMessage } from "@/hooks/use-agent-chat";

const TOOL_LABELS: Record<string, string> = {
    get_headcount: "Consultando headcount",
    search_people: "Buscando colaboradores",
    get_people_on_leave: "Verificando ausências",
    get_burn_rate: "Calculando burn rate",
    get_open_vacancies: "Listando vagas abertas",
    get_org_structure: "Carregando estrutura org.",
    get_recent_hires: "Buscando admissões recentes",
    get_anniversary_alerts: "Verificando aniversários",
    create_vacancy: "Criando vaga",
};

const QUICK_PROMPTS = [
    "Quem está de férias essa semana?",
    "Qual o burn rate do mês atual?",
    "Liste as vagas abertas",
    "Mostre o time de Engenharia",
    "Quantos colaboradores temos no total?",
    "Há aniversários próximos?",
    "Admissões nos últimos 30 dias",
    "Estrutura organizacional completa",
];

function MarkdownText({ text }: { text: string }) {
    // Simple inline markdown renderer
    const lines = text.split("\n");
    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                if (line.startsWith("### ")) return <h3 key={i} className="font-bold text-sm mt-2">{line.slice(4)}</h3>;
                if (line.startsWith("## ")) return <h2 key={i} className="font-bold text-base mt-2">{line.slice(3)}</h2>;
                if (line.startsWith("# ")) return <h1 key={i} className="font-bold text-lg mt-2">{line.slice(2)}</h1>;
                if (line.startsWith("| ")) {
                    // Table row
                    const cells = line.split("|").filter(c => c.trim() !== "");
                    const isHeader = lines[i + 1]?.includes("---");
                    if (line.includes("---")) return null; // skip separator
                    return (
                        <div key={i} className={`grid gap-2 text-xs py-1 px-2 rounded ${isHeader ? "bg-muted font-semibold" : "border-b border-border/40"}`}
                            style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}>
                            {cells.map((c, j) => <span key={j}>{c.trim()}</span>)}
                        </div>
                    );
                }
                if (line.startsWith("- ") || line.startsWith("* ")) {
                    return <div key={i} className="flex gap-2 text-sm"><span className="text-muted-foreground">•</span><span>{renderInline(line.slice(2))}</span></div>;
                }
                if (line.startsWith("**") || line.trim() === "") {
                    return <p key={i} className="text-sm leading-relaxed">{renderInline(line)}</p>;
                }
                return <p key={i} className="text-sm leading-relaxed">{renderInline(line)}</p>;
            })}
        </div>
    );
}

function renderInline(text: string): React.ReactNode {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="bg-muted px-1 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
        return part;
    });
}

function ToolCallCard({ tool, status }: { tool: string; toolArgs?: any; status: "running" | "done" }) {
    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border w-fit transition-all ${status === "running"
                ? "bg-blue-500/10 border-blue-500/30 text-blue-400 animate-pulse"
                : "bg-muted border-border text-muted-foreground"
            }`}>
            {status === "running" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
                <Database className="h-3 w-3" />
            )}
            <span>{TOOL_LABELS[tool] ?? tool}</span>
            {status === "done" && <span className="text-emerald-500">✓</span>}
        </div>
    );
}

function Message({ message }: { message: ChatMessage }) {
    const isUser = message.role === "user";

    return (
        <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-violet-600 to-indigo-600 text-white"
                }`}>
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            {/* Content */}
            <div className={`flex flex-col gap-1.5 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
                {/* Tool call cards */}
                {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {message.toolCalls.map((tc, i) => (
                            <ToolCallCard key={i} tool={tc.tool} toolArgs={tc.toolArgs} status={tc.status} />
                        ))}
                    </div>
                )}

                {/* Message bubble */}
                {message.content && (
                    <div className={`px-4 py-3 rounded-2xl text-sm ${isUser
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-card border border-border rounded-tl-sm shadow-sm"
                        }`}>
                        {isUser ? (
                            <p>{message.content}</p>
                        ) : (
                            <MarkdownText text={message.content} />
                        )}
                    </div>
                )}

                {/* Loading indicator */}
                {!isUser && message.content === "" && (!message.toolCalls || message.toolCalls.length === 0) && (
                    <div className="flex gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm bg-card border border-border">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                    </div>
                )}

                <span className="text-[10px] text-muted-foreground px-1">
                    {message.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
            </div>
        </div>
    );
}

export function AgentChat({ compact = false }: { compact?: boolean }) {
    const { messages, isStreaming, error, sendMessage, stopStreaming, clearHistory } = useAgentChat();
    const [input, setInput] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        const text = input.trim();
        if (!text) return;
        setInput("");
        sendMessage(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            handleSend();
        }
    };

    return (
        <div className={`flex flex-col bg-background ${compact ? "h-full" : "h-[calc(100vh-4rem)]"}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-sm">Agente de RH B-People</h2>
                        <p className="text-xs text-muted-foreground">Powered by GPT-4o · Dados em tempo real</p>
                    </div>
                </div>
                {messages.length > 0 && (
                    <button onClick={clearHistory} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Limpar conversa">
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-8">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
                                <Bot className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="font-bold text-lg">Olá, sou seu Agente de RH</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                Tenho acesso em tempo real à sua base de colaboradores, escalas, vagas e custo de pessoas. Pergunte o que quiser.
                            </p>
                        </div>

                        {/* Quick prompts */}
                        <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                            {QUICK_PROMPTS.slice(0, compact ? 4 : 8).map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => sendMessage(prompt)}
                                    className="text-left text-xs px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted hover:border-violet-500/40 transition-all"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <Message key={msg.id} message={msg} />
                ))}

                <div ref={bottomRef} />
            </div>

            {/* Error banner */}
            {error && (
                <div className="mx-6 mb-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">
                    {error}
                </div>
            )}

            {/* Input */}
            <div className="px-6 pb-6 pt-2">
                <div className="flex gap-2 items-end bg-card border border-border rounded-2xl p-2 focus-within:border-violet-500/60 transition-colors shadow-sm">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Pergunte sobre sua equipe..."
                        rows={1}
                        className="flex-1 bg-transparent text-sm resize-none outline-none px-2 py-1.5 max-h-32 placeholder:text-muted-foreground"
                        style={{ minHeight: "36px" }}
                        onInput={(e) => {
                            const t = e.target as HTMLTextAreaElement;
                            t.style.height = "auto";
                            t.style.height = Math.min(t.scrollHeight, 128) + "px";
                        }}
                    />
                    {isStreaming ? (
                        <button
                            onClick={stopStreaming}
                            className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Parar geração"
                        >
                            <Square className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="p-2 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white disabled:opacity-40 hover:shadow-lg hover:shadow-violet-500/20 transition-all"
                            title="Enviar (Ctrl+Enter)"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <p className="text-center text-[10px] text-muted-foreground mt-2">
                    Enter para nova linha · <kbd className="font-mono">⌘ Enter</kbd> para enviar
                </p>
            </div>
        </div>
    );
}
