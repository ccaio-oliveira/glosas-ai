import type { DenialStatus } from "../components/data/StatusBadge";
import { api } from "./api";

export type DenialCategory = 'administrative' | 'technical' | 'linear' | 'unknown';

export interface Denial {
    id: number;
    claim_number: string | null;
    patient_name: string | null;
    payer_name: string | null;
    procedure_code: string | null;
    procedure_description: string | null;
    billed_amount: number;
    paid_amount: number;
    category: DenialCategory;
    reason_code: string | null;
    reason_description: string | null;
    amount: number;
    status: DenialStatus;
    needs_ai_review: boolean;
    identified_at: string | null;
}

export interface Appeal {
    id: number;
    denial_id: number;
    ai_generated_text: string | null;
    generation_source: string | null;
    document_path: string | null;
    status: 'draft' | 'submitted' | 'accepted' | 'rejected';
    submitted_at: string | null;
}

export interface DenialDetail extends Denial {
    appeal: Appeal | null;
}

export interface DenialSummary {
    open_count: number;
    open_amount: number;
    recovered_amount: number;
    total_amount: number;
    needs_ai_review_count: number;
}

export interface GenerateAppealResult {
    appeal: Appeal;
    source: 'template_code' | 'template_group' | 'template_category';
    template_name: string;
    attachments: string[];
    requires_clinical_input: boolean;
    missing_legal_basis: boolean;
}

export const categoryLabel: Record<DenialCategory, string> = {
    administrative: 'Administrativa',
    technical: 'Técnica',
    linear: 'Linear',
    unknown: 'Não classificada',
};

export const sourceLabel: Record<string, string> = {
    template_code: 'Modelo específico do código',
    template_group: 'Modelo do grupo TISS',
    template_category: 'Modelo genérico da categoria',
    ai: 'Gerado por IA',
    manual: 'Escrito manualmente',
};

export async function listDenials(filters: { search?: string; status?: string; category?: string }) {
    const res = await api.get<Denial[]>('/api/denials', { params: filters });
    return res.data;
}

export async function getDenial(id: number) {
    const res = await api.get<DenialDetail>(`/api/denials/${id}`);
    return res.data
}

export async function getDenialSummary() {
    const res = await api.get<DenialSummary>('/api/denials/summary');
    return res.data;
}

export async function updateDenialStatus(id: number, status: DenialStatus) {
    const res = await api.put<Denial>(`/api/denials/${id}`, { status });
    return res.data;
}

export async function saveAppeal(denialId: number, text: string) {
    const res = await api.post<Appeal>(`/api/denials/${denialId}/appeal`, { text });
    return res.data;
}

export async function submitAppeal(denialId: number) {
    const res = await api.post<Appeal>(`/api/denials/${denialId}/appeal/submit`);
    return res.data;
}

export async function generateAppeal(denialId: number) {
    const res = await api.post<GenerateAppealResult>(`/api/denials/${denialId}/appeal/generate`);
    return res.data;
}

export async function downloadAppealPdf(denialId: number) {
    const res = await api.get(`/api/denials/${denialId}/appeal/pdf`, {
        responseType: 'blob'
    });

    const disposition = res.headers['content-disposition'] as string | undefined;
    const filename = disposition?.match(/filename="?([^"]+)"?/)?.[1] ?? `recurso-glosa-${denialId}.pdf`;

    const url = URL.createObjectURL(res.data as Blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

export function formatBRL(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}