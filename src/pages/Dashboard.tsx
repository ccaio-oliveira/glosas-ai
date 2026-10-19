import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { listClaims } from "../lib/claims";
import { listPayers } from "../lib/payers";
import { MetricCard } from "../components/data/MetricCard";
import { formatBRL, getDenialSummary } from "../lib/denials";

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    // Envolvido numa arrow de propósito: passar listClaims direto faria o React Query
    // entregar o próprio contexto como filtros, e o axios o serializaria em query params.
    const { data: claims } = useQuery({ queryKey: ['claims'], queryFn: () => listClaims() });
    const { data: payers } = useQuery({ queryKey: ['payers'], queryFn: listPayers });
    const { data: summary } = useQuery({ queryKey: ['denial-summary'], queryFn: getDenialSummary });

    const totalClaims = claims?.length ?? 0;
    const totalValue = (claims ?? []).reduce((sum, c) => sum + Number(c.total_amount), 0);
    const totalPayers = payers?.length ?? 0;
    // Soma vencendo + vencidas porque é isso que `?deadline=due_soon` filtra
    // na tela de Glosas (ver DenialController@index) — o card precisa bater
    // com o que aparece ao clicar nele.
    const dueCount = (summary?.due_soon_count ?? 0) + (summary?.overdue_count ?? 0);

    return (
        <AppLayout title="Dashboard" subtitle={`Bem-vindo de volta, ${user?.name?.split(' ')[0] ?? ''}`}>
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-3.5">
                    <MetricCard label="Glosas abertas" value={String(summary?.open_count ?? 0)} color="warning" icon="⚑" />

                    <MetricCard label="Valor em risco" value={formatBRL(summary?.open_amount ?? 0)} color="danger" icon="₴" />

                    <div
                        onClick={() => navigate('/denials?deadline=due_soon')}
                        className="cursor-pointer rounded-lg transition-opacity hover:opacity-90"
                    >
                        <MetricCard
                            label="Recursos vencendo o prazo"
                            value={String(dueCount)}
                            color={(summary?.overdue_count ?? 0) > 0 ? 'danger' : 'warning'}
                            icon="⏱"
                            description={(summary?.overdue_count ?? 0) > 0 ? `${summary?.overdue_count} vencida(s)` : 'nos próximos 7 dias'}
                        />
                    </div>

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