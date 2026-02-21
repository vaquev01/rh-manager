"use client";

import { useCallback, useRef, useState } from "react";

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    toolCalls?: { tool: string; toolArgs?: any; status: "running" | "done" }[];
    createdAt: Date;
}

export function useAgentChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || isStreaming) return;
        setError(null);

        const userMsg: ChatMessage = {
            id: `u-${Date.now()}`,
            role: "user",
            content,
            createdAt: new Date(),
        };

        const assistantId = `a-${Date.now()}`;
        const assistantMsg: ChatMessage = {
            id: assistantId,
            role: "assistant",
            content: "",
            toolCalls: [],
            createdAt: new Date(),
        };

        setMessages((prev) => [...prev, userMsg, assistantMsg]);
        setIsStreaming(true);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            // Build history for API (exclude the empty assistant message we just added)
            const history = [...messages, userMsg].map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const res = await fetch("/api/agent/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: history }),
                signal: controller.signal,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
                throw new Error(err.error ?? "Erro na requisição");
            }

            const reader = res.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    const raw = line.slice(6).trim();
                    if (raw === "[DONE]") break;

                    try {
                        const parsed = JSON.parse(raw);

                        if (parsed.content !== undefined) {
                            // Streaming text token
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === assistantId ? { ...m, content: m.content + parsed.content } : m
                                )
                            );
                        } else if (parsed.tool) {
                            // Tool call notification
                            setMessages((prev) =>
                                prev.map((m) => {
                                    if (m.id !== assistantId) return m;
                                    const existing = m.toolCalls?.find((t) => t.tool === parsed.tool && t.status === "running");
                                    if (parsed.status === "running" && !existing) {
                                        return { ...m, toolCalls: [...(m.toolCalls ?? []), { tool: parsed.tool, toolArgs: parsed.toolArgs, status: "running" }] };
                                    } else if (parsed.status === "done") {
                                        return {
                                            ...m,
                                            toolCalls: (m.toolCalls ?? []).map((t) =>
                                                t.tool === parsed.tool && t.status === "running" ? { ...t, status: "done" as const } : t
                                            ),
                                        };
                                    }
                                    return m;
                                })
                            );
                        } else if (parsed.error) {
                            setError(parsed.error);
                        }
                    } catch {
                        // skip malformed line
                    }
                }
            }
        } catch (e: any) {
            if (e.name !== "AbortError") {
                setError(e.message ?? "Erro na comunicação com o agente");
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId ? { ...m, content: "❌ Erro ao processar sua mensagem. Tente novamente." } : m
                    )
                );
            }
        } finally {
            setIsStreaming(false);
            abortRef.current = null;
        }
    }, [messages, isStreaming]);

    const stopStreaming = useCallback(() => {
        abortRef.current?.abort();
        setIsStreaming(false);
    }, []);

    const clearHistory = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    return { messages, isStreaming, error, sendMessage, stopStreaming, clearHistory };
}
