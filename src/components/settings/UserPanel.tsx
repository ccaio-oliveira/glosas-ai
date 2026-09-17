import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, useCan } from "../../contexts/AuthContext";
import { inviteUser, listUsers, removeUser, updateUserRole, type ClinicUser, type InviteUserInput } from "../../lib/users";
import { useState } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { ROLE_OPTIONS, roleLabel } from "../../lib/roles";

const emptyForm: InviteUserInput = { name: '', email: '', role: 'biller' };

export function UsersPanel() {
    const queryClient = useQueryClient();
    const can = useCan();
    const { user: currentUser } = useAuth();
    const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: listUsers });

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<InviteUserInput>(emptyForm);
    const [invitedPassword, setInvitedPassword] = useState<string | null>(null);

    const inviteMutation = useMutation({
        mutationFn: inviteUser,
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setInvitedPassword(result.temporary_password);
            setShowForm(false);
            setForm(emptyForm);
        },
    });

    const roleMutation = useMutation({
        mutationFn: ({ id, role }: { id: number; role: ClinicUser['role'] }) => updateUserRole(id, role),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
        onError: (error) => {
            const msg = (error as { response?: { data?: {message?: string } } }).response?.data?.message;
            alert(msg ?? 'Não foi possível concluir a operação.');
        },
    });

    const removeMutation = useMutation({
        mutationFn: removeUser,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
        onError: (error) => {
            const msg = (error as { response?: { data?: {message?: string } } }).response?.data?.message;
            alert(msg ?? 'Não foi possível concluir a operação.');
        },
    });

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="font-sans text-base font-semibold text-text-secondary">Usuários</h3>
                {can.manage_users && <Button size="sm" onClick={() => setShowForm(true)}>+ Convidar</Button>}
            </div>

            {invitedPassword && (
                <Card className="bg-warning-50">
                    <p className="text-sm text-text-primary">
                        Usuário criado. Senha temporária (compartilhe com a pessoa, ela deve trocar no primeiro acesso):
                    </p>

                    <p className="mt-1 font-mono text-sm font-semibold">{invitedPassword}</p>

                    <Button size="xs" variant="ghost" className="mt-2" onClick={() => setInvitedPassword(null)}>
                        Fechar
                    </Button>
                </Card>
            )}

            {showForm && (
                <Card>
                    <div className="flex max-w-[420px] flex-col gap-3">
                        <Input label="Nome" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        <Input label="E-mail" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-text-secondary">Papel</label>

                            <select
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value as ClinicUser['role'] })}
                                className="h-10 rounded-md border-[1.5px] border-border px-3 font-sans text-base"
                            >
                                {ROLE_OPTIONS.map((r) => (
                                    <option key={r} value={r}>{roleLabel[r]}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={() => inviteMutation.mutate(form)} disabled={!form.name || !form.email || inviteMutation.isPending}>
                                Convidar
                            </Button>
                            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                        </div>
                    </div>
                </Card>
            )}

            <Card padding="0">
                {isLoading && <p className="p-5">Carregando...</p>}

                {!isLoading && users?.map((u) => (
                    <div key={u.id} className="flex items-center justify-between border-b border-border px-5 py-3 last:border-b-0">
                        <div>
                            <div className="font-semibold text-text-primary">{u.name}</div>
                            <div className="text-sm text-text-muted">{u.email}</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={u.role}
                                disabled={!can.manage_users || u.id === currentUser?.id}
                                onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value as ClinicUser['role'] })}
                                className="h-8 rounded-md border border-border px-2 text-sm"
                            >
                                {ROLE_OPTIONS.map((r) => (
                                    <option key={r} value={r}>{roleLabel[r]}</option>
                                ))}
                            </select>

                            {can.manage_users && u.id !== currentUser?.id && (
                                <Button size="xs" variant="danger" onClick={() => removeMutation.mutate(u.id)}>Remover</Button>
                            )}
                        </div>
                    </div>
                ))}
            </Card>
        </div>
    );
}