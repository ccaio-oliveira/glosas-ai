import { useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import clsx from "clsx";
import { ClinicPanel } from "../components/settings/ClinicPanel";
import { BillingPanel } from "../components/settings/BillingPanel";
import { UsersPanel } from "../components/settings/UserPanel";
import { IntegrationsPanel } from "../components/settings/IntegrationsPanel";

const TABS = [
    { id: 'clinic', label: 'Dados da Clínica' },
    { id: 'billing', label: 'Plano & Cobrança' },
    { id: 'users', label: 'Usuários' },
    { id: 'integrations', label: 'Integrações' },
] as const;

export default function Settings() {
    const [tab, setTab] = useState<(typeof TABS)[number]['id']>('clinic');

    return (
        <AppLayout title="Configurações" subtitle="Gerencie sua conta, clínica e assinatura">
            <div className="flex gap-6">
                <nav className="flex w-56 flex-shrink-0 flex-col gap-1">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={clsx(
                                'rounded-md px-3 py-2 text-left font-sans text-sm font-medium transition-colors duration-150',
                                tab === t.id ? 'bg-brand-50 text-brand-700' : 'text-text-secondary hover:bg-neutral-50',
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </nav>

                <div className="flex-1">
                    {tab === 'clinic' && <ClinicPanel />}
                    {tab === 'billing' && <BillingPanel />}
                    {tab === 'users' && <UsersPanel />}
                    {tab === 'integrations' && <IntegrationsPanel />}
                </div>
            </div>
        </AppLayout>
    )
}