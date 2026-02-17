import { useAppState } from "@/components/state-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { asHours, money } from "@/lib/format";
import { personHistory } from "@/lib/selectors";
import { Person } from "@/lib/types";
import { ArrowLeft, Clock3, CreditCard, Info, Trash2 } from "lucide-react";
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
            <div className="flex flex-col h-full bg-slate-50/50">
                {/* Header */}
                <div className="bg-white px-6 py-6 border-b shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-2xl font-bold text-primary ring-4 ring-white shadow-sm">
                            {selectedPerson.nome.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 truncate">
                                {selectedPerson.nome}
                            </h2>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline" className="text-[10px] bg-slate-50">{roleName}</Badge>
                                <Badge
                                    variant={selectedPerson.type === 'FIXO' ? 'default' : 'secondary'}
                                    className="text-[10px]"
                                >
                                    {TYPE_LABEL[selectedPerson.type]}
                                </Badge>
                                <Badge
                                    variant={selectedPerson.status === 'ATIVO' ? 'ok' : 'warn'}
                                    className="text-[10px]"
                                >
                                    {STATUS_LABEL[selectedPerson.status]}
                                </Badge>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={close} className="-mt-1 -mr-2">
                            <ArrowLeft className="h-5 w-5 text-slate-400" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Quick Actions / Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded-xl border shadow-sm">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Status</label>
                            <Select
                                value={selectedPerson.status}
                                disabled={paymentContext.locked || !canEditStatus}
                                onChange={(e) => updatePersonData(selectedPerson.id, { status: e.target.value as any }, "AJUSTAR_STATUS_PESSOA")}
                                className="h-8 text-xs"
                            >
                                {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </Select>
                        </div>
                        <div className="bg-white p-3 rounded-xl border shadow-sm">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Tipo Contrato</label>
                            <Select
                                value={selectedPerson.type}
                                disabled={paymentContext.locked || !canEditPayRule}
                                onChange={(e) => updatePersonData(selectedPerson.id, { type: e.target.value as any }, "AJUSTAR_TIPO_PESSOA")}
                                className="h-8 text-xs"
                            >
                                <option value="FIXO">Fixo</option>
                                <option value="FREELA">Freela</option>
                            </Select>
                        </div>
                    </div>

                    {/* Main Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            Dados Cadastrais
                        </h3>

                        <div className="grid gap-4 bg-white p-4 rounded-xl border shadow-sm">
                            <div>
                                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Nome Completo</label>
                                <Input
                                    value={selectedPerson.nome}
                                    onChange={(e) => updatePersonData(selectedPerson.id, { nome: e.target.value }, "ALTERAR_NOME")}
                                    className="bg-slate-50/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-slate-500 mb-1.5 block">Equipe</label>
                                    <Select
                                        value={selectedPerson.teamId}
                                        disabled={paymentContext.locked}
                                        onChange={(e) => updatePersonData(selectedPerson.id, { teamId: e.target.value }, "ALTERAR_EQUIPE")}
                                        className="h-9"
                                    >
                                        {state.teams.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 mb-1.5 block">Cargo</label>
                                    <Select
                                        value={selectedPerson.cargoId}
                                        disabled={paymentContext.locked}
                                        onChange={(e) => updatePersonData(selectedPerson.id, { cargoId: e.target.value }, "ALTERAR_CARGO")}
                                        className="h-9"
                                    >
                                        {state.roles.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-slate-500 mb-1.5 block">Telefone</label>
                                    <Input
                                        value={selectedPerson.contatoTelefone || ""}
                                        disabled={paymentContext.locked}
                                        onChange={(e) => updatePersonData(selectedPerson.id, { contatoTelefone: e.target.value }, "ALTERAR_TELEFONE")}
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 mb-1.5 block">Chave PIX</label>
                                    <Input
                                        value={selectedPerson.pixKey || ""}
                                        disabled={!checkPermission("EDITAR_PIX")}
                                        onChange={(e) => updatePersonData(selectedPerson.id, { pixKey: e.target.value }, "ATUALIZAR_PIX_PESSOA")}
                                        placeholder="CPF/Email..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Escala Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            Preferencias de Escala
                        </h3>
                        <div className="grid gap-4 bg-white p-4 rounded-xl border shadow-sm">
                            <div>
                                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Tempo de Intervalo</label>
                                <Input
                                    value={localIntervalo}
                                    onChange={(e) => setLocalIntervalo(e.target.value)}
                                    onBlur={handleIntervaloBlur}
                                    placeholder="Ex: 1h, 30min..."
                                    className="bg-slate-50/50"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">Tempo de descanso padrão para escalas longas.</p>
                            </div>
                        </div>
                    </div>

                    {/* Apontamento do Dia */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b pb-2">Apontamento do dia</h3>

                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Horas Trabalhadas</label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step={0.25}
                                        className="bg-white"
                                        disabled={paymentContext.locked}
                                        value={hoursDraft}
                                        onChange={(e) => setHoursDraft(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Motivo / Obs</label>
                                    <Input
                                        placeholder="Opcional"
                                        className="bg-white"
                                        disabled={paymentContext.locked}
                                        value={reasonDraft}
                                        onChange={(e) => setReasonDraft(e.target.value)}
                                    />
                                </div>
                            </div>

                            {line?.overrideFlag && (
                                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                                    <Info className="h-3.5 w-3.5" />
                                    <span>Override manual ativo</span>
                                </div>
                            )}

                            <Button
                                size="sm"
                                className="w-full"
                                disabled={paymentContext.locked}
                                onClick={handleSaveHours}
                            >
                                Confirmar Apontamento
                            </Button>
                        </div>
                    </div>

                    {/* Historico Financeiro */}
                    {history && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b pb-2">Historico Financeiro</h3>
                            <div className="rounded-xl border overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Data</th>
                                            <th className="px-3 py-2 text-right">Horas</th>
                                            <th className="px-3 py-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y relative bg-white">
                                        {history.paymentItems.slice(0, 5).map(item => (
                                            <tr key={item.id} className="hover:bg-slate-50/50">
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
                        </div>
                    )}

                    <div className="pt-8 border-t">
                        <Button
                            variant="ghost"
                            className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
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
