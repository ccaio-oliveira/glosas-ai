import { api } from './api';

export interface ReportTotals {
    denial_count: number;
    denied_amount: number;
    recovered_amount: number;
    open_amount: number;
    lost_amount: number;
    /** null quando não há glosa no período — "0%" sugeriria fracasso. */
    recovery_rate: number | null;
}

export interface StatusRow {
    status: string;
    label: string;
    count: number;
    amount: number;
    share: number;
}

export interface PayerRow {
    payer_name: string;
    denial_count: number;
    denied_amount: number;
    recovered_amount: number;
    recovery_rate: number;
}

export interface MonthRow {
    month: string;
    label: string;
    denial_count: number;
    denied_amount: number;
    recovered_amount: number;
}

export interface RecoveryReport {
    period: { from: string | null; to: string | null };
    totals: ReportTotals;
    by_status: StatusRow[];
    by_payer: PayerRow[];
    by_month: MonthRow[];
}

export interface ReportFilters {
    from?: string;
    to?: string;
}

export async function getRecoveryReport(filters: ReportFilters = {}) {
    const res = await api.get<RecoveryReport>('/api/reports/recovery', { params: filters });
    return res.data;
}

export async function downloadRecoveryPdf(filters: ReportFilters = {}) {
    // responseType blob é obrigatório: sem ele o arquivo baixa corrompido.
    const res = await api.get('/api/reports/recovery/pdf', {
        params: filters,
        responseType: 'blob',
    });

    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');

    link.href = url;
    link.download = `relatorio-recuperacao-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
