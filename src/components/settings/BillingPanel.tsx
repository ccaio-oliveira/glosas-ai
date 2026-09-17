import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getClinic, updateClinicPlan, type Clinic } from "../../lib/clinic";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { useCan } from "../../contexts/AuthContext";

const PLANS: { id: Clinic['current_plan']; label: string; price: string }[] = [
    { id: 'starter', label: 'Starter', price: 'R$ 299' },
    { id: 'professional', label: 'Professional', price: 'R$ 699' },
    { id: 'enterprise', label: 'Enterprise', price: 'R$ 1.499' },
];

export function BillingPanel() {
    const queryClient = useQueryClient();
    const can = useCan();
    const { data: clinic } = useQuery({ queryKey: ['clinic'], queryFn: getClinic });

    const planMutation = useMutation({
        mutationFn: updateClinicPlan,
        onSuccess: (updated) => queryClient.setQueryData(['clinic'], updated),
    });

    const current = PLANS.find((p) => p.id === clinic?.current_plan);

    return (
        <div className="flex flex-col gap-4">
            <Card className="bg-brand-700 text-white">
                <div className="text-xs font-medium uppercase text-white/60">Plano atual</div>
                <div className="mt-1 text-2xl font-bold">{current?.label ?? '-'}</div>
                <div className="mt-1 text-3xl font-extrabold">
                    {current?.price}
                    <span className="text-base font-normal text-white/70"> /mês</span>
                </div>
            </Card>

            <div className="grid grid-cols-3 gap-4">
                {PLANS.map((plan) => {
                    const isCurrent = plan.id === clinic?.current_plan;

                    return (
                        <Card key={plan.id} style={isCurrent ? { borderColor: 'var(--color-brand-500)' } : undefined}>
                            <div className="text-center">
                                <div className="font-semibold text-text-primary">{plan.label}</div>

                                <div className="mt-1 text-xl font-bold text-text-primary">{plan.price}</div>

                                <Button
                                    size="sm"
                                    variant={isCurrent ? 'secondary' : 'ghost' }
                                    disabled={isCurrent || !can.manage_billing || planMutation.isPending}
                                    onClick={() => planMutation.mutate(plan.id)}
                                    fullWidth
                                    className="mt-3"
                                >
                                    {isCurrent ? 'Plano atual' : 'Mudar'}
                                </Button>
                            </div>
                        </Card>
                    )
                })}
            </div>

            <p className="text-xs text-text-muted">
                Por enquanto a troca de plano é só administrativa (sem cobrança real) - a integração com Stripe
                pra processar pagamento de verdade é um passo separado no roadmap.
            </p>
        </div>
    )
}