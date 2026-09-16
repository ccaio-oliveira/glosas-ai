import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download, TrendingDown, TrendingUp } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MetricCard } from '../components/data/MetricCard';
import { StatusBadge, type DenialStatus } from '../components/data/StatusBadge';
import {
    downloadRecoveryPdf, getRecoveryReport,
    type MonthRow, type PayerRow, type ReportFilters, type StatusRow,
} from '../lib/reports';
import { formatBRL } from '../lib/denials';

const statusBarColor: Record<string, string> = {
    new: 'bg-neutral-400',
    pending: 'bg-warning-500',
    appealed: 'bg-brand-500',
    recovered: 'bg-success-500',
    rejected: 'bg-danger-500',
};

/** Verde acima de 60%, amarelo acima de 30%, vermelho abaixo — mesma régua do design system. */
function rateColor(rate: number) {
    return rate > 60 ? 'bg-success-500' : rate > 30 ? 'bg-warning-500' : 'bg-danger-500';
}

const inputClass = 'h-9 rounded-md border-[1.5px] border-border bg-white px-2.5 text-sm text-text-secondary outline-none';

export default function Reports() {
    const [filters, setFilters] = useState<ReportFilters>({});
    const [downloading, setDownloading] = useState(false);

    const { data: report, isLoading } = useQuery({
        queryKey: ['recovery-report', filters],
        queryFn: () => getRecoveryReport(filters),
    });

    async function handleDownload() {
        setDownloading(true);

        try {
            await downloadRecoveryPdf(filters);
        } finally {
            setDownloading(false);
        }
    }

    const totals = report?.totals;
    const maxMonth = Math.max(1, ...(report?.by_month ?? []).map((m) => m.denied_amount));

    return (
        <AppLayout
            title="Relatórios"
            subtitle="Análise de performance de recuperação de glosas"
            actions={
                <Button
                    size="sm"
                    variant="ghost"
                    disabled={downloading || !report?.totals.denial_count}
                    leftIcon={<Download size={14} />}
                    onClick={handleDownload}
                >
                    {downloading ? 'Gerando...' : 'Exportar PDF'}
                </Button>
            }
        >
            <div className="flex flex-col gap-4">
                <Card padding="14px">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-sm text-text-secondary">Período</span>

                        <input
                            type="date"
                            value={filters.from ?? ''}
                            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value || undefined }))}
                            className={inputClass}
                        />

                        <span className="text-sm text-text-muted">até</span>

                        <input
                            type="date"
                            value={filters.to ?? ''}
                            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value || undefined }))}
                            className={inputClass}
                        />

                        {(filters.from || filters.to) && (
                            <Button size="sm" variant="ghost" onClick={() => setFilters({})}>
                                Limpar
                            </Button>
                        )}

                        <span className="ml-auto text-xs text-text-muted">
                            {totals?.denial_count ?? 0} glosa(s) no período
                        </span>
                    </div>
                </Card>

                <div className="flex flex-wrap gap-3.5">
                    <MetricCard
                        label="Total glosado"
                        value={formatBRL(totals?.denied_amount ?? 0)}
                        color="danger"
                        icon={<TrendingDown size={18} />}
                        description={totals?.open_amount ? `${formatBRL(totals.open_amount)} ainda em disputa` : undefined}
                    />

                    <MetricCard
                        label="Total recuperado"
                        value={formatBRL(totals?.recovered_amount ?? 0)}
                        color="success"
                        icon={<TrendingUp size={18} />}
                        description={totals?.lost_amount ? `${formatBRL(totals.lost_amount)} negado em definitivo` : undefined}
                    />

                    <MetricCard
                        label="Taxa de recuperação"
                        value={totals?.recovery_rate !== null && totals?.recovery_rate !== undefined ? `${totals.recovery_rate}%` : '—'}
                        color="brand"
                        icon={<BarChart3 size={18} />}
                        description={totals?.denial_count ? undefined : 'sem glosas no período'}
                    />
                </div>

                {isLoading && <p className="text-text-muted">Carregando...</p>}

                {report && !report.totals.denial_count && (
                    <Card>
                        <p className="text-text-muted">
                            Nenhuma glosa no período selecionado. Ajuste as datas ou importe um demonstrativo TISS.
                        </p>
                    </Card>
                )}

                {!!report?.totals.denial_count && (
                    <>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <Card header={<span className="font-semibold text-text-primary">Distribuição por status</span>}>
                                <div className="flex flex-col gap-3">
                                    {report.by_status.map((row: StatusRow) => (
                                        <div key={row.status} className="flex items-center gap-2.5">
                                            <div className="w-[104px] flex-shrink-0">
                                                <StatusBadge status={row.status as DenialStatus} />
                                            </div>

                                            <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-neutral-100">
                                                <div
                                                    className={`h-full rounded-sm ${statusBarColor[row.status] ?? 'bg-neutral-400'}`}
                                                    style={{ width: `${row.share}%` }}
                                                />
                                            </div>

                                            <span className="min-w-[24px] text-right text-sm font-semibold tabular-nums text-text-primary">
                                                {row.count}
                                            </span>

                                            <span className="min-w-[92px] text-right text-xs tabular-nums text-text-muted">
                                                {formatBRL(row.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <Card header={<span className="font-semibold text-text-primary">Desempenho por convênio</span>}>
                                <div className="flex flex-col gap-3">
                                    {report.by_payer.map((row: PayerRow) => (
                                        <div key={row.payer_name} className="flex items-center gap-2.5">
                                            <div
                                                className="w-[104px] flex-shrink-0 truncate text-xs text-text-secondary"
                                                title={row.payer_name}
                                            >
                                                {row.payer_name}
                                            </div>

                                            <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-neutral-100">
                                                <div
                                                    className={`h-full rounded-sm ${rateColor(row.recovery_rate)}`}
                                                    style={{ width: `${row.recovery_rate}%` }}
                                                />
                                            </div>

                                            <span className="min-w-[36px] text-right text-xs font-bold tabular-nums text-text-primary">
                                                {row.recovery_rate}%
                                            </span>

                                            <span className="min-w-[92px] text-right text-xs tabular-nums text-text-muted">
                                                {formatBRL(row.denied_amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        <Card header={<span className="font-semibold text-text-primary">Evolução mensal</span>}>
                            <div className="flex flex-col gap-3">
                                {report.by_month.map((row: MonthRow) => (
                                    <div key={row.month} className="flex items-center gap-2.5">
                                        <div className="w-[70px] flex-shrink-0 text-xs text-text-secondary">{row.label}</div>

                                        <div className="relative h-4 flex-1 overflow-hidden rounded-sm bg-neutral-100">
                                            <div
                                                className="absolute inset-y-0 left-0 rounded-sm bg-danger-500/25"
                                                style={{ width: `${Math.round((row.denied_amount / maxMonth) * 100)}%` }}
                                            />
                                            {/* recuperado sobreposto ao glosado: a barra verde é a fatia que voltou */}
                                            <div
                                                className="absolute inset-y-0 left-0 rounded-sm bg-success-500"
                                                style={{ width: `${Math.round((row.recovered_amount / maxMonth) * 100)}%` }}
                                            />
                                        </div>

                                        <span className="min-w-[92px] text-right text-xs tabular-nums text-text-muted">
                                            {formatBRL(row.denied_amount)}
                                        </span>

                                        <span className="min-w-[92px] text-right text-xs font-semibold tabular-nums text-success-700">
                                            {formatBRL(row.recovered_amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-xs text-text-muted">
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-sm bg-danger-500/25" /> Glosado
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-sm bg-success-500" /> Recuperado
                                </span>
                            </div>
                        </Card>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
