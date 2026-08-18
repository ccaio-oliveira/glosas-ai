import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { categoryLabels, getErrorLogSummary, listErrorLogs, resolveErrorGroup, resolveErrorLog, severityLabel, severityStyle, unresolveErrorLog, type Severity } from "../../lib/errorLogs";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { MetricCard } from "../../components/data/MetricCard";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import clsx from "clsx";

const selectClass = 'h-9 rounded-md border-[1.5px] border-border bg-white px-2.5 text-sm text-text-secondary outline-none';

export default function ErrorLogs() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [severity, setSeverity] = useState('');
    const [resolved, setResolved] = useState('false');
    const [expanded, setExpanded] = useState<number | null>(null);

    const { data: summary } = useQuery({
        queryKey: ['error-summary'],
        queryFn: getErrorLogSummary,
        refetchInterval: 30_000,
    });

    const { data: logs, isLoading } = useQuery({
        queryKey: ['error-logs', { search, category, severity, resolved }],
        queryFn: () => listErrorLogs({ search, category, severity, resolved }),
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['error-logs'] });
        queryClient.invalidateQueries({ queryKey: ['error-summary'] });
    };

    const resolveMutation = useMutation({ mutationFn: resolveErrorLog, onSuccess: invalidate });
    const unresolveMutation = useMutation({ mutationFn: unresolveErrorLog, onSuccess: invalidate });
    const groupMutation = useMutation({ mutationFn: resolveErrorGroup, onSuccess: invalidate });

    return (
        <AdminLayout title="Erros do sistema" subtitle="Todas as clínicas · atualiza a cada 30s">
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-3.5">
                    <MetricCard label="Abertos" value={String(summary?.unresolved_total ?? 0)} color="warning" icon="⚑" />
                    <MetricCard label="Críticos" value={String(summary?.by_severity.critical ?? 0)} color="danger" icon="!" />
                    <MetricCard label="Erros" value={String(summary?.by_severity.error ?? 0)} color="danger" icon="×" />
                    <MetricCard label="Últimas 24h" value={String(summary?.last_24h ?? 0)} color="brand" icon="◷" />
                </div>

                {!!summary?.recurring.length && (
                    <Card header={<span className="font-semibold text-text-primary">Erros recorrentes</span>}>
                        <div className="flex flex-col gap-2">
                            {summary.recurring.map((r) => (
                                <div key={r.message} className="flex items-start justify-between gap-4 border-b border-border pb-2 last:border-b-0 last:pb-0">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm text-text-primary">{r.message}</div>

                                        <div className="text-xs text-text-muted">
                                            {categoryLabels[r.category] ?? r.category} · última vez {new Date(r.last_seen).toLocaleString('pt-BR')}
                                        </div>
                                    </div>

                                    <div className="flex flex-shrink-0 items-center gap-2">
                                        <span className="rounded-full bg-danger-50 px-2.5 py-1 text-xs font-bold text-danger-600">{r.total}×</span>

                                        <Button size="xs" variant="ghost" onClick={() => groupMutation.mutate(r.message)}>
                                            Resolver todos
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                <Card padding="0">
                    <div className="flex flex-wrap items-center gap-2.5 border-b border-border p-3.5">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por mensagem ou origem..."
                            className="h-9 min-w-[240px] flex-1 rounded-md border-[1.5px] border-border px-3 text-sm outline-none"
                        />

                        <select value={resolved} onChange={(e) => setResolved(e.target.value)} className={selectClass}>
                            <option value="false">Abertos</option>
                            <option value="true">Resolvidos</option>
                            <option value="">Todos</option>
                        </select>

                        <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={selectClass}>
                            <option value="">Todas as severidades</option>
                            {(['critical', 'error', 'warning', 'info'] as Severity[]).map((s) => (
                                <option key={s} value={s}>{severityLabel[s]}</option>
                            ))}
                        </select>

                        <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
                            <option value="">Todas as categorias</option>
                            {Object.entries(categoryLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {isLoading && <p className="p-5 text-text-muted">Carregando...</p>}
                    {!isLoading && !logs?.data.length && (
                        <p className="p-5 text-text-muted">Nenhum erro com esses filtros. Bom sinal.</p>
                    )}

                    {!!logs?.data.length && (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-neutral-50">
                                    {['Quando', 'Severidade', 'Categoria', 'Clínica', 'Mensagem', ''].map((h) => (
                                        <th key={h} className="whitespace-nowrap border-b border-border px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {logs.data.map((log) => (
                                    <tr key={log.id} className="border-b border-neutral-50 align-top">
                                        <td className="whitespace-nowrap px-3.5 py-2.5 text-xs text-text-muted">
                                            {new Date(log.created_at).toLocaleString('pt-BR')}
                                        </td>
                                        
                                        <td className="px-3.5 py-2.5">
                                            <span className={clsx('whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold', severityStyle[log.severity])}>
                                                {severityLabel[log.severity]}
                                            </span>
                                        </td>

                                        <td className="whitespace-nowrap px-3.5 py-2.5 text-xs text-text-secondary">
                                            {categoryLabels[log.category] ?? log.category}
                                        </td>

                                        <td className="whitespace-nowrap px-3.5 py-2.5 text-xs text-text-secondary">
                                            {log.clinic?.name ?? <span className="text-text-muted">Sistema</span>}
                                        </td>

                                        <td className="px-3.5 py-2.5">
                                            <button
                                                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                                                className="text-left text-sm text-text-primary hover:underline"
                                            >
                                                {log.message}
                                            </button>

                                            {log.source && <div className="font-mono text-[11px] text-text-muted">{log.source}</div>}
                                            {expanded === log.id && log.context && (
                                                <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-neutral-900 p-3 font-mono text-[11px] leading-relaxed text-white">
                                                    {JSON.stringify(log.context, null, 2)}
                                                </pre>
                                            )}
                                        </td>

                                        <td className="whitespace-nowrap px-3.5 py-2.5 text-right">
                                            {log.resolved ? (
                                                <Button size="xs" variant="ghost" onClick={() => unresolveMutation.mutate(log.id)}>Reabrir</Button>
                                            ) : (
                                                <Button size="xs" variant="success" onClick={() => resolveMutation.mutate(log.id)}>Resolver</Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>
            </div>
        </AdminLayout>
    )
}