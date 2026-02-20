"use client";

import { useMemo, useState } from "react";
import { Bot, FileText, History, MessageCircle, Send, Sparkles, Workflow, Zap, CheckCheck, Smartphone, Filter, ChevronDown, ChevronUp } from "lucide-react";

import { useToast } from "@/components/toast";
import { useAppState } from "@/components/state-provider";
import { cn } from "@/lib/utils";

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

/* ─── AI Transform (local mock) ──────────────────────────── */
function aiTransform(action: string, text: string): string {
  const t = text.trim();
  if (!t) return "";
  switch (action) {
    case "shorten": {
      const w = t.split(/\s+/);
      const s = w.slice(0, Math.max(8, Math.floor(w.length * 0.6))).join(" ");
      return s.endsWith(".") ? s : `${s}.`;
    }
    case "firm":
      return `ATENÇÃO: ${t} Esta orientação requer confirmação imediata.`;
    case "friendly":
      return `Oi, time! 😊 ${t} Qualquer dúvida, estamos por aqui para apoiar.`;
    case "bullets": {
      const chunks = t.split(/[.!?]\s+/).map(i => i.trim()).filter(Boolean);
      return chunks.map(i => `• ${i}`).join("\n");
    }
    case "versions":
      return [
        `Versão 1 (direta): ${t}`,
        `Versão 2 (acolhedora): Oi pessoal, ${t.toLowerCase()}`,
        `Versão 3 (objetiva): Ação imediata → ${t}`,
      ].join("\n\n");
    default:
      return t;
  }
}

export default function ComunicadosPage() {
  const {
    state, sendCommunication, runCommunicationAutomations,
    upsertTemplate, toggleAutomationRule, upsertWebhook, syncConnectorEvents, filters,
  } = useAppState();

  const { toast } = useToast();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateNameDraft, setTemplateNameDraft] = useState<string>("");
  const [editorText, setEditorText] = useState<string>("");
  const [lastRecipients, setLastRecipients] = useState<number>(0);
  const [lastAutomationResult, setLastAutomationResult] = useState<{ campanhas: number; destinatarios: number }>({ campanhas: 0, destinatarios: 0 });

  // Collapsible sections
  const [showAutomations, setShowAutomations] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showWebhooks, setShowWebhooks] = useState(false);

  const [webhookDraft, setWebhookDraft] = useState({
    nome: "", endpoint: "", ativo: false,
    aviso: true, recrutamento: true, treinamento: false,
  });

  const [segmentacao, setSegmentacao] = useState<{
    companyId?: string; unitId?: string; teamId?: string;
    cargoId?: string; tipo?: "FIXO" | "FREELA"; status?: "ATIVO" | "FERIAS" | "AFASTADO" | "OFF_HOJE";
  }>({
    companyId: filters.companyId, unitId: filters.unitId,
    teamId: filters.teamId, cargoId: filters.cargoId,
  });

  /* ─── Memos ──────────────────────────────────────────── */

  const templates = useMemo(() => {
    return state.communicationTemplates.filter((t) => {
      if (segmentacao.companyId && t.companyId && t.companyId !== segmentacao.companyId) return false;
      if (segmentacao.unitId && t.unitId && t.unitId !== segmentacao.unitId) return false;
      return true;
    });
  }, [state.communicationTemplates, segmentacao.companyId, segmentacao.unitId]);

  const campaignsWithDetails = useMemo(() => {
    return [...state.communicationCampaigns].reverse().map((c) => ({
      campaign: c,
      recipients: state.communicationLogs.filter((l) => l.campaignId === c.id),
    }));
  }, [state.communicationCampaigns, state.communicationLogs]);

  const unitOptions = state.units.filter((u) => !segmentacao.companyId || u.companyId === segmentacao.companyId);
  const teamOptions = state.teams.filter((t) => {
    const u = state.units.find((x) => x.id === t.unitId);
    if (!u) return false;
    if (segmentacao.companyId && u.companyId !== segmentacao.companyId) return false;
    if (segmentacao.unitId && t.unitId !== segmentacao.unitId) return false;
    return true;
  });

  const selectedTemplate = selectedTemplateId
    ? state.communicationTemplates.find((t) => t.id === selectedTemplateId)
    : undefined;

  const recipientPreviewCount = useMemo(() => {
    return state.people.filter((p) => {
      if (segmentacao.companyId && p.companyId !== segmentacao.companyId) return false;
      if (segmentacao.unitId && p.unitId !== segmentacao.unitId) return false;
      if (segmentacao.teamId && p.teamId !== segmentacao.teamId) return false;
      if (segmentacao.cargoId && p.cargoId !== segmentacao.cargoId) return false;
      if (segmentacao.tipo && p.type !== segmentacao.tipo) return false;
      if (segmentacao.status && p.status !== segmentacao.status) return false;
      return true;
    }).length;
  }, [state.people, segmentacao]);

  /* ─── Helpers ────────────────────────────────────────── */

  function mkSel(label: string, value: string | undefined, onVal: (v: string) => void, allLabel: string, options: { id: string; nome: string }[], allValue = "ALL") {
    return (
      <Select value={value ?? ""} onValueChange={(v) => onVal(v === allValue ? "" : v)}>
        <SelectTrigger className="h-7 text-[10px] bg-muted/40 border-border/50 font-semibold">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={allValue} className="text-[10px] font-bold">{allLabel}</SelectItem>
          {options.map((o) => <SelectItem key={o.id} value={o.id} className="text-[10px]">{o.nome}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }

  /* ─── Render ─────────────────────────────────────────── */

  return (
    <div className="page-enter space-y-4">
      {/* ── MAIN: Phone + Editor side-by-side ───────────── */}
      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
        {/* ── LEFT: WhatsApp Phone Preview (sticky) ──── */}
        <div className="xl:sticky xl:top-4 xl:self-start">
          <div className="flex flex-col items-center">
            {/* Recipient badge */}
            <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground bg-background rounded-full px-3 py-1 shadow-sm border">
              <Smartphone className="h-3 w-3" />
              Prévia · {recipientPreviewCount} destinatário{recipientPreviewCount !== 1 ? "s" : ""}
            </div>

            {/* Phone frame */}
            <div className="w-full max-w-[310px] h-[540px] bg-[#efeae2] rounded-[32px] border-[8px] border-slate-900 shadow-2xl relative overflow-hidden flex flex-col font-sans">
              {/* Notch */}
              <div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 w-14 h-3.5 bg-slate-900 rounded-full z-20" />

              {/* WhatsApp header */}
              <div className="bg-[#075e54] text-white px-3.5 pt-7 pb-2.5 shadow-md z-10 flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center relative shadow-sm shrink-0">
                  <Bot className="h-4 w-4 text-[#075e54]" />
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-400 border-2 border-[#075e54] rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[14px] leading-tight text-white truncate">B People</h4>
                  <p className="text-[10px] text-white/80 font-medium">Business Account</p>
                </div>
              </div>

              {/* Chat area */}
              <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2.5 relative bg-[#efeae2]">
                <div className="bg-[#dcf8c6]/80 text-[#54656f] text-[9px] px-2.5 py-0.5 rounded-lg uppercase tracking-wider self-center font-semibold z-10 w-fit">
                  Hoje
                </div>

                <div className="bg-white p-2.5 rounded-lg rounded-tl-none shadow-[0_1px_1px_rgba(0,0,0,0.08)] relative w-[90%] self-start z-10">
                  <div className="absolute top-0 -left-2 w-2 h-3 bg-white" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
                  <div className="text-[13px] text-[#111b21] leading-snug whitespace-pre-wrap">
                    {(editorText || "Sua mensagem aparecerá aqui.\n\nDigite o texto ao lado e veja a prévia em tempo real. Use os botões de IA para ajustar o tom.").split("\n").map((line, i) => (
                      <span key={i}>{line}<br /></span>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1 opacity-50">
                    <span className="text-[9px] text-[#667781] font-medium">10:42</span>
                    <CheckCheck className="h-3 w-3 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Send CTA inside phone */}
              <div className="bg-[#f0f2f5] p-2 z-10">
                <Button
                  className="w-full h-9 rounded-xl text-xs shadow-md font-bold bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center gap-1.5"
                  onClick={() => {
                    const r = sendCommunication({
                      templateId: selectedTemplateId || undefined,
                      conteudoFinal: editorText,
                      segmentacao,
                      gatilho: undefined,
                    });
                    setLastRecipients(r);
                    toast(`Enviado para ${r} pessoa(s)`, r > 0 ? "success" : "warning");
                  }}
                >
                  <Send className="h-3.5 w-3.5" />
                  Disparar para {recipientPreviewCount}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Editor + Segmentation + AI (compact) ── */}
        <div className="space-y-3">
          {/* Template + Name */}
          <div className="panel p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="h-4 w-4 text-teal-500" />
              <h2 className="text-sm font-bold text-foreground">Editor de Comunicado</h2>
              <Badge variant="ok" className="text-[9px] ml-auto">WhatsApp + IA</Badge>
            </div>

            {/* Row 1: Template + Name */}
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Template</label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={(v) => {
                    setSelectedTemplateId(v);
                    const t = state.communicationTemplates.find((x) => x.id === v);
                    if (t) setEditorText(t.conteudo);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Sem template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NO_TEMPLATE" className="text-xs">Sem template</SelectItem>
                    {templates.map((t) => <SelectItem key={t.id} value={t.id} className="text-xs">{t.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Nome (salvar como)</label>
                <Input className="h-8 text-xs" value={templateNameDraft} onChange={(e) => setTemplateNameDraft(e.target.value)} placeholder="Ex.: Pendência onboarding" />
              </div>
            </div>

            {/* Row 2: Textarea + AI buttons side-by-side */}
            <div className="grid gap-3 md:grid-cols-[1fr,auto]">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Conteúdo da mensagem</label>
                <Textarea
                  className="h-36 text-xs resize-none"
                  value={editorText}
                  onChange={(e) => setEditorText(e.target.value)}
                  placeholder="Digite sua mensagem aqui…"
                />
              </div>
              <div className="flex flex-col gap-1.5 md:w-32">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Bot className="h-3 w-3" /> Apoio IA
                </span>
                <button className="text-[10px] font-semibold px-2 py-1.5 rounded-lg border border-border bg-background hover:bg-muted/50 text-foreground/80 transition-colors text-left" onClick={() => setEditorText(aiTransform("shorten", editorText))}>✂️ Encurtar</button>
                <button className="text-[10px] font-semibold px-2 py-1.5 rounded-lg border border-border bg-background hover:bg-muted/50 text-foreground/80 transition-colors text-left" onClick={() => setEditorText(aiTransform("firm", editorText))}>💪 Mais firme</button>
                <button className="text-[10px] font-semibold px-2 py-1.5 rounded-lg border border-border bg-background hover:bg-muted/50 text-foreground/80 transition-colors text-left" onClick={() => setEditorText(aiTransform("friendly", editorText))}>😊 Amigável</button>
                <button className="text-[10px] font-semibold px-2 py-1.5 rounded-lg border border-border bg-background hover:bg-muted/50 text-foreground/80 transition-colors text-left" onClick={() => setEditorText(aiTransform("bullets", editorText))}>📋 Bullets</button>
                <button className="text-[10px] font-bold px-2 py-1.5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 hover:bg-amber-100 text-amber-700 dark:text-amber-400 transition-colors text-left flex items-center gap-1" onClick={() => setEditorText(aiTransform("versions", editorText))}>
                  <Sparkles className="h-3 w-3" /> 3 versões
                </button>
              </div>
            </div>

            {/* Row 3: Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  if (!templateNameDraft.trim()) { toast("Informe um nome.", "error"); return; }
                  if (!editorText.trim()) { toast("Conteúdo vazio.", "error"); return; }
                  upsertTemplate({
                    id: selectedTemplate?.id,
                    nome: templateNameDraft,
                    conteudo: editorText,
                    companyId: segmentacao.companyId,
                    unitId: segmentacao.unitId,
                    teamId: segmentacao.teamId,
                  });
                  setTemplateNameDraft("");
                  toast("Template salvo!", "success");
                }}
              >
                Salvar Template
              </Button>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground ml-auto" onClick={() => { setEditorText(""); setSelectedTemplateId(""); toast("Editor limpo.", "info"); }}>
                Limpar
              </Button>
            </div>
          </div>

          {/* Segmentation row — compact */}
          <div className="panel p-3">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Público-alvo</span>
              <Badge variant="secondary" className="ml-auto text-[9px]">{recipientPreviewCount} pessoa{recipientPreviewCount !== 1 ? "s" : ""}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-1.5">
              {mkSel("Empresa", segmentacao.companyId, (v) => setSegmentacao(p => ({ ...p, companyId: v || undefined, unitId: undefined, teamId: undefined })), "Todas", state.companies)}
              {mkSel("Unidade", segmentacao.unitId, (v) => setSegmentacao(p => ({ ...p, unitId: v || undefined, teamId: undefined })), "Todas", unitOptions)}
              {mkSel("Time", segmentacao.teamId, (v) => setSegmentacao(p => ({ ...p, teamId: v || undefined })), "Todos", teamOptions)}
              {mkSel("Cargo", segmentacao.cargoId, (v) => setSegmentacao(p => ({ ...p, cargoId: v || undefined })), "Todos", state.roles)}
              {mkSel("Contrato", segmentacao.tipo, (v) => setSegmentacao(p => ({ ...p, tipo: (v || undefined) as any })), "Todos", [{ id: "FIXO", nome: "Fixo" }, { id: "FREELA", nome: "Freela" }])}
              {mkSel("Status", segmentacao.status, (v) => setSegmentacao(p => ({ ...p, status: (v || undefined) as any })), "Todos", [{ id: "ATIVO", nome: "Ativo" }, { id: "FERIAS", nome: "Férias" }, { id: "AFASTADO", nome: "Afastado" }, { id: "OFF_HOJE", nome: "Off hoje" }], "ALL_STATUS")}
            </div>
          </div>

          {/* ── COLLAPSIBLE: Automations ──────────────── */}
          <div className="panel overflow-hidden">
            <button
              onClick={() => setShowAutomations(p => !p)}
              className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
            >
              <span className="flex items-center gap-2 text-xs font-bold text-foreground/80">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Automações por Evento
                <Badge variant="secondary" className="text-[8px] ml-1">{state.automationRules.filter(r => r.ativo).length}/{state.automationRules.length} ativas</Badge>
              </span>
              {showAutomations ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
            {showAutomations && (
              <div className="p-3 pt-0 space-y-2">
                <div className="grid gap-1.5 md:grid-cols-2">
                  {state.automationRules.map((rule) => {
                    const labels: Record<string, string> = {
                      DOC_PENDENTE: "Doc. pendente", PIX_AUSENTE: "PIX ausente",
                      ANIVERSARIO: "Aniversário", FERIAS_PROXIMAS: "Férias próximas",
                      TREINAMENTO_VENCIDO: "Trein. vencido",
                    };
                    return (
                      <label key={rule.id} className={cn("flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs cursor-pointer transition-colors", rule.ativo ? "border-primary/40 bg-primary/5" : "border-border hover:bg-muted/40")}>
                        <span className={cn("font-medium", rule.ativo ? "text-primary" : "text-foreground/80")}>{labels[rule.evento] ?? rule.evento}</span>
                        <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5" checked={rule.ativo} onChange={(e) => toggleAutomationRule(rule.evento, e.target.checked)} />
                      </label>
                    );
                  })}
                </div>
                <Button
                  variant="secondary" size="sm" className="w-full text-xs mt-1"
                  onClick={() => {
                    const r = runCommunicationAutomations();
                    setLastAutomationResult(r);
                    toast(`${r.campanhas} campanha(s) gerada(s) para ${r.destinatarios} pessoa(s)`, r.campanhas > 0 ? "success" : "info");
                  }}
                >
                  Executar automações agora
                </Button>
              </div>
            )}
          </div>

          {/* ── COLLAPSIBLE: Logs ──────────────────────── */}
          <div className="panel overflow-hidden">
            <button
              onClick={() => setShowLogs(p => !p)}
              className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
            >
              <span className="flex items-center gap-2 text-xs font-bold text-foreground/80">
                <History className="h-3.5 w-3.5 text-slate-500" />
                Histórico de Disparos
                <Badge variant="secondary" className="text-[8px] ml-1">{state.communicationLogs.length}</Badge>
              </span>
              {showLogs ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
            {showLogs && (
              <div className="p-3 pt-0">
                <ul className="max-h-56 space-y-1.5 overflow-auto">
                  {campaignsWithDetails.map(({ campaign, recipients }) => (
                    <li key={campaign.id} className="rounded-lg border border-border bg-background p-2 text-[10px]">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-foreground/80">{campaign.gatilho || "Manual"}</span>
                        <span className="text-muted-foreground font-mono">{new Date(campaign.criadoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">
                        {recipients.length} dest. · {recipients.filter(l => l.status === "ENVIADO").length} env. · {recipients.filter(l => l.status === "ENTREGUE").length} ent. · {recipients.filter(l => l.status === "ERRO").length} erro
                      </p>
                    </li>
                  ))}
                  {campaignsWithDetails.length === 0 && (
                    <li className="text-center py-6 text-xs text-muted-foreground">Nenhum disparo registrado.</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* ── COLLAPSIBLE: Webhooks ─────────────────── */}
          <div className="panel overflow-hidden">
            <button
              onClick={() => setShowWebhooks(p => !p)}
              className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
            >
              <span className="flex items-center gap-2 text-xs font-bold text-foreground/80">
                <Workflow className="h-3.5 w-3.5 text-purple-500" />
                Conectores (Webhook)
                <Badge variant="secondary" className="text-[8px] ml-1">{state.connectorWebhooks.length}</Badge>
              </span>
              {showWebhooks ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
            {showWebhooks && (
              <div className="p-3 pt-0 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">Nome</label>
                    <Input className="h-7 text-[10px]" placeholder="Jira, Notion…" value={webhookDraft.nome} onChange={(e) => setWebhookDraft(p => ({ ...p, nome: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">Endpoint</label>
                    <Input className="h-7 text-[10px]" placeholder="https://…" value={webhookDraft.endpoint} onChange={(e) => setWebhookDraft(p => ({ ...p, endpoint: e.target.value }))} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                  {[
                    { key: "ativo", label: "Ativo" },
                    { key: "aviso", label: "AVISO" },
                    { key: "recrutamento", label: "RECRUTAMENTO" },
                    { key: "treinamento", label: "TREINAMENTO" },
                  ].map(({ key, label }) => (
                    <label key={key} className="inline-flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary h-3 w-3"
                        checked={(webhookDraft as any)[key]}
                        onChange={(e) => setWebhookDraft(p => ({ ...p, [key]: e.target.checked }))}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <Button variant="secondary" size="sm" className="w-full text-xs" onClick={() => {
                  const events = [
                    webhookDraft.aviso ? "AVISO_DISPARADO" : null,
                    webhookDraft.recrutamento ? "RECRUTAMENTO_ATRASADO" : null,
                    webhookDraft.treinamento ? "TREINAMENTO_VENCIDO" : null,
                  ].filter(Boolean) as Array<"AVISO_DISPARADO" | "RECRUTAMENTO_ATRASADO" | "TREINAMENTO_VENCIDO">;
                  if (!webhookDraft.nome.trim()) { toast("Informe um nome.", "error"); return; }
                  if (!webhookDraft.endpoint.trim()) { toast("Informe o endpoint.", "error"); return; }
                  upsertWebhook({ nome: webhookDraft.nome, endpoint: webhookDraft.endpoint, ativo: webhookDraft.ativo, eventos: events });
                  setWebhookDraft({ nome: "", endpoint: "", ativo: false, aviso: true, recrutamento: true, treinamento: false });
                  toast("Conector salvo!", "success");
                }}>
                  Salvar conector
                </Button>

                {state.connectorWebhooks.length > 0 && (
                  <ul className="space-y-1 mt-1 max-h-24 overflow-auto">
                    {state.connectorWebhooks.map((w) => (
                      <li key={w.id} className="rounded border border-border bg-background p-1.5 text-[10px] flex justify-between items-center">
                        <span className="font-semibold text-foreground/80">{w.nome}</span>
                        <span className="text-muted-foreground">{w.ativo ? "Ativo" : "Inativo"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
