import { api } from "./api";

export type Severity = 'info' | 'warning' | 'error' | 'critical';

export interface ErrorLog {
    id: number;
    clinic_id: number | null;
    clinic: { id: number; name: string } | null;
    category: string;
    source: string | null;
    message: string;
    context: Record<string, unknown> | null;
    severity: Severity;
    resolved: boolean;
    resolved_at: string | null;
    created_at: string;
}

export interface ErrorLogSummary {
    unresolved_total: number;
    by_severity: Record<Severity, number>;
    by_category: { category: string; total: number }[];
    recurring: { message: string; category: string; severity: Severity; total: number; last_seen: string }[];
    last_24h: number;
}

export const categoryLabels: Record<string, string> = {
    claim_processing: 'Processamento de guias',
    payment: 'Pagamento',
    integration: 'Integração',
    ai: 'IA',
    auth: 'Autenticação',
    general: 'Geral'
};

export const severityStyle: Record<Severity, string> = {
    critical: 'bg-danger-100 text-danger-700',
    error: 'bg-danger-50 text-danger-600',
    warning: 'bg-warning-50 text-warning-600',
    info: 'bg-neutral-100 text-neutral-600',
};

export const severityLabel: Record<Severity, string> = {
    critical: 'Crítico',
    error: 'Erro',
    warning: 'Alerta',
    info: 'Info',
};

export async function listErrorLogs(filters: { category?: string; severity?: string; resolved?: string; search?: string }) {
    const res = await api.get<{ data: ErrorLog[]; total: number }>('/api/admin/error-logs', { params: filters });
    return res.data;
}

export async function getErrorLogSummary() {
    const res = await api.get<ErrorLogSummary>('/api/admin/error-logs/summary');
    return res.data;
}

export async function resolveErrorLog(id: number) {
    const res = await api.post<ErrorLog>(`/api/admin/error-logs/${id}/resolve`);
    return res.data;
}

export async function unresolveErrorLog(id: number) {{
    const res = await api.post<ErrorLog>(`/api/admin/error-logs/${id}/unresolve`);
    return res.data;
}}

export async function resolveErrorGroup(message: string) {
    const res = await api.post<{ resolved: number }>('/api/admin/error-logs/resolve-group', { message });
    return res.data
}