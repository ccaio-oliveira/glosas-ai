import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { createPayer, deletePayer, listPayers, updatePayer, type Payer, type PayerInput, type ValidationErrorBody } from "../../lib/payers";
import { formatDate } from "../../lib/denials";
import { useState } from "react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { useCan } from "../../contexts/AuthContext";

const emptyForm: PayerInput = { name: '', ans_registry_code: '', integration_type: 'manual', appeal_deadline_days: '', appeal_deadline_source: '' };

type FieldErrors = Partial<Record<keyof PayerInput, string>>;

const FORM_FIELDS: (keyof PayerInput)[] = ['name', 'ans_registry_code', 'integration_type', 'appeal_deadline_days', 'appeal_deadline_source'];

/**
 * Traduz a falha da API em mensagem por campo (422) ou geral (demais status).
 * Ramificado por status de propósito: uma mensagem única para tudo esconde a causa.
 */
function describeError(error: unknown, action: 'save' | 'delete'): { fields: FieldErrors; general: string | null } {
    const fallback = action === 'save'
        ? 'Não foi possível salvar o convênio. Tente novamente em instantes.'
        : 'Não foi possível excluir o convênio. Tente novamente em instantes.';

    if (!isAxiosError<ValidationErrorBody>(error) || !error.response) {
        return { fields: {}, general: 'Sem conexão com o servidor. Verifique sua internet e tente novamente.' };
    }

    const { status, data } = error.response;

    switch (status) {
        case 401:
        case 419:
            return { fields: {}, general: 'Sua sessão expirou. Entre novamente para continuar.' };
        case 403:
            return { fields: {}, general: 'Você não tem permissão para alterar convênios.' };
        case 404:
            return { fields: {}, general: 'Convênio não encontrado — ele pode ter sido removido. Recarregue a página.' };
        case 409:
            return { fields: {}, general: data?.message ?? 'Conflito ao salvar: os dados mudaram desde que você abriu. Recarregue a página.' };
        case 422: {
            const fields: FieldErrors = {};
            const unmapped: string[] = [];

            for (const [key, messages] of Object.entries(data?.errors ?? {})) {
                const first = messages[0];
                if (!first) continue;

                if ((FORM_FIELDS as string[]).includes(key)) {
                    fields[key as keyof PayerInput] = first;
                } else {
                    unmapped.push(first);
                }
            }

            const general = unmapped.length > 0
                ? unmapped.join(' ')
                : Object.keys(fields).length === 0 ? (data?.message ?? 'Verifique os dados informados.') : null;

            return { fields, general };
        }
        default:
            return { fields: {}, general: fallback };
    }
}

function DeadlineCell({ payer }: { payer: Payer }) {
    if (!payer.appeal_deadline_days) {
        return <span className="text-text-muted">Não configurado</span>;
    }

    return (
        <div className="flex flex-col gap-0.5">
            <span>{payer.appeal_deadline_days} dias corridos</span>

            {payer.appeal_deadline_source
                ? <span className="text-xs text-text-secondary">{payer.appeal_deadline_source}</span>
                : <span className="text-xs text-warning-600">Fonte não informada</span>}

            {payer.appeal_deadline_updated_at && (
                <span className="text-xs text-text-muted">
                    Atualizado em {formatDate(payer.appeal_deadline_updated_at)}
                    {payer.appeal_deadline_updated_by && ` por ${payer.appeal_deadline_updated_by}`}
                </span>
            )}
        </div>
    );
}

export function PayersPanel() {
    const queryClient = useQueryClient();
    const can = useCan();
    const { data: payers, isLoading, isError } = useQuery({ queryKey: ['payers'], queryFn: listPayers });

    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<PayerInput>(emptyForm);
    const [showForm, setShowForm] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    // Prazo cadastrado antes de a fonte existir. Reenviado igual, não exige
    // fonte — senão corrigir o nome do convênio obrigaria a achar o contrato.
    const [legacyDays, setLegacyDays] = useState<number | null>(null);

    // O prazo do convênio alimenta o cálculo de prazo de toda glosa dele:
    // qualquer mudança aqui precisa refletir na lista, no detalhe e no Dashboard.
    function invalidateAffected() {
        queryClient.invalidateQueries({ queryKey: ['payers'] });
        queryClient.invalidateQueries({ queryKey: ['denials'] });
        queryClient.invalidateQueries({ queryKey: ['denial'] });
        queryClient.invalidateQueries({ queryKey: ['denial-summary'] });
    }

    function handleSaveError(error: unknown) {
        const { fields, general } = describeError(error, 'save');
        setFieldErrors(fields);
        setFormError(general);
    }

    const createMutation = useMutation({
        mutationFn: createPayer,
        onSuccess: () => {
            invalidateAffected();
            closeForm();
        },
        onError: handleSaveError,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: PayerInput }) => updatePayer(id, data),
        onSuccess: () => {
            invalidateAffected();
            closeForm();
        },
        onError: handleSaveError,
    });

    const deleteMutation = useMutation({
        mutationFn: deletePayer,
        onMutate: () => setDeleteError(null),
        onSuccess: invalidateAffected,
        onError: (error) => setDeleteError(describeError(error, 'delete').general),
    });

    function resetErrors() {
        setFieldErrors({});
        setFormError(null);
    }

    function openCreateForm() {
        setEditingId(null);
        setForm(emptyForm);
        setLegacyDays(null);
        resetErrors();
        setShowForm(true);
    }

    function openEditForm(payer: Payer) {
        setEditingId(payer.id);
        setForm({
            name: payer.name,
            ans_registry_code: payer.ans_registry_code ?? '',
            integration_type: payer.integration_type,
            appeal_deadline_days: payer.appeal_deadline_days ?? '',
            appeal_deadline_source: payer.appeal_deadline_source ?? '',
        });
        setLegacyDays(payer.appeal_deadline_days && !payer.appeal_deadline_source ? payer.appeal_deadline_days : null);
        resetErrors();
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        resetErrors();
    }

    function updateField<K extends keyof PayerInput>(key: K, value: PayerInput[K]) {
        setForm((current) => ({ ...current, [key]: value }));
        setFieldErrors((current) => ({ ...current, [key]: undefined }));
    }

    function handleSubmit() {
        const source = form.appeal_deadline_source.trim();

        if (form.appeal_deadline_days !== '' && source === '' && form.appeal_deadline_days !== legacyDays) {
            setFieldErrors({ appeal_deadline_source: 'Informe a fonte do prazo — por exemplo, o contrato e a cláusula.' });
            setFormError(null);
            return;
        }

        resetErrors();
        const data: PayerInput = { ...form, appeal_deadline_source: source };

        if (editingId) {
            updateMutation.mutate({ id: editingId, data });
        } else {
            createMutation.mutate(data);
        }
    }

    const saving = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-sans text-base font-semibold text-text-primary">Convênios</h2>

                    <p className="font-sans text-sm text-text-muted">Operadoras vinculadas à sua clínica</p>
                </div>

                {can.operate && <Button size="sm" onClick={openCreateForm}>Novo convênio</Button>}
            </div>

            {showForm && (
                <Card>
                    <div className="flex max-w-[420px] flex-col gap-3">
                        <Input
                            label="Nome"
                            required
                            value={form.name}
                            error={fieldErrors.name}
                            onChange={(e) => updateField('name', e.target.value)}
                        />

                        <Input
                            label="Registro ANS"
                            value={form.ans_registry_code}
                            error={fieldErrors.ans_registry_code}
                            onChange={(e) => updateField('ans_registry_code', e.target.value)}
                        />

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-text-secondary">Tipo de integração</label>

                            <select
                                value={form.integration_type}
                                onChange={(e) => updateField('integration_type', e.target.value as PayerInput['integration_type'])}
                                className="h-10 rounded-md border-[1.5px] border-border px-3 font-sans text-base"
                            >
                                <option value="manual">Manual</option>
                                <option value="tiss_webservice">Webservice TISS</option>
                            </select>

                            {fieldErrors.integration_type && (
                                <span className="text-xs text-danger-500">{fieldErrors.integration_type}</span>
                            )}
                        </div>

                        <Input
                            label="Prazo para recurso (dias corridos)"
                            type="number"
                            min="1"
                            max="365"
                            placeholder="Não configurado"
                            value={form.appeal_deadline_days}
                            error={fieldErrors.appeal_deadline_days}
                            onChange={(e) => updateField('appeal_deadline_days', e.target.value === '' ? '' : Number(e.target.value))}
                        />

                        <Input
                            label="Fonte do prazo"
                            required={form.appeal_deadline_days !== ''}
                            maxLength={255}
                            placeholder="Ex.: Contrato 2025, cláusula 7.3"
                            value={form.appeal_deadline_source}
                            error={fieldErrors.appeal_deadline_source}
                            onChange={(e) => updateField('appeal_deadline_source', e.target.value)}
                        />

                        <p className="text-xs text-text-muted">
                            Informe o prazo do seu contrato com este convênio. O GlosasAI não aplica um prazo padrão.
                            Conta em dias corridos a partir da data em que a glosa foi identificada. Não inclua dados
                            de pacientes.
                        </p>

                        {formError && <p className="text-sm text-danger-600">{formError}</p>}

                        <div className="flex gap-2">
                            <Button onClick={handleSubmit} disabled={!form.name || saving}>
                                {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}
                            </Button>

                            <Button variant="ghost" onClick={closeForm}>Cancelar</Button>
                        </div>
                    </div>
                </Card>
            )}

            {deleteError && <p className="text-sm text-danger-600">{deleteError}</p>}

            <Card padding="0">
                {isLoading && <p className="p-5">Carregando...</p>}

                {isError && <p className="p-5 text-danger-600">Não foi possível carregar os convênios. Recarregue a página.</p>}

                {!isLoading && payers?.length === 0 && <p className="p-5">Nenhum convênio cadastrado ainda.</p>}

                {!isLoading && payers && payers.length > 0 && (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-neutral-50">
                                {['Nome', 'Registro ANS', 'Integração', 'Prazo p/ recurso', ''].map((h) => (
                                    <th key={h} className="border-b border-border px-4 py-2.5 text-left text-[11px] font-semibold uppercase text-text-muted">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {payers.map((payer) => (
                                <tr key={payer.id} className="border-b border-border align-top">
                                    <td className="px-4 py-2.5">{payer.name}</td>
                                    <td className="px-4 py-2.5">{payer.ans_registry_code || '-'}</td>
                                    <td className="px-4 py-2.5">{payer.integration_type === 'manual' ? 'Manual' : 'Webservice TISS'}</td>
                                    <td className="px-4 py-2.5 tabular-nums">
                                        <DeadlineCell payer={payer} />
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                        {can.operate && (
                                            <>
                                                <Button size="xs" variant="ghost" onClick={() => openEditForm(payer)}>Editar</Button>{' '}
                                                <Button
                                                    size="xs"
                                                    variant="danger"
                                                    disabled={deleteMutation.isPending}
                                                    onClick={() => deleteMutation.mutate(payer.id)}
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
                )}
            </Card>
        </div>
    )
}
