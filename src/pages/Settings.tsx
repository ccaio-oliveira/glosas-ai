import { useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import clsx from "clsx";
import { PayersPanel } from "../components/settings/PayersPanel";

const TABS = [
    { id: 'payers', label: 'Convênios', enabled: true },
    { id: 'users', label: 'Usuários', enabled: false },
    { id: 'billing', label: 'Assinatura', enabled: false },
] as const;

export default function Settings() {
    const [tab, setTab] = useState<(typeof TABS)[number]['id']>('payers');

    return (
        <AppLayout title="Configurações" subtitle="Preferências da sua clínica">
            <div className="mb-4 flex gap-1 border-b border-border">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        disabled={!t.enabled}
                        onClick={() => t.enabled && setTab(t.id)}
                        className={clsx(
                            'border-b-2 px-3 py-2 font-sans text-sm font-medium transition-colors duration-150',
                            !t.enabled && 'cursor-not-allowed text-text-muted/50',
                            t.enabled && tab === t.id && 'border-brand-600 text-brand-600',
                            t.enabled && tab !== t.id && 'border-transparent text-text-secondary hover:text-text-primary',
                        )}
                    >
                        {t.label}
                        {!t.enabled && ' (em breve)'}
                    </button>
                ))}
            </div>

            {tab === 'payers' && <PayersPanel />}
        </AppLayout>
    )
}