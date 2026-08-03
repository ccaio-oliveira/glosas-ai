import { api } from "./api";

export interface Clinic {
    id: number;
    name: string;
    cnpj: string;
    cro: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    current_plan: 'starter' | 'professional' | 'enterprise';
    status: string;
}

export interface ClinicInput {
    name: string;
    cnpj: string;
    cro?: string;
    phone?: string;
    email?: string;
    address?: string;
}

export async function getClinic() {
    const res = await api.get<Clinic>('/api/clinic');
    return res.data;
}

export async function updateClinic(data: ClinicInput) {
    const res = await api.put<Clinic>('/api/clinic', data);
    return res.data;
}

export async function updateClinicPlan(plan: Clinic['current_plan']) {
    const res = await api.put<Clinic>('/api/clinic/plan', { plan });
    return res.data;
}