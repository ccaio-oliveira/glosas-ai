import { api } from "./api";

export interface Payer {
    id: number;
    payer_id: number;
    name: string;
    ans_registry_code: string | null;
    integration_type: 'manual' | 'tiss_webservice';
    /** Prazo contratual para recorrer, em dias. null = não configurado. */
    appeal_deadline_days: number | null;
    /** De onde veio o prazo (ex.: cláusula do contrato). Texto livre do usuário. */
    appeal_deadline_source: string | null;
    /** ISO 8601. */
    appeal_deadline_updated_at: string | null;
    /** Nome de quem alterou; o backend devolve null para quem só visualiza. */
    appeal_deadline_updated_by: string | null;
}

export interface PayerInput {
    name: string;
    ans_registry_code?: string;
    integration_type: 'manual' | 'tiss_webservice';
    appeal_deadline_days: number | '';
    /** Obrigatória quando há dias; o backend limpa se os dias vierem vazios. */
    appeal_deadline_source: string;
}

/** Erro 422 padrão do Laravel. */
export interface ValidationErrorBody {
    message?: string;
    errors?: Record<string, string[]>;
}

export async function listPayers() {
    const res = await api.get<Payer[]>('/api/payers');
    return res.data;
}

export async function createPayer(data: PayerInput) {
    const res = await api.post<Payer>('/api/payers', data);
    return res.data;
}

export async function updatePayer(id: number, data: PayerInput) {
    const res = await api.put<Payer>(`/api/payers/${id}`, data);
    return res.data;
}

export async function deletePayer(id: number) {
    await api.delete(`/api/payers/${id}`);
}