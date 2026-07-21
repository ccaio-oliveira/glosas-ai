import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPayer, deletePayer, listPayers, updatePayer, type Payer, type PayerInput } from "../../lib/payers";
import { useState } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";

const emptyForm: PayerInput = { name: '', ans_registry_code: '', integration_type: 'manual' };

export function PayersPanel() {
    const queryClient = useQueryClient();
    const { data: payers, isLoading } = useQuery({ queryKey: ['payers'], queryFn: listPayers });

    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<PayerInput>(emptyForm);
    const [showForm, setShowForm] = useState(false);

    const createMutation = useMutation({
        mutationFn: createPayer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payers'] });
            closeForm();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: PayerInput }) => updatePayer(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payers'] });
            closeForm();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deletePayer,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payers'] }),
    });

    function openCreateForm() {
        setEditingId(null);
        setForm(emptyForm);
        setShowForm(true);
    }

    function openEditForm(payer: Payer) {
        setEditingId(payer.id);
        setForm({
            name: payer.name,
            ans_registry_code: payer.ans_registry_code ?? '',
            integration_type: payer.integration_type,
        });
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
    }

    function handleSubmit() {
        if (editingId) {
            updateMutation.mutate({ id: editingId, data: form });
        } else {
            createMutation.mutate(form);
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-sans text-base font-semibold text-text-primary">Convênios</h2>

                    <p className="font-sans text-sm text-text-muted">Operadoras vinculadas à sua clínica</p>
                </div>

                <Button size="sm" onClick={openCreateForm}>Novo convênio</Button>
            </div>

            {showForm && (
                <Card>
                    <div className="flex max-w-[420px] flex-col gap-3">
                        <Input
                            label="Nome"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />

                        <Input
                            label="Registro ANS"
                            value={form.ans_registry_code}
                            onChange={(e) => setForm({ ...form, ans_registry_code: e.target.value })}
                        />

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-text-secondary">Tipo de integração</label>

                            <select
                                value={form.integration_type}
                                onChange={(e) => setForm({ ...form, integration_type: e.target.value as PayerInput['integration_type'] })}
                                className="h-10 rounded-md border-[1.5px] border-border px-3 font-sans text-base"
                            >
                                <option value="manual">Manual</option>
                                <option value="tiss_webservice">Webservice TISS</option>
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={handleSubmit} disabled={!form.name || createMutation.isPending || updateMutation.isPending}>
                                {editingId ? 'Salvar' : 'Criar'}
                            </Button>

                            <Button variant="ghost" onClick={closeForm}>Cancelar</Button>
                        </div>
                    </div>
                </Card>
            )}

            <Card padding="0">
                {isLoading && <p className="p-5">Carregando...</p>}

                {!isLoading && payers?.length === 0 && <p className="p-5">Nenhum convênio cadastrado ainda.</p>}

                {!isLoading && payers && payers.length > 0 && (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-neutral-50">
                                {['Nome', 'Registro ANS', 'Integração', ''].map((h) => (
                                    <th key={h} className="border-b border-border px-4 py-2.5 text-left text-[11px] font-semibold uppercase text-text-muted">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {payers.map((payer) => (
                                <tr key={payer.id} className="border-b border-border">
                                    <td className="px-4 py-2.5">{payer.name}</td>
                                    <td className="px-4 py-2.5">{payer.ans_registry_code || '-'}</td>
                                    <td className="px-4 py-2.5">{payer.integration_type === 'manual' ? 'Manual' : 'Webservice TISS'}</td>
                                    <td className="px-4 py-2.5 text-right">
                                        <Button size="xs" variant="ghost" onClick={() => openEditForm(payer)}>Editar</Button>{' '}
                                        <Button size="xs" variant="danger" onClick={() => deleteMutation.mutate(payer.id)}>Excluir</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    )
}