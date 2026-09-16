import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { listClaims } from "../lib/claims";
import { listPayers } from "../lib/payers";
import { MetricCard } from "../components/data/MetricCard";
import { formatBRL, getDenialSummary } from "../lib/denials";

export default function Dashboard() {
    const { user } = useAuth();
    // Envolvido numa arrow de propósito: passar listClaims direto faria o React Query
    // entregar o próprio contexto como filtros, e o axios o serializaria em query params.
    const { data: claims } = useQuery({ queryKey: ['claims'], queryFn: () => listClaims() });
    const { data: payers } = useQuery({ queryKey: ['payers'], queryFn: listPayers });
    const { data: summary } = useQuery({ queryKey: ['denial-summary'], queryFn: getDenialSummary });

    const totalClaims = claims?.length ?? 0;
    const totalValue = (claims ?? []).reduce((sum, c) => sum + Number(c.total_amount), 0);
    const totalPayers = payers?.length ?? 0;

    return (
        <AppLayout title="Dashboard" subtitle={`Bem-vindo de volta, ${user?.name?.split(' ')[0] ?? ''}`}>
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-3.5">
                    <MetricCard label="Glosas abertas" value={String(summary?.open_count ?? 0)} color="warning" icon="⚑" />

                    <MetricCard label="Valor em risco" value={formatBRL(summary?.open_amount ?? 0)} color="danger" icon="₴" />

                    <MetricCard label="Valor recuperado" value={formatBRL(summary?.recovered_amount ?? 0)} color="success" icon="◈" />

                    <MetricCard label="Guias cadastradas" value={String(totalClaims)} color="brand" icon="▦" />

                    <MetricCard
                        label="Valor total em guias"
                        value={totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        color="accent"
                        icon="₴"
                    />
                    
                    <MetricCard label="Convênios ativos" value={String(totalPayers)} color="success" icon="◈" />
                </div>
            </div>
        </AppLayout>
    )
}