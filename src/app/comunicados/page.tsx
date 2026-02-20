"use client";

import { useMemo, useState } from "react";
import { Bot, FileText, History, MessageCircle, Send, Sparkles, Workflow, Zap, CheckCheck, Smartphone, Filter } from "lucide-react";

import { useToast } from "@/components/toast";
import { useAppState } from "@/components/state-provider";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

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
        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-900/20">
                  <MessageCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </span>
                <CardTitle className="text-lg font-semibold text-foreground">Editor de comunicados</CardTitle>
              </div>
              <Badge variant="ok">WhatsApp + IA</Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-2 space-y-4">
            <div className="grid gap-2 md:grid-cols-2">
              <label className="text-xs text-muted-foreground">
                Selecionar template
                <Select
                  value={selectedTemplateId}
                  onValueChange={(value) => {
                    setSelectedTemplateId(value);
                    const template = state.communicationTemplates.find((item) => item.id === value);
                    if (template) {
                      setEditorText(template.conteudo);
                      setAiResult(template.conteudo);
                    }
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sem template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NO_TEMPLATE">Sem template</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="text-xs text-muted-foreground">
                Nome do template
                <Input
                  className="mt-1"
                  value={templateNameDraft}
                  onChange={(event) => setTemplateNameDraft(event.target.value)}
                  placeholder="Ex.: Pendencia onboarding"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs text-muted-foreground">
                Conteudo base
                <Textarea
                  className="mt-1 h-32"
                  value={editorText}
                  onChange={(event) => {
                    setEditorText(event.target.value);
                    if (!aiResult) {
                      setAiResult(event.target.value);
                    }
                  }}
                />
              </label>

              <div className="rounded-xl border border-border bg-muted/50 p-3">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Bot className="h-4 w-4" />
                  Apoio IA
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => setAiResult(aiTransform("shorten", editorText))}>
                    Encurtar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setAiResult(aiTransform("firm", editorText))}>
                    Mais firme
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setAiResult(aiTransform("friendly", editorText))}>
                    Mais amigavel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setAiResult(aiTransform("bullets", editorText))}>
                    Em bullets
                  </Button>
                  <Button variant="secondary" size="sm" className="col-span-2" onClick={() => setAiResult(aiTransform("versions", editorText))}>
                    <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                    Gerar 3 versoes
                  </Button>
                </div>

                <label className="mt-2 block text-xs text-muted-foreground">
                  Resultado final
                  <Textarea
                    className="mt-1 h-32"
                    value={aiResult}
                    onChange={(event) => setAiResult(event.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              <Button
                variant="outline"
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
              </Button>

              <Button
                variant="primary"
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
                Disparar para {recipientPreviewCount}
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  setEditorText("");
                  setAiResult("");
                  setSelectedTemplateId("");
                  toast("Editor limpo.", "info");
                }}
              >
                Limpar editor
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Ultimo disparo enviou para <strong>{lastRecipients}</strong> pessoa(s).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <FileText className="h-3.5 w-3.5 text-blue-500" />
              </span>
              <CardTitle className="text-base font-semibold text-foreground">Segmentacao do disparo</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-muted/40 rounded-xl border border-border/60">
              <div className="flex items-center px-3 text-muted-foreground/70 hidden sm:flex">
                <Filter className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-[130px] border-r border-border/40 pr-1.5">
                <Select
                  value={segmentacao.companyId ?? ""}
                  onValueChange={(val) =>
                    setSegmentacao((previous) => ({
                      ...previous,
                      companyId: val === "ALL" ? undefined : val,
                      unitId: undefined,
                      teamId: undefined
                    }))
                  }
                >
                  <SelectTrigger className="mt-0 border-0 bg-transparent shadow-none focus:ring-0 text-xs font-semibold h-9 hover:bg-muted/50 transition-colors">
                    <SelectValue placeholder="Empresas (Todas)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="font-bold">Todas as Empresas</SelectItem>
                    {state.companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[130px] border-r border-border/40 pr-1.5 px-1.5">
                <Select
                  value={segmentacao.unitId ?? ""}
                  onValueChange={(val) =>
                    setSegmentacao((previous) => ({
                      ...previous,
                      unitId: val === "ALL" ? undefined : val,
                      teamId: undefined
                    }))
                  }
                >
                  <SelectTrigger className="mt-0 border-0 bg-transparent shadow-none focus:ring-0 text-xs font-semibold h-9 hover:bg-muted/50 transition-colors">
                    <SelectValue placeholder="Unidades (Todas)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="font-bold">Todas as Unidades</SelectItem>
                    {unitOptions.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[130px] border-r border-border/40 pr-1.5 px-1.5">
                <Select
                  value={segmentacao.teamId ?? ""}
                  onValueChange={(val) =>
                    setSegmentacao((previous) => ({
                      ...previous,
                      teamId: val === "ALL" ? undefined : val
                    }))
                  }
                >
                  <SelectTrigger className="mt-0 border-0 bg-transparent shadow-none focus:ring-0 text-xs font-semibold h-9 hover:bg-muted/50 transition-colors">
                    <SelectValue placeholder="Times (Todos)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="font-bold">Todos os Times</SelectItem>
                    {teamOptions.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[130px] border-r border-border/40 pr-1.5 px-1.5">
                <Select
                  value={segmentacao.cargoId ?? ""}
                  onValueChange={(val) =>
                    setSegmentacao((previous) => ({
                      ...previous,
                      cargoId: val === "ALL" ? undefined : val
                    }))
                  }
                >
                  <SelectTrigger className="mt-0 border-0 bg-transparent shadow-none focus:ring-0 text-xs font-semibold h-9 hover:bg-muted/50 transition-colors">
                    <SelectValue placeholder="Cargos (Todos)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="font-bold">Todos os Cargos</SelectItem>
                    {state.roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[130px] border-r border-border/40 pr-1.5 px-1.5">
                <Select
                  value={segmentacao.tipo ?? ""}
                  onValueChange={(val) =>
                    setSegmentacao((previous) => ({
                      ...previous,
                      tipo: (val === "ALL" ? undefined : val) as "FIXO" | "FREELA" | undefined
                    }))
                  }
                >
                  <SelectTrigger className="mt-0 border-0 bg-transparent shadow-none focus:ring-0 text-xs font-semibold h-9 hover:bg-muted/50 transition-colors">
                    <SelectValue placeholder="Contratos (Todos)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="font-bold">Todos os Contratos</SelectItem>
                    <SelectItem value="FIXO">Fixo</SelectItem>
                    <SelectItem value="FREELA">Freela</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[130px] px-1.5">
                <Select
                  value={segmentacao.status ?? ""}
                  onValueChange={(val) =>
                    setSegmentacao((previous) => ({
                      ...previous,
                      status: (val || undefined) as
                        | "ATIVO"
                        | "FERIAS"
                        | "AFASTADO"
                        | "OFF_HOJE"
                        | undefined
                    }))
                  }
                >
                  <SelectTrigger className="mt-0 border-0 bg-transparent shadow-none focus:ring-0 text-xs font-semibold h-9 hover:bg-muted/50 transition-colors">
                    <SelectValue placeholder="Status (Todos)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_STATUS" className="font-bold">Todos os Status</SelectItem>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="FERIAS">Ferias</SelectItem>
                    <SelectItem value="AFASTADO">Afastado</SelectItem>
                    <SelectItem value="OFF_HOJE">Off hoje</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/90">
                  <Smartphone className="h-4 w-4" />
                  Prévia no Dispositivo
                </p>
              </div>

              <div className="flex justify-center bg-muted/10 rounded-2xl p-6 border border-border bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')] overflow-hidden">
                <div className="w-[300px] h-[550px] bg-[#efeae2] rounded-[36px] border-[8px] border-slate-900 shadow-2xl relative overflow-hidden flex flex-col font-sans">
                  {/* Camera hole */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-slate-900 rounded-full z-20"></div>

                  {/* WhatsApp Header */}
                  <div className="bg-[#075e54] text-white px-4 pt-8 pb-3 shadow-md z-10">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center relative">
                        <Bot className="h-5 w-5 text-[#075e54]" />
                        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-[#075e54] rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm leading-tight">RH Manager</h4>
                        <p className="text-[10px] text-white/80">Online</p>
                      </div>
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 relative" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: 'cover', opacity: 0.9 }}>
                    <div className="bg-[#e1f3fb] text-[#54656f] text-[10px] px-3 py-1 rounded-lg uppercase tracking-wider self-center mb-2 shadow-sm font-semibold z-10 w-fit">
                      Hoje
                    </div>

                    <div className="bg-white p-2.5 rounded-lg rounded-tl-none shadow-sm relative w-[85%] self-start group z-10">
                      {/* Fake bubble tail */}
                      <div className="absolute top-0 -left-2 w-2 h-3 bg-white" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}></div>
                      <div className="text-[14px] text-[#111b21] leading-snug whitespace-pre-wrap">
                        {(aiResult || editorText || "A mensagem do template aparecerá aqui para visualização...").split("\n").map((line, idx) => (
                          <span key={`${line}-${idx}`}>
                            {line}
                            <br />
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
                        <span className="text-[10px] text-[#667781] font-medium">Agora</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                </span>
                <CardTitle className="text-base font-semibold text-foreground">Automacoes por evento</CardTitle>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const result = runCommunicationAutomations();
                  setLastAutomationResult(result);
                  toast(`Automações executadas: ${result.campanhas} campanha(s), ${result.destinatarios} destinatário(s)`, result.campanhas > 0 ? "success" : "info");
                }}
              >
                Executar automacoes agora
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="mt-1 text-xs text-muted-foreground mb-2">
              Ultima execucao: {lastAutomationResult.campanhas} campanha(s),{" "}
              {lastAutomationResult.destinatarios} destinatario(s)
            </p>
            <div className="grid gap-2 md:grid-cols-2">
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
                    className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground/90 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <span className="font-medium">{eventLabel[rule.evento] ?? rule.evento}</span>
                      <span className="ml-2 text-[11px] text-muted-foreground/70">{rule.evento}</span>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                      checked={rule.ativo}
                      onChange={(event) => toggleAutomationRule(rule.evento, event.target.checked)}
                    />
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      <aside className="space-y-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">Logs de disparos</CardTitle>
              <span className="text-xs text-muted-foreground">{state.communicationLogs.length} registros</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ul className="max-h-80 space-y-2 overflow-auto text-xs text-muted-foreground/90">
              {campaignsWithDetails.map(({ campaign, recipients }) => (
                <li key={campaign.id} className="rounded-lg border border-border bg-background p-2">
                  <p className="font-semibold text-foreground/90">
                    {campaign.gatilho || "Disparo manual"}
                    <span className="ml-2 text-[11px] font-normal text-muted-foreground/70">
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
                <li className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-6 text-center">
                  <History className="h-6 w-6 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground/70">Nenhum disparo registrado ainda.</p>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <Workflow className="h-4 w-4" />
                Conectores de tarefas (webhook)
              </CardTitle>
              <Button variant="ghost" size="sm" className="px-2 py-1 text-xs" onClick={() => { syncConnectorEvents(); toast("Eventos sincronizados.", "success"); }}>
                Sincronizar eventos
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-0">
            <div className="space-y-2 rounded-xl border border-border bg-muted/50 p-3">
              <label className="text-xs text-muted-foreground">
                Nome
                <Input
                  className="mt-1"
                  placeholder="Conector Jira, Notion, etc"
                  value={webhookDraft.nome}
                  onChange={(event) =>
                    setWebhookDraft((previous) => ({ ...previous, nome: event.target.value }))
                  }
                />
              </label>

              <label className="text-xs text-muted-foreground">
                Endpoint
                <Input
                  className="mt-1"
                  placeholder="https://seu-app.com/webhook"
                  value={webhookDraft.endpoint}
                  onChange={(event) =>
                    setWebhookDraft((previous) => ({ ...previous, endpoint: event.target.value }))
                  }
                />
              </label>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground/90">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-primary focus:ring-primary"
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
                    className="rounded border-slate-300 text-primary focus:ring-primary"
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
                    className="rounded border-slate-300 text-primary focus:ring-primary"
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
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                    checked={webhookDraft.treinamento}
                    onChange={(event) =>
                      setWebhookDraft((previous) => ({ ...previous, treinamento: event.target.checked }))
                    }
                  />
                  TREINAMENTO_VENCIDO
                </label>
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="w-full"
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
              </Button>
            </div>

            <ul className="mt-2 max-h-40 space-y-2 overflow-auto text-xs text-muted-foreground/90">
              {state.connectorWebhooks.map((webhook) => (
                <li key={webhook.id} className="rounded-lg border border-border bg-background p-2">
                  <p className="font-semibold text-foreground/90">{webhook.nome}</p>
                  <p>{webhook.endpoint}</p>
                  <p>
                    {webhook.ativo ? "Ativo" : "Inativo"} · eventos: {webhook.eventos.join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Registro de eventos do webhook</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ul className="mt-2 max-h-56 space-y-2 overflow-auto text-xs text-muted-foreground/90">
              {[...state.connectorEvents]
                .reverse()
                .slice(0, 25)
                .map((event) => (
                  <li key={event.id} className="rounded-lg border border-border bg-background p-2">
                    <p className="font-semibold text-foreground/90">{event.evento}</p>
                    <p>{event.payloadResumo}</p>
                    <p>{new Date(event.criadoEm).toLocaleString("pt-BR")}</p>
                  </li>
                ))}
              {state.connectorEvents.length === 0 && (
                <li className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-6 text-center">
                  <Zap className="h-6 w-6 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground/70">Nenhum evento sincronizado.</p>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
