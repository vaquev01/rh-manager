"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, UserCog, Award, Mail, FileText, CheckCircle2, Clock, Briefcase } from "lucide-react";
import { useAppState } from "@/components/state-provider";

import { ROLE_LABEL } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Person, PersonDocument } from "@/lib/types";
import { BulkImporter } from "@/components/bulk-importer";
import { OrganogramaBoard } from "@/components/organograma-board";

function formatDateBr(isoString?: string) {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export default function EquipePage() {
    const { state, filters, resetFilters, addPerson, upsertDocument, removeDocument } = useAppState();

    const [search, setSearch] = useState("");
    const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isBulkOpen, setIsBulkOpen] = useState(false);

    // Forms state
    const [formData, setFormData] = useState<Partial<Person>>({});

    const filteredPeople = useMemo(() => {
        return state.people.filter(p => {
            if (filters.companyId && p.companyId !== filters.companyId) return false;
            if (filters.unitId && p.unitId !== filters.unitId) return false;
            if (filters.teamId && p.teamId !== filters.teamId) return false;
            if (filters.cargoId && p.cargoId !== filters.cargoId) return false;

            if (search) {
                const q = search.toLowerCase();
                if (!p.nome.toLowerCase().includes(q) && !(p.contatoTelefone || "").includes(q)) {
                    return false;
                }
            }
            return true;
        });
    }, [state.people, filters, search]);

    const handleCreateNew = () => {
        setIsCreating(true);
        setFormData({
            type: "FIXO",
            status: "ATIVO",
            performance: { dia: "VERDE" }
        });
        setSelectedPersonId(null);
        setIsSheetOpen(true);
    };

    const handleBulkImport = (data: any[]) => {
        // Map the imported rows to Person objects
        data.forEach(row => {
            const newPerson: Omit<Person, "id" | "createdAt" | "updatedAt"> = {
                nome: row.Nome || row.nome || "Sem Nome",
                contatoTelefone: row.Telefone || row.telefone,
                type: (row.Tipo || row.tipo)?.toUpperCase() === "FREELA" ? "FREELA" : "FIXO",
                status: "ATIVO",
                cargoId: state.roles.find(r => r.nome.toLowerCase() === (row.Cargo || row.cargo)?.toLowerCase())?.id || state.roles[0]?.id || "cargo-vazio",
                companyId: filters.companyId || state.companies[0]?.id || "empresa-1",
                unitId: filters.unitId || state.units[0]?.id || "unidade-1",
                teamId: "null",
                pixKey: row.Pix || row.pix,
                salario: Number(row.ValorHora || row.valorHora) || undefined,
                performance: { dia: "VERDE" },
            };
            addPerson(newPerson);
        });
    };

    const handleEditPerson = (id: string) => {
        const person = state.people.find(p => p.id === id);
        if (person) {
            setIsCreating(false);
            setFormData(person);
            setSelectedPersonId(id);
            setIsSheetOpen(true);
        }
    };

    const getCargoName = (id?: string) => state.roles.find(r => r.id === id)?.nome || "Não definido";
    const getUnitName = (id?: string) => state.units.find(u => u.id === id)?.nome || "N/A";

    const getPersonDocuments = (personId: string) => {
        return state.documents.filter(d => d.personId === personId);
    };

    const savePerson = () => {
        if (isCreating) {
            if (!formData.nome || !formData.companyId || !formData.unitId || !formData.cargoId) {
                alert("Preencha os campos obrigatórios: Nome, Empresa, Unidade e Cargo.");
                return;
            }

            const newPerson: Omit<Person, "id" | "createdAt" | "updatedAt"> = {
                nome: formData.nome!,
                cargoId: formData.cargoId!,
                type: formData.type || "FIXO",
                status: formData.status || "ATIVO",
                companyId: formData.companyId!,
                unitId: formData.unitId!,
                teamId: formData.teamId || "null",
                contatoTelefone: formData.contatoTelefone,
                pixKey: formData.pixKey,
                dataNascimento: formData.dataNascimento,
                cpf: formData.cpf,
                rg: formData.rg,
                salario: formData.salario,
                inicioFerias: formData.inicioFerias,
                fimFerias: formData.fimFerias,
                performance: formData.performance || { dia: "VERDE" },
            };

            addPerson(newPerson);
            setIsSheetOpen(false);
        } else {
            alert("A edição completa requer a integração do updatePersonData. Para este MVP focamos na criação e listagem, mas podemos salvar os campos já no state-provider.");
            // TODO: Call updatePersonData from state provider
            setIsSheetOpen(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, tipo: string) => {
        const file = e.target.files?.[0];
        if (!file || !selectedPersonId) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Str = event.target?.result as string;
            upsertDocument({
                personId: selectedPersonId,
                tipo,
                status: "OK",
                criticidade: "MEDIA",
                fileData: base64Str,
            });
        };
        reader.readAsDataURL(file);
    };

    return (
        <>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Diretório da Equipe</h1>
                        <p className="text-sm text-muted-foreground">
                            Gerencie colaboradores, contratos e documentações em um só lugar
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 sm:w-64"
                            />
                        </div>
                        <Button onClick={handleCreateNew} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Novo Colaborador
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="diretorio" className="w-full">
                    <TabsList className="grid w-full sm:w-[500px] grid-cols-2 mb-8">
                        <TabsTrigger value="diretorio">Diretório (Cartões)</TabsTrigger>
                        <TabsTrigger value="organograma">Organograma Visual</TabsTrigger>
                    </TabsList>

                    <TabsContent value="diretorio" className="mt-0">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredPeople.map((person) => {
                                const docs = getPersonDocuments(person.id);
                                const pendentes = docs.filter(d => d.status === "PENDENTE").length;

                                return (
                                    <Card
                                        key={person.id}
                                        className="group relative overflow-hidden transition-all hover:shadow-md cursor-pointer border-border/50 bg-card hover:border-primary/20"
                                        onClick={() => handleEditPerson(person.id)}
                                    >
                                        <div className="absolute right-4 top-4">
                                            <Badge variant={person.status === "ATIVO" ? "default" : "secondary"}>
                                                {person.status}
                                            </Badge>
                                        </div>

                                        <div className="p-5">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                                                    {person.nome.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-foreground line-clamp-1">{person.nome}</h3>
                                                    <p className="text-sm text-muted-foreground">{getCargoName(person.cargoId)}</p>
                                                </div>
                                            </div>

                                            <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase className="h-4 w-4 opacity-70" />
                                                    <span className="line-clamp-1">{getUnitName(person.unitId)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Award className="h-4 w-4 opacity-70" />
                                                    <span>{person.type === "FIXO" ? "Contrato Fixo" : "Freelancer"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t bg-muted/20 px-5 py-3 flex items-center justify-between text-xs font-medium">
                                            {pendentes > 0 ? (
                                                <span className="flex items-center gap-1.5 text-destructive">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {pendentes} doc{pendentes > 1 ? 's' : ''} pendente{pendentes > 1 ? 's' : ''}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Tudo OK
                                                </span>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>

                        {filteredPeople.length === 0 && (
                            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                    <UserCog className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="mt-4 text-sm font-semibold text-foreground">Nenhum colaborador</h3>
                                <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                                    Não encontramos ninguém com os filtros atuais ou sua busca.
                                </p>
                                <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); resetFilters(); }}>
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="organograma" className="mt-0">
                        <OrganogramaBoard />
                    </TabsContent>
                </Tabs>
            </div>

            <Sheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                title={isCreating ? "Novo Colaborador" : "Editar Perfil"}
                description={isCreating ? "Preencha os dados abaixo para cadastrar." : "Atualize os dados e anexe documentos."}
            >
                <div className="w-full">
                    <Tabs defaultValue="dados" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="dados">Geral</TabsTrigger>
                            <TabsTrigger value="docs" disabled={isCreating}>Documentos</TabsTrigger>
                        </TabsList>

                        <TabsContent value="dados" className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Nome Completo</label>
                                <Input
                                    value={formData.nome || ""}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    placeholder="Ex: João da Silva"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium">Empresa</label>
                                    <Select
                                        value={formData.companyId || ""}
                                        onValueChange={(v) => setFormData({ ...formData, companyId: v, unitId: "" })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent>
                                            {state.companies.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium">Unidade</label>
                                    <Select
                                        value={formData.unitId || ""}
                                        onValueChange={(v) => setFormData({ ...formData, unitId: v })}
                                    >
                                        <SelectTrigger disabled={!formData.companyId}>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {state.units.filter(u => u.companyId === formData.companyId).map(u =>
                                                <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium">Cargo</label>
                                    <Select
                                        value={formData.cargoId || ""}
                                        onValueChange={(v) => setFormData({ ...formData, cargoId: v })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent>
                                            {state.roles.map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium">Vínculo</label>
                                    <Select
                                        value={formData.type || "FIXO"}
                                        onValueChange={(v) => setFormData({ ...formData, type: v as "FIXO" | "FREELA" })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FIXO">CLT / Fixo</SelectItem>
                                            <SelectItem value="FREELA">Freelancer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium">WhatsApp / Telefone</label>
                                <Input
                                    value={formData.contatoTelefone || ""}
                                    onChange={(e) => setFormData({ ...formData, contatoTelefone: e.target.value })}
                                    placeholder="5511999999999"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium">Chave PIX</label>
                                <Input
                                    value={formData.pixKey || ""}
                                    onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                                    placeholder="CPF, Email ou Telefone"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium">Data de Nascimento</label>
                                    <Input
                                        type="date"
                                        value={formData.dataNascimento || ""}
                                        onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium">Salário Bruto</label>
                                    <Input
                                        type="number"
                                        value={formData.salario || ""}
                                        onChange={(e) => setFormData({ ...formData, salario: Number(e.target.value) })}
                                        placeholder="R$ 0,00"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium">CPF</label>
                                    <Input
                                        value={formData.cpf || ""}
                                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium">RG</label>
                                    <Input
                                        value={formData.rg || ""}
                                        onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                                        placeholder="00.000.000-0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium">Início Férias Previstas</label>
                                    <Input
                                        type="date"
                                        value={formData.inicioFerias || ""}
                                        onChange={(e) => setFormData({ ...formData, inicioFerias: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium">Fim Férias Previstas</label>
                                    <Input
                                        type="date"
                                        value={formData.fimFerias || ""}
                                        onChange={(e) => setFormData({ ...formData, fimFerias: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-6">
                                <Button className="w-full" onClick={savePerson}>
                                    {isCreating ? "Cadastrar Colaborador" : "Salvar Alterações"}
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="docs" className="space-y-6">
                            {!isCreating && selectedPersonId && (
                                <>
                                    <div className="rounded-lg border bg-card p-4">
                                        <h4 className="font-semibold text-sm mb-3">Rg ou CPF</h4>
                                        {getPersonDocuments(selectedPersonId).find(d => d.tipo === "RG_CPF")?.fileData ? (
                                            <div className="flex items-center justify-between text-sm p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-md">
                                                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Anexado com sucesso</span>
                                                <Button variant="ghost" size="sm" onClick={() => {
                                                    const doc = getPersonDocuments(selectedPersonId).find(d => d.tipo === "RG_CPF");
                                                    if (doc) removeDocument(doc.id);
                                                }}>Remover</Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <Input type="file" onChange={(e) => handleFileUpload(e, "RG_CPF")} className="text-xs" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-lg border bg-card p-4">
                                        <h4 className="font-semibold text-sm mb-3">Comprovante de Residência</h4>
                                        {getPersonDocuments(selectedPersonId).find(d => d.tipo === "COMPROVANTE_RESIDENCIA")?.fileData ? (
                                            <div className="flex items-center justify-between text-sm p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-md">
                                                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Anexado com sucesso</span>
                                                <Button variant="ghost" size="sm" onClick={() => {
                                                    const doc = getPersonDocuments(selectedPersonId).find(d => d.tipo === "COMPROVANTE_RESIDENCIA");
                                                    if (doc) removeDocument(doc.id);
                                                }}>Remover</Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <Input type="file" onChange={(e) => handleFileUpload(e, "COMPROVANTE_RESIDENCIA")} className="text-xs" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-lg border bg-card p-4">
                                        <h4 className="font-semibold text-sm mb-3">Contrato Assinado</h4>
                                        {getPersonDocuments(selectedPersonId).find(d => d.tipo === "CONTRATO")?.fileData ? (
                                            <div className="flex items-center justify-between text-sm p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-md">
                                                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Anexado com sucesso</span>
                                                <Button variant="ghost" size="sm" onClick={() => {
                                                    const doc = getPersonDocuments(selectedPersonId).find(d => d.tipo === "CONTRATO");
                                                    if (doc) removeDocument(doc.id);
                                                }}>Remover</Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <Input type="file" onChange={(e) => handleFileUpload(e, "CONTRATO")} className="text-xs" />
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </Sheet>
        </>
    );
}
