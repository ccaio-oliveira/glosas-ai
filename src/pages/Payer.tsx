import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPayer, deletePayer, listPayers, updatePayer, type Payer, type PayerInput } from "../lib/payers";
import { useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";

const emptyForm: PayerInput = { name: '', ans_registry_code: '', integration_type: 'manual' };

export default function Payers() {
    const queryClient = useQueryClient();
    const {data: payers, isLoading } = useQuery({ queryKey: ['payers'], queryFn: listPayers });

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
        }
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
        setEditingId(null);
        setForm(emptyForm);
        setShowForm(false);
    }

    function handleSubmit() {
        if (editingId) {
            updateMutation.mutate({ id: editingId, data: form });
        } else {
            createMutation.mutate(form);
        }
    }

    return (
        <AppLayout
            title="Convênios"
            subtitle="Operadoras vinculadas à sua clínica"
            actions={<Button size="sm" onClick={openCreateForm}>Novo Convênio</Button>}
        >
            {showForm && (
                <Card style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>
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

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                                Tipo de Integração
                            </label>

                            <select
                                value={form.integration_type}
                                onChange={(e) => setForm({ ...form, integration_type: e.target.value as PayerInput['integration_type'] })}
                                style={{ height: 40, border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0 12px', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)' }}
                            >
                                <option value="manual">Manual</option>
                                <option value="tiss_webservice">WebService TISS</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                            <Button onClick={handleSubmit} disabled={!form.name || createMutation.isPending || updateMutation.isPending}>
                                {editingId ? 'Atualizar' : 'Criar'}
                            </Button>

                            <Button variant="ghost" onClick={closeForm}>Cancelar</Button>
                        </div>
                    </div>
                </Card>
            )}
            
            <Card padding="0">
                {isLoading && <p style={{ padding: 20 }}>Carregando...</p>}

                {!isLoading && payers?.length === 0 && <p style={{ padding: 20  }}>Nenhum convênio cadastrado ainda.</p>}

                {!isLoading && payers && payers?.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--color-neutral-50)' }}>
                                {['Nome', 'Registro ANS', 'Integração', ''].map((h) => (
                                    <th key={h} style={{ padding: '9px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'left', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {payers.map((payer) => (
                                <tr key={payer.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '10px 16px' }}>{payer.name}</td>
                                    <td style={{ padding: '10px 16px' }}>{payer.ans_registry_code}</td>
                                    <td style={{ padding: '10px 16px' }}>{payer.integration_type === 'manual' ? 'Manual' : 'WebService TISS'}</td>
                                    <td style={{ padding: '10px 16px' }}>
                                        <Button size="xs" variant="ghost" onClick={() => openEditForm(payer)}>Editar</Button>
                                        <Button size="xs" variant="danger" onClick={() => deleteMutation.mutate(payer.id)}>Excluir</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>
        </AppLayout>
    );
}