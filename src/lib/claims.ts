import { api } from "./api";

export interface Claim {
    id: number;
    clinic_id: number;
    payer_id: number;
    payer?: { id: number; name: string; ans_registry_code: string | null };
    claim_number: string;
    patient_name: string;
    total_amount: string;
    status: "processing" | "processed" | "error";
    created_at: string;
    updated_at: string;
}

export interface ClaimInput {
    payer_id: number | '';
    claim_number: string;
    patient_name: string;
    total_amount: string;
}

export async function listClaims() {
    const res = await api.get<Claim[]>('/api/claims');
    return res.data;
}

export async function createClaim(data: ClaimInput) {
    const res = await api.post<Claim>('/api/claims', data);
    return res.data;
}

export async function updateClaim(id: number, data: ClaimInput) {
    const res = await api.put<Claim>(`/api/claims/${id}`, data);
    return res.data;
}

export async function deleteClaim(id: number) {
    await api.delete(`/api/claims/${id}`);
}