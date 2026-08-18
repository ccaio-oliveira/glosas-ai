import { api } from "./api";

export type AppealStatus = 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected';

export interface AppealRow {
    id: number;
    denial_id: number;
    claim_number: string | null;
    patient_name: string | null;
    payer_name: string | null;
    procedure_description: string | null;
    reason_code: string | null;
    amount: number;
    status: AppealStatus;
    generation_source: string | null;
    submitted_at: string | null;
    responded_at: string | null;
    days_waiting: number | null;
}

export interface AppealSummary {
    total: number;
    draft: number;
    awaiting_count: number;
    awaiting_amount: number;
    recovered_count: number;
    recovered_amount: number;
    success_rate: number | null;
    avg_response_days: number | null;
}

export const appealStatusLabel: Record<AppealStatus, string> = {
    draft: 'Rascunho',
    submitted: 'Enviado',
    under_review: 'Em análise',
    accepted: 'Recuperado',
    rejected: 'Negado',
};

export const appealStatusStyle: Record<AppealStatus, { pill: string; dot: string }> = {
    draft: { pill: 'bg-neutral-100 text-neutral-600', dot: 'bg-neutral-400' },
    submitted: { pill: 'bg-brand-100 text-brand-700', dot: 'bg-brand-500' },
    under_review: { pill: 'bg-warning-50 text-warning-600', dot: 'bg-warning-500' },
    accepted: { pill: 'bg-success-50 text-success-700', dot: 'bg-success-500' },
    rejected: { pill: 'bg-danger-50 text-danger-700', dot: 'bg-danger-500' },
};

export const originLabel: Record<string, string> = {
    template_code: 'Modelo · código',
    template_group: 'Modelo · grupo',
    template_category: 'Modelo · categoria',
    ai: 'IA',
    manual: 'Manual',
};

export async function listAppeals(filters: { status?: string; search?: string; payer_id?: string }) {
    const res = await api.get<AppealRow[]>('/api/appeals', { params: filters });
    return res.data;
}

export async function getAppealSummary() {
    const res = await api.get<AppealSummary>('/api/appeals/summary');
    return res.data;
}

export async function updateAppealStatus(id: number, status: AppealStatus) {
    const res = await api.put<AppealRow>(`/api/appeals/${id}/status`, { status });
    return res.data;
}