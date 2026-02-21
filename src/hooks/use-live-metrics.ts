"use client";

import { useEffect, useState } from "react";

export interface LiveMetricsData {
    headcount: { total: number; ativo: number; ferias: number; afastado: number; desligado: number };
    burnRateMonthly: number;
    turnoverPct: number;
    recentHires: number;
    openVacancies: number;
    byTipo: { tipo: string; count: number }[];
    byUnit: { unitId: string; count: number }[];
}

const EMPTY: LiveMetricsData = {
    headcount: { total: 0, ativo: 0, ferias: 0, afastado: 0, desligado: 0 },
    burnRateMonthly: 0,
    turnoverPct: 0,
    recentHires: 0,
    openVacancies: 0,
    byTipo: [],
    byUnit: [],
};

export function useLiveMetrics(enabled = true) {
    const [data, setData] = useState<LiveMetricsData>(EMPTY);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled) { setLoading(false); return; }
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/metrics");
                if (!res.ok) throw new Error("API não disponível");
                const json = await res.json();
                if (!cancelled) setData(json.data ?? EMPTY);
            } catch (e: any) {
                if (!cancelled) setError(e.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [enabled]);

    return { data, loading, error };
}
