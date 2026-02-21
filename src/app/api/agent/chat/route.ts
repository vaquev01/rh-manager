import { NextRequest } from "next/server";
import OpenAI from "openai";
import { getAuthSession } from "@/lib/auth";
import { AGENT_TOOLS, executeTool, ToolName } from "@/lib/agent-tools";

let _openai: OpenAI | null = null;
function getOpenAI() {
    if (!_openai) {
        _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "missing" });
    }
    return _openai;
}

const SYSTEM_PROMPT = `Você é o **Agente de RH da B-People** — um assistente de gestão de pessoas especializado e altamente capaz.

Seu papel:
- Responder perguntas sobre colaboradores, equipes, escalas, vagas e custos
- Analisar dados de RH em tempo real
- Identificar alertas proativos (aniversários, férias, vagas em aberto)
- Ajudar gestores a tomar decisões baseadas em dados

Diretrizes:
- Sempre use as ferramentas disponíveis para buscar dados reais antes de responder
- Responda em português brasileiro, de forma clara e concisa
- Use tabelas quando for apresentar listas de dados
- Use emojis para tornar as respostas mais visuais e fáceis de ler
- Quando criar vagas ou fazer ações, confirme com detalhes
- Se não houver dados, seja honesto e diga que o banco está vazio
- Hoje é ${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}

Tom: profissional, direto, útil.`;

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
    try {
        const session = await getAuthSession();
        const tenantId = session.user.tenantId;
        const body = await request.json();
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = body.messages ?? [];

        if (!messages.length) {
            return new Response("Mensagens obrigatórias", { status: 400 });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const send = (data: string) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: data })}\n\n`));
                };
                const sendMeta = (meta: object) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(meta)}\n\n`));
                };

                try {
                    // Tool-calling loop
                    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
                        { role: "system", content: SYSTEM_PROMPT },
                        ...messages,
                    ];

                    let iterCount = 0;
                    const MAX_ITERS = 5; // prevent infinite loops

                    while (iterCount < MAX_ITERS) {
                        iterCount++;

                        // Call OpenAI — non-streaming for tool calls, streaming for final response
                        const hasToolResponse = iterCount > 1;
                        const lastMsg = chatMessages[chatMessages.length - 1];
                        const expectingFinal = lastMsg.role === "tool";

                        if (expectingFinal || iterCount >= MAX_ITERS) {
                            // Stream the final answer
                            const finalStream = await getOpenAI().chat.completions.create({
                                model: process.env.OPENAI_MODEL || "gpt-4o-mini",
                                messages: chatMessages,
                                stream: true,
                                temperature: 0.3,
                            });

                            for await (const chunk of finalStream) {
                                const delta = chunk.choices[0]?.delta?.content;
                                if (delta) send(delta);
                            }
                            break;
                        }

                        // Non-streaming call to detect tool_calls
                        const response = await getOpenAI().chat.completions.create({
                            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
                            messages: chatMessages,
                            tools: AGENT_TOOLS as any,
                            tool_choice: "auto",
                            temperature: 0.3,
                        });

                        const message = response.choices[0]?.message;
                        if (!message) break;

                        chatMessages.push(message);

                        const toolCalls = message.tool_calls;
                        if (!toolCalls || toolCalls.length === 0) {
                            // No tool calls — stream the direct response
                            const content = message.content || "";
                            if (content) {
                                // Simulate streaming by sending chunks
                                const words = content.split(" ");
                                for (const word of words) {
                                    send(word + " ");
                                    await new Promise(r => setTimeout(r, 10));
                                }
                            }
                            break;
                        }

                        // Execute all tool calls
                        for (const tc of toolCalls) {
                            const tca = tc as any;
                            const toolName = tca.function.name as ToolName;
                            const toolArgs = JSON.parse(tca.function.arguments || "{}");

                            // Notify UI about tool execution
                            sendMeta({ tool: toolName, toolArgs, status: "running" });

                            const result = await executeTool(toolName, toolArgs, tenantId);

                            sendMeta({ tool: toolName, status: "done" });

                            chatMessages.push({
                                role: "tool",
                                tool_call_id: tc.id,
                                content: result,
                            });
                        }
                    }

                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                } catch (err: any) {
                    sendMeta({ error: err.message ?? "Erro no agente" });
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
                "X-Accel-Buffering": "no",
            },
        });
    } catch (e: any) {
        const status = e.message === "Não autenticado" ? 401 : 500;
        return new Response(JSON.stringify({ error: e.message }), { status, headers: { "Content-Type": "application/json" } });
    }
}
