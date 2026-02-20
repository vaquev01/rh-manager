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
import { useMemo, useState, useRef } from "react";
import { AdditionalDay } from "@/lib/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

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
        addIndividualAdditional,
        removeIndividualAdditional,
        validateHours,
        closePaymentsDay,
        reopenPaymentsDay,
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
    const { totalCost, teamCost, freelaCost, pixCount, totalHours, avgHourlyCost } = useMemo(() => {
        let total = 0;
        let team = 0;
        let freela = 0;
        let pix = 0;
        let hours = 0;

        filteredLines.forEach(line => {
            total += line.total;
            hours += line.hours;
            if (line.person.type === "FREELA") {
                freela += line.total;
            } else {
                team += line.total;
            }
            if (line.showPix && line.pixValue > 0) {
                pix++;
            }
        });

        const avg = hours > 0 ? total / hours : 0;

        return { totalCost: total, teamCost: team, freelaCost: freela, pixCount: pix, totalHours: hours, avgHourlyCost: avg };
    }, [filteredLines]);

    const donutData = useMemo(() => [
        { name: 'Equipe Fixa', value: teamCost },
        { name: 'Freelas', value: freelaCost },
    ], [teamCost, freelaCost]);
    const DONUT_COLORS = ['#3b82f6', '#f59e0b'];

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
            `Total Geral: ${money(totalCost)} (${totalHours}h | Média: ${money(avgHourlyCost)}/h)`,
            `-------------------`,
            `Fixo: ${money(teamCost)}`,
            `Freela: ${money(freelaCost)}`,
            ``,
            `*PIX a pagar:*`
        ];

        visiblePixSummary.forEach(pix => {
            const lineData = filteredLines.find(l => l.person.id === pix.personId);
            if (lineData) {
                const baseStr = lineData.base > 0 ? `Base: ${money(lineData.base)}` : '';
                const formatAds = lineData.additionals.reduce((a, b) => a + b.valorEfetivo, 0);
                const adsStr = formatAds !== 0 ? `, Extras: ${formatAds > 0 ? '+' : ''}${money(formatAds)}` : '';
                lines.push(`• ${pix.nome}: ${money(pix.valor)}`);
                lines.push(`  ↳ ${lineData.hours}h (${baseStr}${adsStr})`);
            } else {
                lines.push(`• ${pix.nome}: ${money(pix.valor)}`);
            }
        });

        navigator.clipboard.writeText(lines.join("\n"));
        toast("Relatório copiado com detalhamento!", "success");
    };

    const handlePrintPix = () => {
        window.print();
    };

    return (
        <div className="space-y-4 h-full flex flex-col relative print-mode-wrapper">
            <Card className="flex-1 flex flex-col shadow-sm border-border min-h-0 printable-card">
                <CardHeader className="p-4 pb-2 shrink-0 hide-on-print">
                    <CardTitle className="text-xs font-bold uppercase tracking-wide flex items-center gap-2 text-muted-foreground">
                        <CreditCard className="h-3.5 w-3.5" />
                        Calculadora do Dia
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-1 flex flex-col gap-4 overflow-y-auto">
                    {/* Print Header Visible Only When Printing */}
                    <div className="hidden show-on-print mb-4 border-b pb-4">
                        <h2 className="text-lg font-bold">Resumo Diário de Pagamentos (PIX)</h2>
                        <p className="text-sm text-muted-foreground">Data: {asDateLabel(date)}</p>
                    </div>

                    {/* Totals */}
                    <div className="hide-on-print">
                        <div className="flex items-baseline justify-between mb-0">
                            <span className="text-2xl font-bold tracking-tight text-slate-900">{money(totalCost)}</span>
                            <div className="text-right">
                                <p className="text-xs font-bold text-muted-foreground">{filteredLines.length} pessoas</p>
                                <p className="text-[10px] text-muted-foreground/80 font-mono">{totalHours}h totais · {money(avgHourlyCost)}/h</p>
                            </div>
                        </div>
                        {totalCost > 0 ? (
                            <div className="h-[120px] w-full mt-2 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={donutData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={36}
                                            outerRadius={50}
                                            paddingAngle={2}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {donutData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            formatter={(value: any) => money(Number(value))}
                                            contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            itemStyle={{ color: '#0f172a' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Custo</span>
                                </div>
                            </div>
                        ) : null}
                        <div className="flex gap-2 mt-2">
                            <div className="bg-muted/50 px-2 py-1.5 rounded-lg border border-border/50 flex-1 flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                <div>
                                    <p className="text-[9px] uppercase font-bold text-muted-foreground/90">Equipe</p>
                                    <p className="text-xs font-semibold text-foreground/90 leading-none">{money(teamCost)}</p>
                                </div>
                            </div>
                            <div className="bg-amber-50 px-2 py-1.5 rounded-lg border border-amber-100 flex-1 flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                                <div>
                                    <p className="text-[9px] uppercase font-bold text-amber-700/80">Freela</p>
                                    <p className="text-xs font-semibold text-amber-700 leading-none">{money(freelaCost)}</p>
                                </div>
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
                        </div>
                    )}

                    <Separator className="hide-on-print" />

                    {/* Controls */}
                    <div className="space-y-2 hide-on-print bg-muted/30 p-2 rounded-lg border border-border/50">
                        <div className="grid grid-cols-2 gap-1.5">
                            <Select
                                value={paymentContext.config.mode}
                                onValueChange={(val) => setPaymentMode(val as any)}
                            >
                                <SelectTrigger className="h-7 text-[9px] font-bold bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CUSTO" className="text-[10px]">Custo</SelectItem>
                                    <SelectItem value="PAGAMENTO" className="text-[10px]">Pagamento</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={paymentContext.config.fonteHoras}
                                onValueChange={(val) => setHoursSource(val as any)}
                            >
                                <SelectTrigger className="h-7 text-[9px] bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(HOURS_SOURCE_LABEL).map(([v, l]) => (
                                        <SelectItem key={v} value={v} className="text-[10px]">{l}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-1.5 items-center">
                            <div className="bg-background rounded-md border border-input flex items-center h-7 px-2 shrink-0">
                                <span className="text-[8px] font-bold text-muted-foreground uppercase mr-1">Hrs</span>
                                <Input
                                    type="number"
                                    className="h-5 w-8 text-[10px] border-none px-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-center"
                                    min={0}
                                    step={0.25}
                                    value={paymentContext.config.horasPadraoDia}
                                    onChange={(e) => setGlobalStandardHours(Number(e.target.value))}
                                />
                            </div>
                            <Select
                                value={globalAdditionalDraft.tipo}
                                onValueChange={(val) => setGlobalAdditionalDraft(p => ({ ...p, tipo: val as any }))}
                            >
                                <SelectTrigger className="h-7 text-[9px] flex-1 bg-background min-w-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {additionalTypes.map(t => <SelectItem key={t.id} value={t.nome} className="text-[10px]">{t.nome}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Input
                                type="number"
                                className="h-7 w-14 text-[10px] bg-background text-center px-1 shrink-0"
                                placeholder="R$"
                                value={globalAdditionalDraft.valor}
                                onChange={(e) => setGlobalAdditionalDraft(p => ({ ...p, valor: Number(e.target.value) }))}
                            />
                            <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 w-7 p-0 bg-background border border-border shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground"
                                onClick={() => {
                                    setGlobalAdditional({
                                        ...globalAdditionalDraft,
                                        descricao: globalAdditionalDraft.descricao.trim() || undefined
                                    });
                                    toast("Adicional aplicado", "success");
                                }}
                                title="Aplicar Adicional Global à Equipe"
                            >
                                +
                            </Button>
                        </div>
                    </div>

                    <Separator className="hide-on-print" />

                    {/* Pix List */}
                    <div className="flex-1 min-h-[300px] flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Resumo PIX</h4>
                            <div className="flex gap-1 hide-on-print">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyReport} title="Copiar Relatório em Texto">
                                    <Copy className="h-3 w-3 text-muted-foreground/70" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={handlePrintPix} title="Gerar Imagem Visual">
                                    <Download className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        {visiblePixSummary.length === 0 ? (
                            <div className="flex-1 border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center text-center text-xs text-muted-foreground p-4">
                                Nenhum PIX para os filtros atuais
                            </div>
                        ) : (
                            <ul className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                                {visiblePixSummary.map(pix => {
                                    const additionals = state.additionalDays.filter(a => a.personId === pix.personId && a.date === date);

                                    return (
                                        <li key={pix.personId} className="bg-muted/30 p-2.5 rounded border border-border/50 group printable-list-item print-bg-transparent print-border-b">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="min-w-0 flex-1 mr-2">
                                                    <div className="text-xs font-semibold text-foreground/90 truncate">{pix.nome}</div>
                                                    <div className="text-[10px] text-muted-foreground font-mono truncate">{pix.chavePix || "Sem PIX"}</div>
                                                </div>
                                                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{money(pix.valor)}</div>
                                            </div>

                                            {/* Additionals View & Add Button */}
                                            <div className="mt-2 hide-on-print">
                                                {additionals.length > 0 && (
                                                    <div className="space-y-1 mt-2 border-t border-border/50 pt-1.5 mb-2">
                                                        {additionals.map(a => (
                                                            <div key={a.id} className="flex items-center justify-between text-[10px]">
                                                                <span className="text-muted-foreground flex items-center gap-1">
                                                                    <div className="h-1 w-1 rounded-full bg-emerald-500"></div>
                                                                    {a.tipo.toLowerCase()} {a.descricao ? `(${a.descricao})` : ""}
                                                                </span>
                                                                <div className="flex items-center gap-1">
                                                                    <span className="font-semibold text-emerald-600">+{money(a.valor)}</span>
                                                                    <button
                                                                        onClick={() => removeIndividualAdditional(a.id)}
                                                                        disabled={paymentContext.locked}
                                                                        className="text-red-400 hover:text-red-600 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Add quick additional */}
                                                {!paymentContext.locked && (
                                                    <div className="flex items-center gap-1.5 mt-1 pt-1 opacity-70 focus-within:opacity-100 hover:opacity-100 transition-opacity">
                                                        <Input
                                                            id={`add-val-${pix.personId}`}
                                                            type="number"
                                                            placeholder="R$"
                                                            className="h-6 text-[10px] w-14 px-1 text-center bg-background/50 border-dashed border-muted-foreground/30 focus:border-solid focus:bg-background"
                                                        />
                                                        <Input
                                                            id={`add-desc-${pix.personId}`}
                                                            type="text"
                                                            placeholder="Motivo (Opcional)"
                                                            className="h-6 text-[10px] flex-1 px-1.5 bg-background/50 border-dashed border-muted-foreground/30 focus:border-solid focus:bg-background"
                                                        />
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            className="h-6 px-2 text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold shadow-sm"
                                                            onClick={async () => {
                                                                const valInput = document.getElementById(`add-val-${pix.personId}`) as HTMLInputElement;
                                                                const descInput = document.getElementById(`add-desc-${pix.personId}`) as HTMLInputElement;

                                                                if (valInput && Number(valInput.value) > 0) {
                                                                    addIndividualAdditional(
                                                                        pix.personId,
                                                                        {
                                                                            tipo: "OUTRO",
                                                                            valor: Number(valInput.value),
                                                                            descricao: descInput?.value || "Adicional extra",
                                                                            pagavelViaPix: true
                                                                        }
                                                                    );
                                                                    valInput.value = "";
                                                                    if (descInput) descInput.value = "";
                                                                    toast(`Adicionado a ${pix.nome.split(" ")[0]}`, "success");
                                                                } else {
                                                                    toast("Informe um valor maior que zero.", "warning");
                                                                }
                                                            }}
                                                        >
                                                            Incluir
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    <div className="space-y-2 mt-auto pt-2 hide-on-print">
                        <div className="flex gap-2">
                            {!showCloseConfirm ? (
                                <Button
                                    className="flex-1 h-9 text-xs font-bold transition-all shadow-sm bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white"
                                    disabled={!canClose}
                                    onClick={() => setShowCloseConfirm(true)}
                                >
                                    <Lock className="mr-1.5 h-3.5 w-3.5" /> Salvar Histórico do Dia
                                </Button>
                            ) : (
                                <Button
                                    className="flex-1 h-9 text-xs shadow-sm bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => {
                                        closePaymentsDay();
                                        setShowCloseConfirm(false);
                                        toast("Histórico do dia salvo com sucesso!", "success");
                                    }}
                                >
                                    Confirmar Salvamento
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 shrink-0 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800"
                                title="Validar Horas"
                                onClick={() => validateHours()}
                            >
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </Button>
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div >
    );
}

