import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { categoryLabel, formatBRL, getDenial, saveAppeal, submitAppeal, updateDenialStatus } from "../lib/denials";
import { useEffect, useState } from "react";
import { STATUS_OPTIONS, StatusBadge, type DenialStatus } from "../components/data/StatusBadge";
import { AppLayout } from "../components/layout/AppLayout";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

function Field({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
    return (
        <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                {label}
            </div>

            <div className={[
                highlight ? 'text-lg font-bold text-danger-600' : 'text-sm text-text-primary',
                mono ? 'font-mono' : '',
            ].join(' ')}>
                {value}
            </div>
        </div>
    );
}

export default function DenialDetail() {
    const { id } = useParams();
    const denialId = Number(id);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: denial, isLoading } = useQuery({
        queryKey: ['denial', denialId],
        queryFn: () => getDenial(denialId),
    });

    const [text, setText] = useState('');

    useEffect(() => {
        setText(denial?.appeal?.ai_generated_text ?? '');
    }, [denial?.appeal?.ai_generated_text]);

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['denial', denialId] });
        queryClient.invalidateQueries({ queryKey: ['denials'] });
        queryClient.invalidateQueries({ queryKey: ['denial-summary'] });
    };

    const saveMutation = useMutation({ mutationFn: () => saveAppeal(denialId, text), onSuccess: invalidate });
    const submitMutation = useMutation({ mutationFn: () => submitAppeal(denialId), onSuccess: invalidate });
    const statusMutation = useMutation({ mutationFn: (status: DenialStatus) => updateDenialStatus(denialId, status), onSuccess: invalidate });

    if (isLoading || !denial) {
        return <AppLayout title="Glosas"><p className="text-text-muted">Carregando...</p></AppLayout>
    }

    const savedText = denial.appeal?.ai_generated_text ?? '';
    const isDirty = text !== savedText;

    return (
        <AppLayout
            title={`Glosa #${denial.id}`}
            subtitle={[denial.patient_name, denial.payer_name, denial.identified_at ? new Date(denial.identified_at + 'T00:00:00').toLocaleDateString('pt-BR') : null].filter(Boolean).join(' · ')}
            actions={
                <>
                    <select
                        value={denial.status}
                        onChange={(e) => statusMutation.mutate(e.target.value as DenialStatus)}
                        className="h-8 rounded-md border border-border px-2 text-sm"
                    >
                        {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>

                    <Button size="sm" variant="ghost" onClick={() => navigate('/denials')}>Voltar</Button>
                </>
            }
        >
            <div className="grid grid-cols-[1fr_380px] items-start gap-5">
                <Card
                    padding="20px"
                    header={
                        <>
                            <span className="font-semibold text-text-primary">Informações da glosa</span>
                            <StatusBadge status={denial.status} />
                        </>
                    }
                >
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Nº da guia" value={denial.claim_number ?? '-'} mono />
                        <Field label="Paciente" value={denial.patient_name ?? '-'} />
                        <Field label="Procedimento" value={denial.procedure_description ?? '-'} />
                        <Field label="Código TUSS" value={denial.procedure_code ?? '-'} mono />
                        <Field label="Convênio" value={denial.payer_name ?? '-'} />
                        <Field label="Tipo de glosa" value={categoryLabel[denial.category]} />
                        <Field label="Valor cobrado" value={formatBRL(denial.billed_amount)} />
                        <Field label="Valor glosado" value={formatBRL(denial.amount)} highlight />

                        <div className="col-span-2">
                            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                                Motivo da glosa
                            </div>

                            <div className="rounded-md border-1-[3px] border-danger-500 bg-danger-50 px-3 py-2 text-sm text-danger-600">
                                {denial.reason_code && <span className="mr-2 font-mono font-semibold">{denial.reason_code}</span>}
                                {denial.reason_description ?? 'Não informado'}
                            </div>

                            {denial.needs_ai_review && (
                                <p className="mt-2 text-xs text-warning-600">
                                    Código não catalogado na Tabela 38 - precisa de análise antes de contestar.
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                <Card padding="0" style={{ position: 'sticky', top: 0 }}>
                    <div className="border-b border-border bg-gradient-to-br from-accent-50 to-brand-50 px-4 py-3.5">
                        <span className="text-sm font-semibold text-text-primary">Recurso de defesa</span>
                    </div>

                    <div className="p-4">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Escreva o texto do recurso de defesa..."
                            className="h-64 w-full resize-y rounded-md border-[1.5px] border-border p-2.5 font-mono text-xs leading-relaxed outline-none" 
                        />

                        {denial.appeal?.submitted_at && (
                            <p className="mt-2 text-xs text-success-600">
                                Enviado em {new Date(denial.appeal.submitted_at).toLocaleDateString('pt-BR')} (envio manual).
                            </p>
                        )}

                        <p className="mt-2 text-xs text-text-muted">
                            A geração automática com IA é o próximo passo - vai preencher este mesmo campo.
                        </p>
                    </div>

                    <div className="flex gap-2 border-t border-border bg-neutral-50 px-4 py-3">
                        <Button
                            size="sm"
                            fullWidth
                            onClick={() => saveMutation.mutate()}
                            disabled={!text.trim() || !isDirty || saveMutation.isPending}
                        >
                            {isDirty ? 'Salvar' : 'Salvo'}
                        </Button>
                        
                        <Button
                            size="sm"
                            variant="success"
                            fullWidth
                            onClick={() => submitMutation.mutate()}
                            disabled={!savedText || !isDirty || submitMutation.isPending || denial.appeal?.status === 'submitted'}
                        >
                            {denial.appeal?.status === 'submitted' ? 'Enviado' : 'Marcar enviado'}
                        </Button>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}