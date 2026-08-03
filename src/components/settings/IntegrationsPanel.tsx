import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

const INTEGRATIONS = [
    { code: 'SD', name: 'Simples Dental' },
    { code: 'CL', name: 'Clinicorp' },
    { code: 'AP', name: 'API Própria' },
    { code: 'ID', name: 'iDental' },
];

export function IntegrationsPanel() {
    return (
        <div className="flex flex-col gap-4">
            <h3 className="font-sans text-base font-semibold text-text-primary">Integrações</h3>

            <Card padding="0">
                {INTEGRATIONS.map((integration, i) => (
                    <div key={integration.code} className={`flex items-center justify-between px-5 py-4 ${i > 0 ? 'border-t border-border' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-xs font-semibold text-text-secondary">
                                {integration.code}
                            </div>

                            <div className="font-medium text-text-primary">{integration.name}</div>
                            <div className="text-sm text-text-muted">Em breve</div>
                        </div>
                        
                        <Button size="sm" variant="ghost" disabled>
                            Em breve
                        </Button>
                    </div>
                ))}
            </Card>

            <p className="text-xs text-text-muted">
                Integrações com sistemas de gestão de clínica exigem parceria/API de cada fornecedor - ainda não começamos esse trabalho, por isso nenhuma está disponível de verdade ainda.
            </p>
        </div>
    )
}