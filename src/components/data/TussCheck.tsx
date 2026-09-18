import { CheckCircle2, CircleAlert, CircleX } from 'lucide-react';
import type { TussComparison } from '../../lib/denials';

/**
 * O que a clínica mandou vs. a Tabela 22. Código inexistente quase sempre é a
 * própria causa da glosa; descrição divergente é motivo comum de recusa.
 */
export function TussCheck({ code, tuss }: { code: string | null; tuss: TussComparison | null }) {
    if (!code || !tuss) return null;

    if (!tuss.found) {
        return (
            <div className="flex items-start gap-2 rounded-md bg-danger-50 px-3 py-2">
                <CircleX size={15} className="mt-0.5 flex-shrink-0 text-danger-500" />
                <div className="text-sm text-danger-700">
                    O código <span className="font-mono font-semibold">{code}</span> não existe na Tabela 22 do TUSS.
                    <span className="block text-xs text-danger-600">
                        Isso sozinho costuma explicar a glosa — confira o código antes de recorrer.
                    </span>
                </div>
            </div>
        );
    }

    if (tuss.description_matches) {
        return (
            <div className="flex items-start gap-2 text-xs text-text-muted">
                <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0 text-success-500" />
                <span>
                    Confere com a Tabela 22: <span className="text-text-secondary">{tuss.official_description}</span>
                </span>
            </div>
        );
    }

    return (
        <div className="flex items-start gap-2 rounded-md bg-warning-50 px-3 py-2">
            <CircleAlert size={15} className="mt-0.5 flex-shrink-0 text-warning-500" />
            <div className="text-sm text-warning-600">
                A descrição enviada difere da oficial da Tabela 22.
                <span className="mt-1 block text-xs text-text-secondary">
                    Oficial: <span className="font-medium text-text-primary">{tuss.official_description}</span>
                </span>
            </div>
        </div>
    );
}
