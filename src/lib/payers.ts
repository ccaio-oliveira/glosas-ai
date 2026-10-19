import { api } from "./api";

export interface Payer {
    id: number;
    payer_id: number;
    name: string;
    ans_registry_code: string | null;
    integration_type: 'manual' | 'tiss_webservice';
    /** Prazo contratual para recorrer, em dias. null = não configurado. */
    appeal_deadline_days: number | null;
}

export interface PayerInput {
    name: string;
    ans_registry_code?: string;
    integration_type: 'manual' | 'tiss_webservice';
    appeal_deadline_days: number | '';
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