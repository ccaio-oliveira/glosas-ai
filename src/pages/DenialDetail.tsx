import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { categoryLabel, downloadAppealPdf, formatBRL, generateAppeal, type GenerateAppealResult, getDenial, saveAppeal, sourceLabel, submitAppeal, updateDenialStatus, formatDate } from "../lib/denials";
import { useEffect, useState } from "react";
import { STATUS_OPTIONS, StatusBadge, type DenialStatus } from "../components/data/StatusBadge";
import { AppLayout } from "../components/layout/AppLayout";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { AppealStatusBadge } from "../components/data/AppealStatusBadge";
import { useCan } from "../contexts/AuthContext";
import { AuditTimeline } from "../components/data/AuditTimeline";

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
    const can = useCan();

    const { data: denial, isLoading } = useQuery({
        queryKey: ['denial', denialId],
        queryFn: () => getDenial(denialId),
    });

    const [text, setText] = useState('');
    const [genInfo, setGenInfo] = useState<GenerateAppealResult | null>(null);
    const [genError, setGenError] = useState<string | null>(null);

    useEffect(() => {
        setText(denial?.appeal?.ai_generated_text ?? '');
    }, [denial?.appeal?.ai_generated_text]);

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['denial', denialId] });
        queryClient.invalidateQueries({ queryKey: ['denials'] });
        queryClient.invalidateQueries({ queryKey: ['denial-summary'] });
        queryClient.invalidateQueries({ queryKey: ['denial-audit', denialId] });
    };

    const saveMutation = useMutation({ mutationFn: () => saveAppeal(denialId, text), onSuccess: invalidate });
    const submitMutation = useMutation({ mutationFn: () => submitAppeal(denialId), onSuccess: invalidate });
    const statusMutation = useMutation({ mutationFn: (status: DenialStatus) => updateDenialStatus(denialId, status), onSuccess: invalidate });
    const pdfMutation = useMutation({ mutationFn: () => downloadAppealPdf(denialId) });

    const generateMutation = useMutation({
        mutationFn: () => generateAppeal(denialId),
        onSuccess: (result) => {
            setText(result.appeal.ai_generated_text ?? '');
            setGenInfo(result);
            setGenError(null);
            invalidate();
        },
        onError: (error) => {
            const status = (error as { response?: { status?: number } }).response?.status;
            setGenError(status === 422 ? 'Nenhum modelo cobre este código ainda - escreva o recurso manualmente por enquanto.' : 'Falha ao gerar o recurso. Verifique o console para detalhes.');
            setGenInfo(null);
        },
    });

    if (isLoading || !denial) {
        return <AppLayout title="Glosas"><p className="text-text-muted">Carregando...</p></AppLayout>
    }

    const savedText = denial.appeal?.ai_generated_text ?? '';
    const isDirty = text !== savedText;

    return (
        <AppLayout
            title={`Glosa #${denial.id}`}
            subtitle={[denial.patient_name, denial.payer_name, denial.service_date ? `Atendimento em ${formatDate(denial.service_date)}` : null].filter(Boolean).join(' · ')}
            actions={
                <>
                    <select
                        value={denial.status}
                        disabled={!can.operate}
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
                <div className="flex flex-col gap-5">
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
                            <Field label="Data do atendimento" value={formatDate(denial.service_date)} />
                            <Field label="Glosa identificada em" value={formatDate(denial.identified_at)} />

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

                    <Card 
                        padding="20px" 
                        header={
                            <span className="font-semibold text-text-primary">Histórico</span>
                        }
                    >
                        <AuditTimeline denialId={denialId} />
                    </Card>
                </div>

                <Card padding="0" className="sticky top-0">
                    <div className="border-b border-border bg-gradient-to-br from-accent-50 to-brand-50 px-4 py-3.5">
                        <span className="text-sm font-semibold text-text-primary">Recurso de defesa</span>
                    </div>

                    <div className="p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {denial.appeal && <AppealStatusBadge status={denial.appeal.status} />}

                                <span className="text-xs text-text-muted">
                                    {denial.appeal?.generation_source ? sourceLabel[denial.appeal.generation_source] : 'Sem recurso gerado'}
                                </span>
                            </div>

                            <Button size="xs" variant="accent" onClick={() => generateMutation.mutate()} disabled={!can.operate || generateMutation.isPending}>
                                {generateMutation.isPending ? 'Gerando...' : 'Gerar recurso'}
                            </Button>
                        </div>

                        {genError && <p className="mb-3 text-xs text-danger-600">{genError}</p>}

                        {genInfo && (
                            <div className="mb-3 flex flex-col gap-2 rounded-md bg-neutral-50 p-3 text-xs">
                                <div className="text-text-secondary">
                                    Modelo aplicado: <strong>{genInfo.template_name}</strong> ({sourceLabel[genInfo.source]})
                                </div>

                                {genInfo.requires_clinical_input && (
                                    <div className="text-warning-600">
                                        Fundamentação legal não cadastrada neste modelo - preencha antes de enviar.
                                    </div>
                                )}

                                {genInfo.attachments.length > 0 && (
                                    <div className="text-text-secondary">
                                        <div className="font-semibold">Anexar:</div>
                                        <ul className="mt-1 list-inside list-disc">
                                            {genInfo.attachments.map((a) => <li key={a}>{a}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            readOnly={!can.operate}
                            placeholder="Escreva o texto do recurso de defesa..."
                            className="h-64 w-full resize-y rounded-md border-[1.5px] border-border p-2.5 font-mono text-xs leading-relaxed outline-none" 
                        />

                        {denial.appeal?.submitted_at && (
                            <p className="mt-2 text-xs text-success-600">
                                Enviado em {new Date(denial.appeal.submitted_at).toLocaleDateString('pt-BR')} (envio manual).
                            </p>
                        )}

                        <p className="mt-2 text-xs text-text-muted">
                            Gerado por modelo determinístico, sem custo de IA. Revise antes de enviar.
                        </p>
                    </div>

                    <div className="flex gap-2 border-t border-border bg-neutral-50 px-4 py-3">
                        <Button
                            size="sm"
                            fullWidth
                            onClick={() => saveMutation.mutate()}
                            disabled={!can.operate || !text.trim() || !isDirty || saveMutation.isPending}
                        >
                            {isDirty ? 'Salvar' : 'Salvo'}
                        </Button>

                        <Button
                            size="sm"
                            variant="ghost"
                            fullWidth
                            onClick={() => pdfMutation.mutate()}
                            disabled={!can.operate || !savedText || pdfMutation.isPending}
                        >
                            {pdfMutation.isPending ? 'Gerando...' : 'PDF'}
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