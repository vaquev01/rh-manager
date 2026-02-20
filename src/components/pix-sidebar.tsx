"use client";

import { useAppState } from "@/components/state-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/toast";
import { asDateLabel } from "@/lib/date";
import { money } from "@/lib/format";
import { CheckCircle2, Clock3, Copy, CreditCard, Download, Lock, TrendingUp, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { AdditionalDay } from "@/lib/types";

const HOURS_SOURCE_LABEL = {
    ESCALA_PREVISTA: "Escala prevista",
    APONTAMENTO_REAL: "Apontamento real"
};

export function PixSidebar() {
    const {
        state,
        date,
        filters,
        paymentContext,
        checkPermission,
        setPaymentMode,
        setHoursSource,
        setGlobalStandardHours,
        setGlobalAdditional,
        validateHours,
        closePaymentsDay,
        downloadPixCsv,
    } = useAppState();

    const { toast } = useToast();
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);

    // 1. Filter lines based on current dashboard filters
    const filteredLines = useMemo(() => {
        return paymentContext.lines.filter(line => {
            const person = line.person;
            if (filters.companyId && person.companyId !== filters.companyId) return false;
            if (filters.unitId && person.unitId !== filters.unitId) return false;
            if (filters.teamId && person.teamId !== filters.teamId) return false;
            if (filters.cargoId && person.cargoId !== filters.cargoId) return false;
            return true;
        });
    }, [paymentContext.lines, filters]);

    // 2. Calculate breakdowns
    const { totalCost, teamCost, freelaCost, pixCount } = useMemo(() => {
        let total = 0;
        let team = 0;
        let freela = 0;
        let pix = 0;

        filteredLines.forEach(line => {
            total += line.total;
            if (line.person.type === "FREELA") {
                freela += line.total;
            } else {
                team += line.total;
            }
            if (line.showPix && line.pixValue > 0) {
                pix++;
            }
        });

        return { totalCost: total, teamCost: team, freelaCost: freela, pixCount: pix };
    }, [filteredLines]);

    // Filter Pix Summary based on visible lines
    const visiblePixSummary = useMemo(() => {
        return paymentContext.pixSummary.filter(pix =>
            filteredLines.some(l => l.person.id === pix.personId)
        );
    }, [paymentContext.pixSummary, filteredLines]);


    const additionalTypes = state.additionalTypes.filter((type) => type.ativo);

    const [globalAdditionalDraft, setGlobalAdditionalDraft] = useState<{
        tipo: AdditionalDay["tipo"];
        valor: number;
        aplicarPara: AdditionalDay["aplicarPara"];
        pagavelViaPix: boolean;
        descricao: string;
    }>(() => ({
        tipo: paymentContext.config.additionalGlobal?.tipo ?? "ALIMENTACAO",
        valor: paymentContext.config.additionalGlobal?.valor ?? 0,
        aplicarPara: paymentContext.config.additionalGlobal?.aplicarPara ?? "SO_FREELAS",
        pagavelViaPix: paymentContext.config.additionalGlobal?.pagavelViaPix ?? true,
        descricao: paymentContext.config.additionalGlobal?.descricao ?? ""
    }));


    const canClose = checkPermission("FECHAR_PAGAMENTOS_DIA");
    const validatedCount = filteredLines.filter((l) => l.validadoHoras).length;
    const totalLines = filteredLines.length;
    const closingProgress = totalLines > 0 ? validatedCount / totalLines : 0;

    const handleCopyReport = () => {
        const lines = [
            `*Relatório Diário - ${asDateLabel(date)}*`,
            `Total Equipe: ${money(totalCost)}`,
            `-------------------`,
            `Fixo: ${money(teamCost)}`,
            `Freela: ${money(freelaCost)}`,
            ``,
            `*PIX a pagar:*`,
            ...visiblePixSummary.map(p => `• ${p.nome}: ${money(p.valor)}`)
        ];
        navigator.clipboard.writeText(lines.join("\n"));
        toast("Relatório copiado!", "success");
    };

    return (
        <div className="space-y-4 h-full flex flex-col">
            <Card className="flex-1 flex flex-col shadow-sm border-border">
                <CardHeader className="p-4 pb-2 shrink-0">
                    <CardTitle className="text-xs font-bold uppercase tracking-wide flex items-center gap-2 text-muted-foreground">
                        <CreditCard className="h-3.5 w-3.5" />
                        Calculadora do Dia
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-1 flex flex-col gap-4 overflow-y-auto">
                    {/* Totals */}
                    <div>
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-bold tracking-tight text-slate-900">{money(totalCost)}</span>
                            <span className="text-xs text-muted-foreground">{filteredLines.length} pessoas</span>
                        </div>
                        <div className="flex gap-2 mt-1">
                            <div className="bg-muted/50 px-2 py-1 rounded border border-border/50 flex-1">
                                <p className="text-[9px] uppercase font-bold text-muted-foreground/70">Equipe</p>
                                <p className="text-xs font-semibold text-foreground/90">{money(teamCost)}</p>
                            </div>
                            <div className="bg-amber-50 px-2 py-1 rounded border border-amber-100 flex-1">
                                <p className="text-[9px] uppercase font-bold text-amber-600/70">Freela</p>
                                <p className="text-xs font-semibold text-amber-700">{money(freelaCost)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {totalLines > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                <span>Progresso</span>
                                <span>{Math.round(closingProgress * 100)}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-300"
                                    style={{ width: `${closingProgress * 100}%` }}
                                />
                            </div>
                            {paymentContext.locked && (
                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded w-fit">
                                    <Lock className="h-3 w-3" /> DIA FECHADO
                                </p>
                            )}
                        </div>
                    )}

                    <Separator />

                    {/* Controls */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant={paymentContext.config.mode === "CUSTO" ? "primary" : "outline"}
                                size="sm"
                                onClick={() => setPaymentMode("CUSTO")}
                                disabled={paymentContext.locked}
                                className="w-full text-xs h-7"
                            >
                                Custo
                            </Button>
                            <Button
                                variant={paymentContext.config.mode === "PAGAMENTO" ? "primary" : "outline"}
                                size="sm"
                                onClick={() => setPaymentMode("PAGAMENTO")}
                                disabled={paymentContext.locked}
                                className="w-full text-xs h-7"
                            >
                                Pagamento
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Horas Padrão</label>
                                <Input
                                    type="number"
                                    className="h-7 mt-1 text-xs"
                                    min={0}
                                    step={0.25}
                                    disabled={paymentContext.locked}
                                    value={paymentContext.config.horasPadraoDia}
                                    onChange={(e) => setGlobalStandardHours(Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Fonte</label>
                                <Select
                                    value={paymentContext.config.fonteHoras}
                                    onValueChange={(val) => setHoursSource(val as any)}
                                >
                                    <SelectTrigger className="h-7 mt-1 text-xs" disabled={paymentContext.locked}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(HOURS_SOURCE_LABEL).map(([v, l]) => (
                                            <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5 p-2 bg-muted/50 rounded-lg border border-border/50">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Adicional Global</label>
                            <div className="flex gap-2">
                                <Select
                                    value={globalAdditionalDraft.tipo}
                                    onValueChange={(val) => setGlobalAdditionalDraft(p => ({ ...p, tipo: val as any }))}
                                >
                                    <SelectTrigger className="h-7 text-xs flex-1" disabled={paymentContext.locked}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {additionalTypes.map(t => <SelectItem key={t.id} value={t.nome} className="text-xs">{t.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="number"
                                    className="h-7 w-20 text-xs"
                                    placeholder="R$"
                                    value={globalAdditionalDraft.valor}
                                    disabled={paymentContext.locked}
                                    onChange={(e) => setGlobalAdditionalDraft(p => ({ ...p, valor: Number(e.target.value) }))}
                                />
                            </div>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="w-full h-7 text-xs bg-background border border-border hover:bg-muted"
                                disabled={paymentContext.locked}
                                onClick={() => {
                                    setGlobalAdditional({
                                        ...globalAdditionalDraft,
                                        descricao: globalAdditionalDraft.descricao.trim() || undefined
                                    });
                                    toast("Adicional global aplicado", "success");
                                }}
                            >
                                Aplicar a todos
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {/* Pix List */}
                    <div className="flex-1 min-h-0 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Resumo PIX</h4>
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleCopyReport} title="Copiar Relatório">
                                <Copy className="h-3 w-3 text-muted-foreground/70" />
                            </Button>
                        </div>

                        {visiblePixSummary.length === 0 ? (
                            <div className="flex-1 border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center text-center text-xs text-muted-foreground p-4">
                                Nenhum PIX para os filtros atuais
                            </div>
                        ) : (
                            <ul className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                                {visiblePixSummary.map(pix => (
                                    <li key={pix.personId} className="flex justify-between items-center bg-muted/50 p-2 rounded border border-border/50">
                                        <div className="min-w-0 flex-1 mr-2">
                                            <div className="text-xs font-semibold text-foreground/90 truncate">{pix.nome}</div>
                                            <div className="text-[9px] text-muted-foreground font-mono truncate">{pix.chavePix}</div>
                                        </div>
                                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{money(pix.valor)}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="space-y-2 mt-auto pt-2">
                        <div className="flex gap-2">
                            {!showCloseConfirm ? (
                                <Button
                                    className="flex-1 h-9 text-xs"
                                    variant="outline"
                                    disabled={paymentContext.locked || !canClose}
                                    onClick={() => setShowCloseConfirm(true)}
                                >
                                    <Lock className="mr-1.5 h-3.5 w-3.5" /> Fechar Dia
                                </Button>
                            ) : (
                                <Button
                                    className="flex-1 h-9 text-xs"
                                    variant="danger"
                                    onClick={() => {
                                        closePaymentsDay();
                                        setShowCloseConfirm(false);
                                        toast("Dia fechado com sucesso", "success");
                                    }}
                                >
                                    Confirmar
                                </Button>
                            )}

                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                title="Validar Horas"
                                disabled={paymentContext.locked}
                                onClick={() => validateHours()}
                            >
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </Button>
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}

