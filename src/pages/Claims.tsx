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
import clsx from "clsx";

const emptyForm: ClaimInput = { payer_id: '', claim_number: '', patient_name: '', service_date: '', total_amount: '' };

const statusLabel: Record<Claim['status'], string> = {
    processing: 'Processando',
    processed: 'Processada',
    error: 'Erro',
};

const statusStyle: Record<Claim['status'], { pill: string; dot: string }> = {
    processing: { pill: 'bg-warning-50 text-warning-600', dot: 'bg-warning-500' },
    processed: { pill: 'bg-success-50 text-success-700', dot: 'bg-success-500' },
    error: { pill: 'bg-danger-50 text-danger-700', dot: 'bg-danger-500' },
};

const COLUMNS = ['Nº Guia', 'Paciente', 'Convênio', 'Atendimento', 'Valor', 'Status', ''];

const fieldClass = 'h-9 rounded-md border-[1.5px] border-border bg-white px-2.5 text-sm text-text-secondary outline-none';

function formatBRL(value: string) {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Extrai a mensagem da API; cai num texto genérico quando não houver. */
function errorMessage(error: unknown) {
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message
        ?? 'Não foi possível concluir a operação.';
}

export default function Claims() {
    const queryClient = useQueryClient();
    const can = useCan();

    const [search, setSearch] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<ClaimInput>(emptyForm);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: claims, isLoading } = useQuery({
        queryKey: ['claims', { search, from, to }],
        queryFn: () => listClaims({ search, from, to }),
    });

    const { data: payers } = useQuery({ queryKey: ['payers'], queryFn: listPayers });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['claims'] });

    const createMutation = useMutation({
        mutationFn: createClaim,
        onSuccess: () => { invalidate(); closeForm(); },
        onError: (e) => setError(errorMessage(e)),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: ClaimInput }) => updateClaim(id, data),
        onSuccess: () => { invalidate(); closeForm(); },
        onError: (e) => setError(errorMessage(e)),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteClaim,
        onSuccess: invalidate,
        onError: (e) => setError(errorMessage(e)),
    });

    function openCreateForm() {
        setEditingId(null);
        setForm(emptyForm);
        setError(null);
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
        setError(null);
        setShowForm(true);
    }

    function closeForm() {
        setEditingId(null);
        setForm(emptyForm);
        setError(null);
        setShowForm(false);
    }

    function handleSubmit() {
        setError(null);

        editingId
            ? updateMutation.mutate({ id: editingId, data: form })
            : createMutation.mutate(form);
    }

    const isFormValid = form.payer_id !== '' && form.claim_number && form.patient_name && form.total_amount;
    const isSaving = createMutation.isPending || updateMutation.isPending;
    const hasFilters = !!(search || from || to);

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
            <div className="flex flex-col gap-4">
                {showForm && (
                    <Card header={
                        <span className="font-semibold text-text-primary">
                            {editingId ? 'Editar guia' : 'Nova guia'}
                        </span>
                    }>
                        <div className="flex max-w-[420px] flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-text-secondary">Convênio</label>

                                <select
                                    value={form.payer_id}
                                    onChange={(e) => setForm({ ...form, payer_id: Number(e.target.value) })}
                                    className="h-10 rounded-md border-[1.5px] border-border bg-white px-3 font-sans text-base outline-none"
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

                            {error && <p className="text-sm text-danger-600">{error}</p>}

                            <div className="flex gap-2">
                                <Button onClick={handleSubmit} disabled={!isFormValid || isSaving}>
                                    {isSaving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}
                                </Button>

                                <Button variant="ghost" onClick={closeForm}>Cancelar</Button>
                            </div>

                            {!payers?.length && (
                                <p className="text-xs text-text-muted">
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

                        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={fieldClass} />

                        <span className="text-sm text-text-muted">até</span>

                        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={fieldClass} />

                        {hasFilters && (
                            <button
                                onClick={() => { setSearch(''); setFrom(''); setTo(''); }}
                                className="text-xs text-brand-600 hover:underline"
                            >
                                Limpar
                            </button>
                        )}

                        <span className="text-xs text-text-muted">{claims?.length ?? 0} guia(s)</span>
                    </div>

                    {!showForm && error && <p className="px-5 pt-4 text-sm text-danger-600">{error}</p>}

                    {isLoading && <p className="p-5 text-text-muted">Carregando...</p>}

                    {!isLoading && !claims?.length && (
                        <p className="p-5 text-text-muted">
                            {hasFilters
                                ? 'Nenhuma guia encontrada com esses filtros.'
                                : 'Nenhuma guia cadastrada ainda. Importe um arquivo em Upload TISS.'}
                        </p>
                    )}

                    {!!claims?.length && (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-neutral-50">
                                        {COLUMNS.map((h) => (
                                            <th
                                                key={h}
                                                className={clsx(
                                                    'whitespace-nowrap border-b border-border px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted',
                                                    h === 'Valor' ? 'text-right' : 'text-left',
                                                )}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {claims.map((claim) => (
                                        <tr key={claim.id} className="border-b border-neutral-50 transition-colors hover:bg-brand-50/40">
                                            <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-xs text-text-muted">
                                                {claim.claim_number}
                                            </td>

                                            <td className="whitespace-nowrap px-3.5 py-2.5 text-sm font-medium text-text-primary">
                                                {claim.patient_name}
                                            </td>

                                            <td className="whitespace-nowrap px-3.5 py-2.5 text-xs text-text-secondary">
                                                {claim.payer?.name ?? '—'}
                                            </td>

                                            <td className="whitespace-nowrap px-3.5 py-2.5 text-xs tabular-nums text-text-muted">
                                                {formatDate(claim.service_date)}
                                            </td>

                                            <td className="whitespace-nowrap px-3.5 py-2.5 text-right text-sm font-semibold tabular-nums text-text-primary">
                                                {formatBRL(claim.total_amount)}
                                            </td>

                                            <td className="px-3.5 py-2.5">
                                                <span className={clsx(
                                                    'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                                    statusStyle[claim.status].pill,
                                                )}>
                                                    <span className={clsx('h-1.5 w-1.5 flex-shrink-0 rounded-full', statusStyle[claim.status].dot)} />
                                                    {statusLabel[claim.status]}
                                                </span>
                                            </td>

                                            <td className="whitespace-nowrap px-3.5 py-2.5 text-right">
                                                {can.operate && (
                                                    <>
                                                        <Button size="xs" variant="ghost" onClick={() => openEditForm(claim)}>Editar</Button>{' '}
                                                        <Button
                                                            size="xs"
                                                            variant="danger"
                                                            disabled={deleteMutation.isPending}
                                                            onClick={() => deleteMutation.mutate(claim.id)}
                                                        >
                                                            Excluir
                                                        </Button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
