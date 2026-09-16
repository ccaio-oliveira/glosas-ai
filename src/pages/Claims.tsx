import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClaim, deleteClaim, listClaims, updateClaim, type Claim, type ClaimInput } from "../lib/claims";
import { formatDate } from "../lib/denials";
import { useCan } from "../contexts/AuthContext";
import { listPayers } from "../lib/payers";
import { useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Link } from "react-router-dom";

const emptyForm: ClaimInput = { payer_id: '', claim_number: '', patient_name: '', service_date: '', total_amount: '' };

const statusLabel: Record<Claim['status'], string> = {
    processing: 'Processando',
    processed: 'Processada',
    error: 'Erro',
};

const statusColor: Record<Claim['status'], string> = {
    processing: 'var(--color-warning-500)',
    processed: 'var(--color-success-500)',
    error: 'var(--color-danger-500)',
};

export default function Claims() {
    const queryClient = useQueryClient();
    const can = useCan();

    const [search, setSearch] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const { data: claims, isLoading } = useQuery({
        queryKey: ['claims', { search, from, to }],
        queryFn: () => listClaims({ search, from, to }),
    });
    const { data: payers } = useQuery({ queryKey: ['payers'], queryFn: listPayers });

    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<ClaimInput>(emptyForm);
    const [showForm, setShowForm] = useState(false);

    const createMutation = useMutation({
        mutationFn: createClaim,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['claims'] });
            closeForm();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: ClaimInput}) => updateClaim(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['claims'] });
            closeForm();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteClaim,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['claims'] }),
    });

    function openCreateForm() {
        setEditingId(null);
        setForm(emptyForm);
        setShowForm(true);
    }

    function openEditForm(claim: Claim) {
        setEditingId(claim.id);
        setForm({
            payer_id: claim.payer_id,
            claim_number: claim.claim_number,
            patient_name: claim.patient_name,
            service_date: claim.service_date ?? '',
            total_amount: claim.total_amount,
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

    const isFormValid = form.payer_id !== '' && form.claim_number && form.patient_name && form.total_amount;

    return (
        <AppLayout
            title="Guias TISS"
            subtitle="Guias cadastradas da sua clínica"
            actions={
                <>
                    <Link to="/payers" className="text-sm text-brand-600 hover:underline">Gerenciar convênios</Link>
                    {can.operate && <Button size="sm" onClick={openCreateForm}>Nova Guia</Button>}
                </>
            }
        >
            {showForm && (
                <Card style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                                Convênio
                            </label>

                            <select
                                value={form.payer_id}
                                onChange={(e) => setForm({ ...form, payer_id: Number(e.target.value) })}
                                style={{ height: 40, border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0 12px', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)' }}
                            >
                                <option value="">Selecione...</option>
                                {payers?.map((payer) => (
                                    <option key={payer.id} value={payer.payer_id}>{payer.name}</option>
                                ))}
                            </select>
                        </div>

                        <Input
                            label="Número da guia"
                            required
                            value={form.claim_number}
                            onChange={(e) => setForm({ ...form, claim_number: e.target.value })}
                        />

                        <Input
                            label="Nome do paciente"
                            required
                            value={form.patient_name}
                            onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                        />

                        <Input
                            label="Data do atendimento"
                            type="date"
                            max={new Date().toISOString().slice(0, 10)}
                            value={form.service_date}
                            onChange={(e) => setForm({ ...form, service_date: e.target.value })}
                        />

                        <Input
                            label="Valor total (R$)"
                            required
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.total_amount}
                            onChange={(e) => setForm({ ...form, total_amount: e.target.value })}
                        />

                        <div style={{ display: 'flex', gap: 8 }}>
                            <Button onClick={handleSubmit} disabled={!isFormValid || createMutation.isPending || updateMutation.isPending}>
                                {editingId ? 'Salvar' : 'Criar'}
                            </Button>

                            <Button variant="ghost" onClick={closeForm}>Cancelar</Button>
                        </div>

                        {(!payers || payers.length === 0) && (
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                                Cadastre um convênio antes de criar uma guia.
                            </p>
                        )}
                    </div>
                </Card>
            )}

            <Card padding="0">
                <div className="flex flex-wrap items-center gap-2.5 border-b border-border p-3.5">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por paciente ou nº da guia..."
                        className="h-9 min-w-[220px] flex-1 rounded-md border-[1.5px] border-border px-3 text-sm outline-none"
                    />

                    <span className="text-sm text-text-secondary">Atendimento de</span>

                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                        className="h-9 rounded-md border-[1.5px] border-border bg-white px-2.5 text-sm text-text-secondary outline-none" />

                    <span className="text-sm text-text-muted">até</span>

                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                        className="h-9 rounded-md border-[1.5px] border-border bg-white px-2.5 text-sm text-text-secondary outline-none" />

                    {(search || from || to) && (
                        <button onClick={() => { setSearch(''); setFrom(''); setTo(''); }}
                            className="text-xs text-brand-600 hover:underline">
                            Limpar
                        </button>
                    )}

                    <span className="text-xs text-text-muted">{claims?.length ?? 0} guia(s)</span>
                </div>

                {isLoading && <p style={{ padding: 20 }}>Carregando...</p>}

                {!isLoading && claims?.length === 0 && (
                    <p style={{ padding: 20 }}>
                        {search || from || to ? 'Nenhuma guia encontrada com esses filtros.' : 'Nenhuma guia cadastrada ainda.'}
                    </p>
                )}

                {!isLoading && claims && claims.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--color-neutral-50)' }}>
                                {['Nº Guia', 'Paciente', 'Convênio', 'Atendimento', 'Valor', 'Status', ''].map((h) => (
                                    <th key={h} style={{ padding: '9px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textAlign: h === 'Valor' ? 'right' : 'left', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {claims.map((claim) => (
                                <tr key={claim.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '10px 16px' }}>{claim.claim_number}</td>
                                    <td style={{ padding: '10px 16px' }}>{claim.patient_name}</td>
                                    <td style={{ padding: '10px 16px' }}>{claim.payer?.name ?? '-'}</td>
                                    <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                                        {formatDate(claim.service_date)}
                                    </td>
                                    <td style={{ padding: '10px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                        {Number(claim.total_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td style={{ padding: '10px 16px' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '11px', fontWeight: 600 }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[claim.status] }} />
                                            {statusLabel[claim.status]}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                                        {can.operate && (
                                            <>
                                                <Button size="xs" variant="ghost" onClick={() => openEditForm(claim)}>Editar</Button>{' '}
                                                <Button size="xs" variant="danger" onClick={() => deleteMutation.mutate(claim.id)}>Excluir</Button>
                                            </>
                                        )}
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