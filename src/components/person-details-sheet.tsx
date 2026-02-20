import { useAppState } from "@/components/state-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { asHours, money } from "@/lib/format";
import { personHistory } from "@/lib/selectors";
import { Person } from "@/lib/types";
import {
    ArrowLeft,
    Briefcase,
    Calendar,
    Clock3,
    CreditCard,
    Info,
    Mail,
    MapPin,
    Phone,
    Trash2,
    User,
    UserCircle
} from "lucide-react";
import { useEffect, useState } from "react";

const STATUS_LABEL: Record<Person["status"], string> = {
    ATIVO: "Ativo",
    FERIAS: "Ferias",
    AFASTADO: "Afastado",
    OFF_HOJE: "Off hoje"
};

const TYPE_LABEL: Record<Person["type"], string> = {
    FIXO: "Fixo",
    FREELA: "Freela"
};

export function PersonDetailsSheet() {
    const {
        state,
        selectedPersonId,
        setSelectedPersonId,
        updatePersonData,
        checkPermission,
        paymentContext,
        upsertHours
    } = useAppState();

    const [localIntervalo, setLocalIntervalo] = useState("");
    const [hoursDraft, setHoursDraft] = useState<string>("");
    const [reasonDraft, setReasonDraft] = useState("");

    const selectedPerson = selectedPersonId
        ? state.people.find((person) => person.id === selectedPersonId)
        : undefined;

    useEffect(() => {
        if (selectedPerson) {
            setLocalIntervalo(selectedPerson.intervalo || "");

            // Reset drafts
            const line = paymentContext.lines.find(l => l.person.id === selectedPerson.id);
            setHoursDraft(String(line?.hours ?? 0));
            setReasonDraft("");
        }
    }, [selectedPerson, paymentContext.lines]);

    const close = () => setSelectedPersonId(null);

    if (!selectedPerson) return null;

    const canEditStatus = checkPermission("EDITAR_STATUS");
    const canEditPayRule = checkPermission("EDITAR_REMUNERACAO_REGRA");

    const roleName = state.roles.find(r => r.id === selectedPerson.cargoId)?.nome;
    const teamName = state.teams.find(t => t.id === selectedPerson.teamId)?.nome;

    const line = paymentContext.lines.find(l => l.person.id === selectedPerson.id);
    const history = selectedPerson ? personHistory(state, selectedPerson.id) : undefined;

    const handleSaveHours = () => {
        if (!selectedPerson) return;
        upsertHours(selectedPerson.id, Number(hoursDraft), reasonDraft);
        setReasonDraft(""); // Clear reason but keep hours visible
    };

    const handleIntervaloBlur = () => {
        if (selectedPerson && localIntervalo !== selectedPerson.intervalo) {
            updatePersonData(selectedPerson.id, { intervalo: localIntervalo }, "ALTERAR_INTERVALO");
        }
    };

    return (
        <Sheet open={!!selectedPersonId} onOpenChange={(open) => !open && close()}>
            <div className="flex flex-col h-full bg-muted/50">
                {/* Header with Cover */}
                <div className="relative bg-background border-b shadow-sm z-10">
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-90" />

                    <div className="relative px-6 pt-6 pb-6 mt-8 flex items-end gap-5">
                        <div className="relative shrink-0">
                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-background text-3xl font-bold text-primary ring-4 ring-white shadow-lg overflow-hidden">
                                {selectedPerson.fotoUrl ? (
                                    <img src={selectedPerson.fotoUrl} alt={selectedPerson.nome} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="bg-gradient-to-br from-slate-100 to-slate-200 w-full h-full flex items-center justify-center text-muted-foreground/70">
                                        {selectedPerson.nome.charAt(0)}
                                    </span>
                                )}
                            </div>
                            <div className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-white ${selectedPerson.status === 'ATIVO' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        </div>

                        <div className="flex-1 min-w-0 pb-1">
                            <h2 className="text-2xl font-bold leading-tight tracking-tight text-white mb-1 truncate drop-shadow-sm">
                                {selectedPerson.nome}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className="bg-background/90 text-foreground hover:bg-background shadow-sm border-0 font-medium">
                                    <Briefcase className="w-3 h-3 mr-1.5 text-muted-foreground" />
                                    {roleName}
                                </Badge>
                                <Badge variant="secondary" className="bg-background/80 text-foreground/90 hover:bg-background border-0">
                                    {TYPE_LABEL[selectedPerson.type]}
                                </Badge>
                                {teamName && (
                                    <Badge variant="outline" className="text-white border-white/40 bg-background/10 backdrop-blur-sm">
                                        {teamName}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={close}
                            className="absolute top-0 right-4 -mt-2 bg-background/20 hover:bg-background/30 text-white border-0 backdrop-blur-md transition-all rounded-full h-8 w-8"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Configurações Rápidas */}
                    <section className="grid grid-cols-2 gap-4">
                        <div className="bg-background p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 group">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Status
                            </label>
                            <Select
                                value={selectedPerson.status}
                                onValueChange={(val) => updatePersonData(selectedPerson.id, { status: val as any }, "AJUSTAR_STATUS_PESSOA")}
                            >
                                <SelectTrigger
                                    disabled={paymentContext.locked || !canEditStatus}
                                    className="h-9 text-sm font-medium border-border focus:border-primary focus:ring-primary/20"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(STATUS_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="bg-background p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 group">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                                <Briefcase className="h-3 w-3" />
                                Contrato
                            </label>
                            <Select
                                value={selectedPerson.type}
                                onValueChange={(val) => updatePersonData(selectedPerson.id, { type: val as any }, "AJUSTAR_TIPO_PESSOA")}
                            >
                                <SelectTrigger
                                    disabled={paymentContext.locked || !canEditPayRule}
                                    className="h-9 text-sm font-medium border-border focus:border-primary focus:ring-primary/20"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FIXO">Fixo</SelectItem>
                                    <SelectItem value="FREELA">Freela</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </section>

                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Dados Profissionais */}
                        <section className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 pb-2 border-b border-border/50">
                                <UserCircle className="h-4 w-4 text-primary" />
                                Dados Profissionais
                            </h3>
                            <div className="space-y-4 bg-background p-5 rounded-xl border border-border shadow-sm">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome Completo</label>
                                    <Input
                                        value={selectedPerson.nome}
                                        onChange={(e) => updatePersonData(selectedPerson.id, { nome: e.target.value }, "ALTERAR_NOME")}
                                        className="bg-muted/50 hover:bg-background focus:bg-background transition-colors border-border"
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Cargo / Função</label>
                                        <Select
                                            value={selectedPerson.cargoId}
                                            onValueChange={(val) => updatePersonData(selectedPerson.id, { cargoId: val }, "ALTERAR_CARGO")}
                                        >
                                            <SelectTrigger disabled={paymentContext.locked} className="h-9 border-border">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {state.roles.map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Equipe</label>
                                        <Select
                                            value={selectedPerson.teamId}
                                            onValueChange={(val) => updatePersonData(selectedPerson.id, { teamId: val }, "ALTERAR_EQUIPE")}
                                        >
                                            <SelectTrigger disabled={paymentContext.locked} className="h-9 border-border">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {state.teams.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Contato & Pagamento */}
                        <section className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 pb-2 border-b border-border/50">
                                <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                Contato & Pagamento
                            </h3>
                            <div className="space-y-4 bg-background p-5 rounded-xl border border-border shadow-sm">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                        <Phone className="h-3 w-3" /> Telefone / WhatsApp
                                    </label>
                                    <Input
                                        value={selectedPerson.contatoTelefone || ""}
                                        disabled={paymentContext.locked}
                                        onChange={(e) => updatePersonData(selectedPerson.id, { contatoTelefone: e.target.value }, "ALTERAR_TELEFONE")}
                                        placeholder="(00) 00000-0000"
                                        className="font-mono text-sm border-border"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">$</span> Chave PIX
                                    </label>
                                    <Input
                                        value={selectedPerson.pixKey || ""}
                                        disabled={!checkPermission("EDITAR_PIX")}
                                        onChange={(e) => updatePersonData(selectedPerson.id, { pixKey: e.target.value }, "ATUALIZAR_PIX_PESSOA")}
                                        placeholder="CPF, Email ou Aleatória"
                                        className="font-mono text-sm border-border"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Preferencias de Escala */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 pb-2 border-b border-border/50">
                            <Clock3 className="h-4 w-4 text-blue-500" />
                            Preferências de Escala
                        </h3>
                        <div className="bg-background p-5 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="max-w-xs">
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Intervalo Padrão</label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={localIntervalo}
                                        onChange={(e) => setLocalIntervalo(e.target.value)}
                                        onBlur={handleIntervaloBlur}
                                        placeholder="Ex: 1h"
                                        className="bg-muted/50 border-border focus:bg-background transition-all w-32 font-medium"
                                    />
                                    <p className="text-xs text-muted-foreground">de descanso em escalas longas.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Apontamento do Dia */}
                    <section className="space-y-4 pt-4 border-t border-border/60">
                        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            Apontamento do dia
                        </h3>

                        <div className="rounded-xl border border-purple-100 bg-purple-50 dark:bg-purple-900/20/30 p-5 space-y-4 hover:border-purple-200 dark:border-purple-800 transition-colors">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground/90 mb-1.5 block">Horas Trabalhadas</label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min={0}
                                            step={0.25}
                                            className="bg-background border-purple-100 focus:border-purple-400 focus:ring-purple-400/20 pl-3"
                                            disabled={paymentContext.locked}
                                            value={hoursDraft}
                                            onChange={(e) => setHoursDraft(e.target.value)}
                                        />
                                        <span className="absolute right-3 top-2.5 text-xs text-purple-400 font-medium">h</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground/90 mb-1.5 block">Motivo / Obs</label>
                                    <Input
                                        placeholder="Opcional"
                                        className="bg-background border-purple-100 focus:border-purple-400 focus:ring-purple-400/20"
                                        disabled={paymentContext.locked}
                                        value={reasonDraft}
                                        onChange={(e) => setReasonDraft(e.target.value)}
                                    />
                                </div>
                            </div>

                            {line?.overrideFlag && (
                                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                                    <Info className="h-4 w-4 shrink-0" />
                                    <span className="font-medium">Horário modificado manualmente</span>
                                </div>
                            )}

                            <Button
                                size="sm"
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium"
                                disabled={paymentContext.locked}
                                onClick={handleSaveHours}
                            >
                                Confirmar Apontamento
                            </Button>
                        </div>
                    </section>

                    {/* Historico Financeiro */}
                    {history && (
                        <section className="space-y-4 pt-4 border-t border-border/60">
                            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                Histórico Financeiro
                            </h3>
                            <div className="rounded-xl border border-border overflow-hidden shadow-sm">
                                <table className="w-full text-xs">
                                    <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Data</th>
                                            <th className="px-3 py-2 text-right">Horas</th>
                                            <th className="px-3 py-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y relative bg-background">
                                        {history.paymentItems.slice(0, 5).map(item => (
                                            <tr key={item.id} className="hover:bg-muted/50">
                                                <td className="px-3 py-2">{item.date}</td>
                                                <td className="px-3 py-2 text-right text-muted-foreground">{asHours(item.horasSnapshot)}</td>
                                                <td className="px-3 py-2 text-right font-medium">{money(item.total)}</td>
                                            </tr>
                                        ))}
                                        {history.paymentItems.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">Sem historico recente</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    <div className="pt-8 border-t">
                        <Button
                            variant="ghost"
                            className="w-full text-red-500 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:bg-red-900/20"
                            disabled
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Arquivar Pessoa (Em breve)
                        </Button>
                    </div>
                </div>
            </div>
        </Sheet >
    );
}
