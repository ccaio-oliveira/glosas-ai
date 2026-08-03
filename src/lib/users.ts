import { api } from "./api";

export interface ClinicUser {
    id: number;
    name: string;
    email: string;
    role: 'owner' | 'biller' | 'viewer';
}

export interface InviteUserInput {
    name: string;
    email: string;
    role: ClinicUser['role'];
}

export async function listUsers() {
    const res = await api.get<ClinicUser[]>('/api/users');
    return res.data;
}

export async function inviteUser(data: InviteUserInput) {
    const res = await api.post<{ user: ClinicUser; temporary_password: string }>('/api/users', data);
    return res.data;
}

export async function updateUserRole(id: number, role: ClinicUser['role']) {
    const res = await api.put<ClinicUser>(`/api/users/${id}`, { role });
    return res.data;
}

export async function removeUser(id: number) {
    await api.delete(`/api/users/${id}`);
}