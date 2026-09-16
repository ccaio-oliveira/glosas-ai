import { useNavigate } from "react-router-dom";
import { categoryLabel, formatBRL, formatDate, listDenials, type DenialCategory } from "../lib/denials";
import { useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../components/ui/Card";
import { STATUS_OPTIONS, StatusBadge } from "../components/data/StatusBadge";
import clsx from "clsx";

const CATEGORY_STYLE: Record<DenialCategory, string> = {
    administrative: 'bg-warning-50 text-warning-600',
    technical: 'bg-brand-50 text-brand-600',
    linear: 'bg-accent-50 text-accent-600',
    unknown: 'bg-neutral-100 text-neutral-600',
};

const selectClass = 'h-9 rounded-md border-[1.5px] border-border bg-white px-2.5 text-sm text-text-secondary outline-none';

export default function Denials() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [category, setCategory] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const { data: denials, isLoading } = useQuery({
        queryKey: ['denials', { search, status, category, from, to }],
        queryFn: () => listDenials({ search, status, category, from, to }),
    });

    const total = (denials ?? []).reduce((sum, d) => sum + d.amount, 0);

    return (
        <AppLayout
            title="Glosas"
            subtitle={denials ? `${denials.length} glosas · ${formatBRL(total)}` : undefined}
        >
            <Card padding="0">
                <div className="flex items-center gap-2.5 border-border p-3.5">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por paciente, guia, convênio..."
                        className="h-9 flex-1 rounded-md border-[1.5px] border-border px-3 text-sm outline-none"
                    />

                    <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
                        <option value="">Todos os status</option>
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>

                    <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
                        <option value="">Todos os tipos</option>
                        <option value="administrative">Administrativo</option>
                        <option value="technical">Técnica</option>
                        <option value="linear">Linear</option>
                        <option value="unknown">Não classificada</option>
                    </select>

                    <span className="text-xs text-text-muted">{denials?.length ?? 0} resultado(s)</span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-3.5 pb-3.5">
                    <span className="text-sm text-text-secondary">Atendimento de</span>

                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={selectClass} />

                    <span className="text-sm text-text-muted">até</span>

                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={selectClass} />

                    {(from || to) && (
                        <button
                            onClick={() => { setFrom(''); setTo(''); }}
                            className="text-xs text-brand-600 hover:underline"
                        >
                            Limpar datas
                        </button>
                    )}
                </div>

                {isLoading && <p className="p-5 text-text-muted">Carregando...</p>}

                {!isLoading && !denials?.length && (
                    <p className="p-5 text-text-muted">Nenhuma glosa encontrada. Importe um arquivo em Upload TISS.</p>
                )}

                {!!denials?.length && (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-neutral-50">
                                    {['Nº Guia', 'Paciente', 'Procedimento', 'Convênio', 'Tipo', 'Atendimento', 'Valor', 'Status'].map((h) => (
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
                                {denials.map((denial) => (
                                    <tr
                                        key={denial.id}
                                        onClick={() => navigate(`/denials/${denial.id}`)}
                                        className="cursor-pointer border-b border-neutral-50 transition-colors hover:bg-brand-50"
                                    >
                                        <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-xs text-text-muted">{denial.claim_number}</td>
                                        <td className="whitespace-nowrap px-3.5 py-2.5 font-medium text-sm text-text-primary">{denial.patient_name}</td>
                                        <td className="max-w-[200px] truncate px-3.5 py-2.5 text-xs text-text-secondary">{denial.procedure_description}</td>
                                        <td className="whitespace-nowrap px-3.5 py-2.5 text-xs text-text-secondary">{denial.payer_name}</td>
                                        <td className="px-3.5 py-2.5">
                                            <span className={clsx('whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-semibold', CATEGORY_STYLE[denial.category])}>
                                                {categoryLabel[denial.category]}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-3.5 py-2.5 text-xs text-text-muted">
                                            {formatDate(denial.service_date)}
                                        </td>
                                        <td className="whitespace-nowrap px-3.5 py-2.5 text-right text-sm font-semibold tabular-nums text-text-primary">
                                            {formatBRL(denial.amount)}
                                        </td>
                                        <td className="px-3.5 py-2.5">
                                            <StatusBadge status={denial.status} size="sm" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </AppLayout>
    )
}