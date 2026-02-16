"use client";

import { useMemo, useState } from "react";
import { Bot, FileText, History, MessageCircle, Send, Sparkles, Workflow, Zap } from "lucide-react";

import { useToast } from "@/components/toast";

import { useAppState } from "@/components/state-provider";

function aiTransform(action: string, text: string): string {
  const cleanText = text.trim();
  if (!cleanText) {
    return "";
  }

  switch (action) {
    case "shorten": {
      const words = cleanText.split(/\s+/);
      const shortened = words.slice(0, Math.max(8, Math.floor(words.length * 0.6))).join(" ");
      return shortened.endsWith(".") ? shortened : `${shortened}.`;
    }
    case "firm":
      return `ATENCAO: ${cleanText} Esta orientacao requer confirmacao imediata.`;
    case "friendly":
      return `Oi, time! 😊 ${cleanText} Qualquer duvida, estamos por aqui para apoiar.`;
    case "bullets": {
      const chunks = cleanText
        .split(/[.!?]\s+/)
        .map((item) => item.trim())
        .filter(Boolean);
      return chunks.map((item) => `• ${item}`).join("\n");
    }
    case "versions": {
      return [
        `Versao 1 (direta): ${cleanText}`,
        `Versao 2 (acolhedora): Oi pessoal, ${cleanText.toLowerCase()}`,
        `Versao 3 (objetiva): Acao imediata -> ${cleanText}`
      ].join("\n\n");
    }
    default:
      return cleanText;
  }
}

export default function ComunicadosPage() {
  const {
    state,
    sendCommunication,
    runCommunicationAutomations,
    upsertTemplate,
    toggleAutomationRule,
    upsertWebhook,
    syncConnectorEvents,
    filters
  } = useAppState();

  const { toast } = useToast();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateNameDraft, setTemplateNameDraft] = useState<string>("");
  const [editorText, setEditorText] = useState<string>("");
  const [aiResult, setAiResult] = useState<string>("");
  const [lastRecipients, setLastRecipients] = useState<number>(0);
  const [lastAutomationResult, setLastAutomationResult] = useState<{
    campanhas: number;
    destinatarios: number;
  }>({ campanhas: 0, destinatarios: 0 });
  const [webhookDraft, setWebhookDraft] = useState({
    nome: "",
    endpoint: "",
    ativo: false,
    aviso: true,
    recrutamento: true,
    treinamento: false
  });

  const [segmentacao, setSegmentacao] = useState<{
    companyId?: string;
    unitId?: string;
    teamId?: string;
    cargoId?: string;
    tipo?: "FIXO" | "FREELA";
    status?: "ATIVO" | "FERIAS" | "AFASTADO" | "OFF_HOJE";
  }>({
    companyId: filters.companyId,
    unitId: filters.unitId,
    teamId: filters.teamId,
    cargoId: filters.cargoId
  });

  const templates = useMemo(() => {
    return state.communicationTemplates.filter((template) => {
      if (segmentacao.companyId && template.companyId && template.companyId !== segmentacao.companyId) {
        return false;
      }
      if (segmentacao.unitId && template.unitId && template.unitId !== segmentacao.unitId) {
        return false;
      }
      return true;
    });
  }, [state.communicationTemplates, segmentacao.companyId, segmentacao.unitId]);

  const campaignsWithDetails = useMemo(() => {
    return [...state.communicationCampaigns]
      .reverse()
      .map((campaign) => {
        const recipients = state.communicationLogs.filter((log) => log.campaignId === campaign.id);
        return {
          campaign,
          recipients
        };
      });
  }, [state.communicationCampaigns, state.communicationLogs]);

  const unitOptions = state.units.filter(
    (unit) => !segmentacao.companyId || unit.companyId === segmentacao.companyId
  );

  const teamOptions = state.teams.filter((team) => {
    const unit = state.units.find((current) => current.id === team.unitId);
    if (!unit) {
      return false;
    }
    if (segmentacao.companyId && unit.companyId !== segmentacao.companyId) {
      return false;
    }
    if (segmentacao.unitId && team.unitId !== segmentacao.unitId) {
      return false;
    }
    return true;
  });

  const selectedTemplate = selectedTemplateId
    ? state.communicationTemplates.find((template) => template.id === selectedTemplateId)
    : undefined;

  const recipientPreviewCount = useMemo(() => {
    return state.people.filter((person) => {
      if (segmentacao.companyId && person.companyId !== segmentacao.companyId) return false;
      if (segmentacao.unitId && person.unitId !== segmentacao.unitId) return false;
      if (segmentacao.teamId && person.teamId !== segmentacao.teamId) return false;
      if (segmentacao.cargoId && person.cargoId !== segmentacao.cargoId) return false;
      if (segmentacao.tipo && person.type !== segmentacao.tipo) return false;
      if (segmentacao.status && person.status !== segmentacao.status) return false;
      return true;
    }).length;
  }, [state.people, segmentacao]);

  return (
    <div className="page-enter grid gap-4 xl:grid-cols-[1.2fr,1fr]">
      <section className="space-y-4">
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                <MessageCircle className="h-4 w-4 text-teal-600" />
              </span>
              <h2 className="text-lg font-semibold text-slate-800">Editor de comunicados</h2>
            </div>
            <span className="badge badge-ok">WhatsApp + IA</span>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <label className="text-xs text-slate-500">
              Selecionar template
              <select
                className="select mt-1"
                value={selectedTemplateId}
                onChange={(event) => {
                  const value = event.target.value;
                  setSelectedTemplateId(value);
                  const template = state.communicationTemplates.find((item) => item.id === value);
                  if (template) {
                    setEditorText(template.conteudo);
                    setAiResult(template.conteudo);
                  }
                }}
              >
                <option value="">Sem template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-slate-500">
              Nome do template
              <input
                className="input mt-1"
                value={templateNameDraft}
                onChange={(event) => setTemplateNameDraft(event.target.value)}
                placeholder="Ex.: Pendencia onboarding"
              />
            </label>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-xs text-slate-500">
              Conteudo base
              <textarea
                className="textarea mt-1"
                value={editorText}
                onChange={(event) => {
                  setEditorText(event.target.value);
                  if (!aiResult) {
                    setAiResult(event.target.value);
                  }
                }}
              />
            </label>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Bot className="h-4 w-4" />
                Apoio IA
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button className="button" onClick={() => setAiResult(aiTransform("shorten", editorText))}>
                  Encurtar
                </button>
                <button className="button" onClick={() => setAiResult(aiTransform("firm", editorText))}>
                  Mais firme
                </button>
                <button className="button" onClick={() => setAiResult(aiTransform("friendly", editorText))}>
                  Mais amigavel
                </button>
                <button className="button" onClick={() => setAiResult(aiTransform("bullets", editorText))}>
                  Em bullets
                </button>
                <button className="button secondary col-span-2" onClick={() => setAiResult(aiTransform("versions", editorText))}>
                  <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                  Gerar 3 versoes
                </button>
              </div>

              <label className="mt-2 block text-xs text-slate-500">
                Resultado final
                <textarea
                  className="textarea mt-1"
                  value={aiResult}
                  onChange={(event) => setAiResult(event.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <button
              className="button"
              onClick={() => {
                if (!templateNameDraft.trim()) {
                  toast("Informe um nome para o template.", "error");
                  return;
                }
                if (!(aiResult || editorText).trim()) {
                  toast("O conteúdo do template está vazio.", "error");
                  return;
                }
                upsertTemplate({
                  id: selectedTemplate?.id,
                  nome: templateNameDraft,
                  conteudo: aiResult || editorText,
                  companyId: segmentacao.companyId,
                  unitId: segmentacao.unitId,
                  teamId: segmentacao.teamId
                });
                setTemplateNameDraft("");
                toast("Template salvo com sucesso.", "success");
              }}
            >
              Salvar template
            </button>

            <button
              className="button primary"
              onClick={() => {
                const recipients = sendCommunication({
                  templateId: selectedTemplateId || undefined,
                  conteudoFinal: aiResult || editorText,
                  segmentacao,
                  gatilho: undefined
                });
                setLastRecipients(recipients);
                toast(`Comunicado enviado para ${recipients} pessoa(s)`, recipients > 0 ? "success" : "warning");
              }}
            >
              <Send className="mr-1 inline h-3.5 w-3.5" />
              Disparar para {recipientPreviewCount} pessoa(s)
            </button>

            <button
              className="button ghost"
              onClick={() => {
                setEditorText("");
                setAiResult("");
                setSelectedTemplateId("");
                toast("Editor limpo.", "info");
              }}
            >
              Limpar editor
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Ultimo disparo enviou para <strong>{lastRecipients}</strong> pessoa(s).
          </p>
        </div>

        <div className="panel p-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
              <FileText className="h-3.5 w-3.5 text-blue-500" />
            </span>
            <h3 className="text-base font-semibold text-slate-800">Segmentacao do disparo</h3>
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <label className="text-xs text-slate-500">
              Empresa
              <select
                className="select mt-1"
                value={segmentacao.companyId ?? ""}
                onChange={(event) =>
                  setSegmentacao((previous) => ({
                    ...previous,
                    companyId: event.target.value || undefined,
                    unitId: undefined,
                    teamId: undefined
                  }))
                }
              >
                <option value="">Todas</option>
                {state.companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-slate-500">
              Unidade
              <select
                className="select mt-1"
                value={segmentacao.unitId ?? ""}
                onChange={(event) =>
                  setSegmentacao((previous) => ({
                    ...previous,
                    unitId: event.target.value || undefined,
                    teamId: undefined
                  }))
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

            <label className="text-xs text-slate-500">
              Time
              <select
                className="select mt-1"
                value={segmentacao.teamId ?? ""}
                onChange={(event) =>
                  setSegmentacao((previous) => ({
                    ...previous,
                    teamId: event.target.value || undefined
                  }))
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

            <label className="text-xs text-slate-500">
              Cargo
              <select
                className="select mt-1"
                value={segmentacao.cargoId ?? ""}
                onChange={(event) =>
                  setSegmentacao((previous) => ({
                    ...previous,
                    cargoId: event.target.value || undefined
                  }))
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

            <label className="text-xs text-slate-500">
              Tipo
              <select
                className="select mt-1"
                value={segmentacao.tipo ?? ""}
                onChange={(event) =>
                  setSegmentacao((previous) => ({
                    ...previous,
                    tipo: (event.target.value || undefined) as "FIXO" | "FREELA" | undefined
                  }))
                }
              >
                <option value="">Todos</option>
                <option value="FIXO">Fixo</option>
                <option value="FREELA">Freela</option>
              </select>
            </label>

            <label className="text-xs text-slate-500">
              Status
              <select
                className="select mt-1"
                value={segmentacao.status ?? ""}
                onChange={(event) =>
                  setSegmentacao((previous) => ({
                    ...previous,
                    status: (
                      event.target.value || undefined
                    ) as
                      | "ATIVO"
                      | "FERIAS"
                      | "AFASTADO"
                      | "OFF_HOJE"
                      | undefined
                  }))
                }
              >
                <option value="">Todos</option>
                <option value="ATIVO">Ativo</option>
                <option value="FERIAS">Ferias</option>
                <option value="AFASTADO">Afastado</option>
                <option value="OFF_HOJE">Off hoje</option>
              </select>
            </label>
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
              <MessageCircle className="h-4 w-4" />
              Previa WhatsApp
            </p>
            <div className="mt-2 rounded-2xl bg-[#dcf8c6] p-3 text-sm text-slate-700 shadow">
              {(aiResult || editorText || "Mensagem vazia").split("\n").map((line, idx) => (
                <p key={`${line}-${idx}`}>{line}</p>
              ))}
            </div>
          </div>
        </div>

        <div className="panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
              </span>
              <h3 className="text-base font-semibold text-slate-800">Automacoes por evento</h3>
            </div>
            <button
              className="button secondary"
              onClick={() => {
                const result = runCommunicationAutomations();
                setLastAutomationResult(result);
                toast(`Automações executadas: ${result.campanhas} campanha(s), ${result.destinatarios} destinatário(s)`, result.campanhas > 0 ? "success" : "info");
              }}
            >
              Executar automacoes agora
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Ultima execucao: {lastAutomationResult.campanhas} campanha(s),{" "}
            {lastAutomationResult.destinatarios} destinatario(s)
          </p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {state.automationRules.map((rule) => {
              const eventLabel: Record<string, string> = {
                DOC_PENDENTE: "Documento pendente",
                PIX_AUSENTE: "Chave PIX ausente",
                ANIVERSARIO: "Aniversario do colaborador",
                FERIAS_PROXIMAS: "Ferias proximas",
                TREINAMENTO_VENCIDO: "Treinamento vencido"
              };
              return (
              <label
                key={rule.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <div>
                  <span className="font-medium">{eventLabel[rule.evento] ?? rule.evento}</span>
                  <span className="ml-2 text-[11px] text-slate-400">{rule.evento}</span>
                </div>
                <input
                  type="checkbox"
                  checked={rule.ativo}
                  onChange={(event) => toggleAutomationRule(rule.evento, event.target.checked)}
                />
              </label>
              );
            })}
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="panel p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Logs de disparos</h3>
            <span className="text-xs text-slate-500">{state.communicationLogs.length} registros</span>
          </div>
          <ul className="max-h-80 space-y-2 overflow-auto text-xs text-slate-600">
            {campaignsWithDetails.map(({ campaign, recipients }) => (
              <li key={campaign.id} className="rounded-lg border border-slate-200 bg-white p-2">
                <p className="font-semibold text-slate-700">
                  {campaign.gatilho || "Disparo manual"}
                  <span className="ml-2 text-[11px] font-normal text-slate-400">
                    {new Date(campaign.criadoEm).toLocaleString("pt-BR")}
                  </span>
                </p>
                <p>
                  Destinatarios: {recipients.length}
                </p>
                <p>
                  Status: {recipients.filter((log) => log.status === "ENVIADO").length} enviado(s),{" "}
                  {recipients.filter((log) => log.status === "ENTREGUE").length} entregue(s),{" "}
                  {recipients.filter((log) => log.status === "ERRO").length} erro(s)
                </p>
              </li>
            ))}
            {campaignsWithDetails.length === 0 && (
              <li className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 py-6 text-center">
                <History className="h-6 w-6 text-slate-300" />
                <p className="text-xs text-slate-400">Nenhum disparo registrado ainda.</p>
              </li>
            )}
          </ul>
        </div>

        <div className="panel p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Workflow className="h-4 w-4" />
              Conectores de tarefas (webhook)
            </h3>
            <button className="button ghost px-2 py-1 text-xs" onClick={() => { syncConnectorEvents(); toast("Eventos sincronizados.", "success"); }}>
              Sincronizar eventos
            </button>
          </div>

          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <label className="text-xs text-slate-500">
              Nome
              <input
                className="input mt-1"
                placeholder="Conector Jira, Notion, etc"
                value={webhookDraft.nome}
                onChange={(event) =>
                  setWebhookDraft((previous) => ({ ...previous, nome: event.target.value }))
                }
              />
            </label>

            <label className="text-xs text-slate-500">
              Endpoint
              <input
                className="input mt-1"
                placeholder="https://seu-app.com/webhook"
                value={webhookDraft.endpoint}
                onChange={(event) =>
                  setWebhookDraft((previous) => ({ ...previous, endpoint: event.target.value }))
                }
              />
            </label>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={webhookDraft.ativo}
                  onChange={(event) =>
                    setWebhookDraft((previous) => ({ ...previous, ativo: event.target.checked }))
                  }
                />
                Ativo
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={webhookDraft.aviso}
                  onChange={(event) =>
                    setWebhookDraft((previous) => ({ ...previous, aviso: event.target.checked }))
                  }
                />
                AVISO_DISPARADO
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={webhookDraft.recrutamento}
                  onChange={(event) =>
                    setWebhookDraft((previous) => ({ ...previous, recrutamento: event.target.checked }))
                  }
                />
                RECRUTAMENTO_ATRASADO
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={webhookDraft.treinamento}
                  onChange={(event) =>
                    setWebhookDraft((previous) => ({ ...previous, treinamento: event.target.checked }))
                  }
                />
                TREINAMENTO_VENCIDO
              </label>
            </div>

            <button
              className="button secondary"
              onClick={() => {
                const events = [
                  webhookDraft.aviso ? "AVISO_DISPARADO" : null,
                  webhookDraft.recrutamento ? "RECRUTAMENTO_ATRASADO" : null,
                  webhookDraft.treinamento ? "TREINAMENTO_VENCIDO" : null
                ].filter(Boolean) as Array<
                  "AVISO_DISPARADO" | "RECRUTAMENTO_ATRASADO" | "TREINAMENTO_VENCIDO"
                >;
                if (!webhookDraft.nome.trim()) {
                  toast("Informe um nome para o conector.", "error");
                  return;
                }
                if (!webhookDraft.endpoint.trim()) {
                  toast("Informe o endpoint do webhook.", "error");
                  return;
                }
                upsertWebhook({
                  nome: webhookDraft.nome,
                  endpoint: webhookDraft.endpoint,
                  ativo: webhookDraft.ativo,
                  eventos: events
                });
                setWebhookDraft({
                  nome: "",
                  endpoint: "",
                  ativo: false,
                  aviso: true,
                  recrutamento: true,
                  treinamento: false
                });
                toast("Conector salvo com sucesso.", "success");
              }}
            >
              Salvar conector
            </button>
          </div>

          <ul className="mt-2 max-h-40 space-y-2 overflow-auto text-xs text-slate-600">
            {state.connectorWebhooks.map((webhook) => (
              <li key={webhook.id} className="rounded-lg border border-slate-200 bg-white p-2">
                <p className="font-semibold text-slate-700">{webhook.nome}</p>
                <p>{webhook.endpoint}</p>
                <p>
                  {webhook.ativo ? "Ativo" : "Inativo"} · eventos: {webhook.eventos.join(", ")}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel p-4">
          <h3 className="text-sm font-semibold text-slate-800">Registro de eventos do webhook</h3>
          <ul className="mt-2 max-h-56 space-y-2 overflow-auto text-xs text-slate-600">
            {[...state.connectorEvents]
              .reverse()
              .slice(0, 25)
              .map((event) => (
                <li key={event.id} className="rounded-lg border border-slate-200 bg-white p-2">
                  <p className="font-semibold text-slate-700">{event.evento}</p>
                  <p>{event.payloadResumo}</p>
                  <p>{new Date(event.criadoEm).toLocaleString("pt-BR")}</p>
                </li>
              ))}
            {state.connectorEvents.length === 0 && (
              <li className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 py-6 text-center">
                <Zap className="h-6 w-6 text-slate-300" />
                <p className="text-xs text-slate-400">Nenhum evento sincronizado.</p>
              </li>
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}
