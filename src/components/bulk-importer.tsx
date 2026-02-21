"use client";

import { useState, useRef } from "react";
import { UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet, X, Users } from "lucide-react";

interface BulkImporterProps {
    onImport: (data: any[]) => void;
    isOpen: boolean;
    onClose: () => void;
}

export function BulkImporter({ onImport, isOpen, onClose }: BulkImporterProps) {
    const [dragActive, setDragActive] = useState(false);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const parseCSV = (text: string) => {
        try {
            const lines = text.split("\n").filter(line => line.trim() !== "");
            if (lines.length < 2) {
                setError("O arquivo precisa ter cabeçalho e pelo menos uma linha de dados.");
                return;
            }

            const h = lines[0].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
            const data = lines.slice(1).map(line => {
                // Simple regex to handle commas inside quotes
                const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
                const obj: any = {};
                h.forEach((header, i) => {
                    obj[header] = values[i] ? values[i].replace(/^"|"$/g, "").trim() : "";
                });
                return obj;
            });

            setHeaders(h);
            setParsedData(data);
            setError("");
        } catch (e) {
            setError("Falha ao processar o CSV. Verifique o formato do arquivo.");
        }
    };

    const processFile = (file: File) => {
        if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
            setError("Apenas arquivos .csv são suportados.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text === "string") {
                parseCSV(text);
            }
        };
        reader.readAsText(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const handleConfirm = () => {
        onImport(parsedData);
        onClose();
        setParsedData([]);
        setHeaders([]);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Importação em Lote</h2>
                        <p className="text-sm text-slate-500">Faça upload de um arquivo CSV para cadastrar múltiplos colaboradores.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {parsedData.length === 0 ? (
                    <div>
                        <div
                            className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${dragActive ? "border-[hsl(173,80%,40%)] bg-[hsl(173,80%,40%)]/5" : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                                }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => inputRef.current?.click()}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={handleChange}
                            />
                            <UploadCloud className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                            <p className="text-sm font-semibold text-slate-700 mb-1">
                                Clique para fazer upload ou arraste o arquivo
                            </p>
                            <p className="text-xs text-slate-500">
                                Apenas arquivos .CSV (máx. 5MB)
                            </p>
                        </div>

                        <div className="mt-6 bg-slate-50 rounded-lg p-4 border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Formato Esperado
                            </h4>
                            <p className="text-xs text-slate-500 font-mono bg-white p-2 rounded border border-slate-200 overflow-x-auto whitespace-nowrap">
                                Nome,Email,Telefone,Cargo,Tipo,ValorHora,Pix
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-3 bg-[hsl(173,80%,40%)]/10 text-[hsl(173,80%,35%)] px-4 py-3 rounded-xl mb-6 border border-[hsl(173,80%,40%)]/20">
                            <CheckCircle2 className="h-5 w-5" />
                            <div>
                                <p className="text-sm font-bold">Arquivo processado com sucesso</p>
                                <p className="text-xs opacity-90">{parsedData.length} registros encontrados e validados.</p>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 max-h-60 overflow-y-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr>
                                        {headers.slice(0, 5).map((h, i) => (
                                            <th key={i} className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase">{h}</th>
                                        ))}
                                        {headers.length > 5 && <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase">...</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {parsedData.slice(0, 5).map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50">
                                            {headers.slice(0, 5).map((h, j) => (
                                                <td key={j} className="px-4 py-3 text-slate-600 truncate max-w-[150px]">{row[h]}</td>
                                            ))}
                                            {headers.length > 5 && <td className="px-4 py-3 text-slate-400 italic text-xs">mais {headers.length - 5} colunas</td>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {parsedData.length > 5 && (
                                <div className="bg-slate-50 border-t border-slate-100 p-2 text-center text-xs text-slate-500 font-medium">
                                    Mostrando 5 de {parsedData.length} registros
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => { setParsedData([]); setHeaders([]); }}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[hsl(173,80%,40%)] hover:bg-[hsl(173,80%,35%)] text-white text-sm font-bold rounded-xl shadow-lg shadow-[hsl(173,80%,40%)]/20 transition-all hover:-translate-y-0.5"
                            >
                                <Users className="h-4 w-4" />
                                Importar {parsedData.length} pessoas
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg text-sm border border-red-100">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}
            </div>
        </>
    );
}
