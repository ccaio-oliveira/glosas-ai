import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../contexts/AuthContext";
import { listClaims } from "../lib/claims";
import { listPayers } from "../lib/payers";
import { MetricCard } from "../components/data/MetricCard";

export default function Dashboard() {
    const { user } = useAuth();
    const { data: claims } = useQuery({ queryKey: ['claims'], queryFn: listClaims });
    const { data: payers } = useQuery({ queryKey: ['payers'], queryFn: listPayers });

    const totalClaims = claims?.length ?? 0;
    const totalValue = (claims ?? []).reduce((sum, c) => sum + Number(c.total_amount), 0);
    const totalPayers = payers?.length ?? 0;

    return (
        <AppLayout title="Dashboard" subtitle={`Bem-vindo de volta, ${user?.name?.split(' ')[0] ?? ''}`}>
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-3.5">
                    <MetricCard label="Guias cadastradas" value={String(totalClaims)} color="brand" icon="▦" />

                    <MetricCard
                        label="Valor total em guias"
                        value={totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        color="accent"
                        icon="₴"
                    />
                    
                    <MetricCard label="Convênios ativos" value={String(totalPayers)} color="success" icon="◈" />
                </div>

                <p className="text-sm text-text-muted">
                    Métricas de glosas (abertas, taxa de recuperação, valor em risco) aparecem aqui assim que o cadastro de itens e glosas por guia estiver pronto
                </p>
            </div>
        </AppLayout>
    )
}