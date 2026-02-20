/**
 * B People — Export System
 * CSV generation and clipboard export for reports.
 */

export function toCSV(headers: string[], rows: (string | number)[][]): string {
    const escape = (v: string | number) => {
        const s = String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
    };

    const lines = [
        headers.map(escape).join(","),
        ...rows.map(row => row.map(escape).join(",")),
    ];

    return lines.join("\n");
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
    const csv = toCSV(headers, rows);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<boolean> {
    if (navigator.clipboard) {
        return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
    }
    // Fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return Promise.resolve(ok);
}

export function formatReportText(title: string, date: string, lines: string[]): string {
    return [
        `*${title}*`,
        `Data: ${date}`,
        "",
        ...lines,
        "",
        `_Gerado por B People em ${new Date().toLocaleString("pt-BR")}_`,
    ].join("\n");
}

// Export types for PIX summary
export function exportPixSummary(
    date: string,
    items: { name: string; type: string; hours: number; total: number; pix: string }[]
) {
    const headers = ["Nome", "Tipo", "Horas", "Total (R$)", "PIX"];
    const rows = items.map(i => [i.name, i.type, i.hours, i.total, i.pix]);
    const filename = `bpeople_pix_${date.replace(/-/g, "")}.csv`;
    downloadCSV(filename, headers, rows);
}

// Export schedule to CSV
export function exportSchedule(
    weekLabel: string,
    items: { name: string; role: string; day: string; shift: string; hours: string }[]
) {
    const headers = ["Nome", "Cargo", "Dia", "Turno", "Horário"];
    const rows = items.map(i => [i.name, i.role, i.day, i.shift, i.hours]);
    const filename = `bpeople_escala_${weekLabel.replace(/\s/g, "_")}.csv`;
    downloadCSV(filename, headers, rows);
}

// Export team roster
export function exportTeamRoster(
    items: { name: string; email: string; role: string; type: string; status: string; unit: string }[]
) {
    const headers = ["Nome", "Email", "Cargo", "Contrato", "Status", "Unidade"];
    const rows = items.map(i => [i.name, i.email, i.role, i.type, i.status, i.unit]);
    downloadCSV("bpeople_equipe.csv", headers, rows);
}
