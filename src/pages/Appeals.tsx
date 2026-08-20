import { useNavigate } from "react-router-dom";
import { appealStatusLabel, getAppealSummary, listAppeals, originLabel, updateAppealStatus, type AppealStatus } from "../lib/appeals";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { MetricCard } from "../components/data/MetricCard";
import { CalendarClock, Clock, FileCheck2, TrendingUp } from "lucide-react";
import { formatBRL } from "../lib/denials";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useCan } from "../contexts/AuthContext";

const selectClass = 'h-9 rounded-md border-[1.5px] border-border bg-white px-2.5 text-sm text-text-secondary outline-none';
const STATUSES: AppealStatus[] = ['draft', 'submitted', 'under_review', 'accepted', 'rejected'];

export default function Appeals() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const can = useCan();

    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');

    const { data: summary } = useQuery({ queryKey: ['appeal-summary'], queryFn: getAppealSummary });
    const { data: appeals, isLoading } = useQuery({
        queryKey: ['appeals', { search, status }],
        queryFn: () => listAppeals({ search, status }),
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: AppealStatus }) => updateAppealStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appeals'] });
            queryClient.invalidateQueries({ queryKey: ['appeal-summary'] });
            queryClient.invalidateQueries({ queryKey: ['denials'] });
            queryClient.invalidateQueries({ queryKey: ['denial-summary'] });
        },
    });

    return (
        <AppLayout title="Recursos" subtitle="Contestações geradas e seu andamento nos convênios">
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-3.5">
                    <MetricCard label="Recursos gerados" value={String(summary?.total ?? 0)} color="brand" icon={<FileCheck2 size={18} />} />

                    <MetricCard
                        label="Aguardando resposta"
                        value={String(summary?.awaiting_count ?? 0)}
                        color="warning"
                        icon={<Clock size={18} />}
                        description={summary?.awaiting_amount ? formatBRL(summary.awaiting_amount) + ' em jogo' : undefined}
                    />

                    <MetricCard
                        label="Recuperado"
                        value={formatBRL(summary?.recovered_amount ?? 0)}
                        color="success"
                        icon={<TrendingUp size={18} />}
                        description={summary?.success_rate !== null && summary?.success_rate !== undefined
                        ? `taxa de êxito de ${summary.success_rate}%` : 'sem respostas ainda'}
                    />

                    <MetricCard
                        label="Prazo médio de resposta"
                        value={summary?.avg_response_days !== null && summary?.avg_response_days !== undefined
                        ? `${summary.avg_response_days} dias` : '—'}
                        color="accent"
                        icon={<CalendarClock size={18} />}
                    />
                </div>

                <Card padding="0">
                    <div className="flex flex-wrap items-center gap-2.5 border-b border-border p-3.5">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por paciente ou nº da guia..."
                            className="h-9 min-w-[220px] flex-1 rounded-md border-[1.5px] border-border px-3 text-sm outline-none"
                        />

                        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
                            <option value="">Todos os status</option>
                            <option value="awaiting">Aguardando resposta</option>
                            {STATUSES.map((s) => <option key={s} value={s}>{appealStatusLabel[s]}</option>)}
                        </select>

                        <span className="text-xs text-text-muted">{appeals?.length ?? 0} recurso(s)</span>
                    </div>

                    {isLoading && <p className="p-5 text-text-muted">Carregando...</p>}
                    {!isLoading && !appeals?.length && (
                        <p className="p-5 text-text-muted">Nenhum recurso ainda. Gere um a partir de uma glosa.</p>
                    )}

                    {!!appeals?.length && (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-neutral-50">
                                    {['Nº Guia', 'Paciente', 'Convênio', 'Origem', 'Enviado', 'Espera', 'Valor', 'Status', ''].map((h) => (
                                        <th key={h} className={`whitespace-nowrap border-b border-border px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted ${h === 'Valor' || h === 'Espera' ? 'text-right' : 'text-left'}`}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {appeals.map((a) => (
                                    <tr key={a.id} className="border-b border-neutral-50 hover:bg-brand-50/40">
                                        <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-xs text-text-muted">{a.claim_number}</td>
                                        <td className="whitespace-nowrap px-3.5 py-2.5 text-sm font-medium text-text-primary">{a.patient_name}</td>
                                        <td className="whitespace-nowrap px-3.5 py-2.5 text-xs text-text-secondary">{a.payer_name}</td>
                                        
                                        <td className="whitespace-nowrap px-3.5 py-2.5 text-xs text-text-secondary">
                                            {a.generation_source ? originLabel[a.generation_source] ?? a.generation_source : '—'}
                                        </td>
                                        
                                        <td className="whitespace-nowrap px-3.5 py-2.5 text-xs text-text-muted">
                                            {a.submitted_at ? new Date(a.submitted_at + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                                        </td>
                                        
                                        <td className="whitespace-nowrap px-3.5 py-2.5 text-right text-xs tabular-nums text-text-muted">
                                            {a.days_waiting !== null ? `${a.days_waiting}d` : '—'}
                                        </td>
                                        
                                        <td className="whitespace-nowrap px-3.5 py-2.5 text-right text-sm font-semibold tabular-nums text-text-primary">
                                            {formatBRL(a.amount)}
                                        </td>
                                        
                                        <td className="px-3.5 py-2.5">
                                            <select
                                                value={a.status}
                                                disabled={!can.operate}
                                                onChange={(e) => statusMutation.mutate({ id: a.id, status: e.target.value as AppealStatus })}
                                                className="h-7 rounded-md border border-border bg-white px-1.5 text-xs"
                                            >
                                                {STATUSES.map((s) => <option key={s} value={s}>{appealStatusLabel[s]}</option>)}
                                            </select>
                                        </td>
                                        
                                        <td className="whitespace-nowrap px-3.5 py-2.5 text-right">
                                            <Button size="xs" variant="ghost" onClick={() => navigate(`/denials/${a.denial_id}`)}>Abrir</Button>
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
    )
}