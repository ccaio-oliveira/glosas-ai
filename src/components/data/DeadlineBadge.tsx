import { cn } from '../../lib/cn';
import { formatDate, type AppealDeadline } from '../../lib/denials';

function label(deadline: AppealDeadline): string {
    const left = deadline.days_left ?? 0;

    switch (deadline.status) {
        case 'overdue':
            return left === -1 ? 'Venceu ontem' : `Venceu há ${Math.abs(left)} dias`;
        case 'due_soon':
            return left === 0 ? 'Vence hoje' : left === 1 ? 'Vence amanhã' : `Vence em ${left} dias`;
        case 'on_track':
            return `${left} dias`;
        case 'not_configured':
            return 'Sem prazo';
        default:
            return '—';
    }
}

const style: Record<AppealDeadline['status'], string> = {
    overdue: 'bg-danger-50 text-danger-700 font-semibold',
    due_soon: 'bg-warning-50 text-warning-600 font-semibold',
    on_track: 'text-text-secondary',
    not_configured: 'text-text-muted',
    not_applicable: 'text-text-muted',
};

function tooltip(deadline: AppealDeadline): string | undefined {
    if (deadline.status === 'not_configured') {
        return 'Prazo não cadastrado — consulte o contrato com o convênio.';
    }

    if (!deadline.due_date) return undefined;

    const base = `Vence em ${formatDate(deadline.due_date)}`;

    return deadline.deadline_days ? `${base} · prazo de ${deadline.deadline_days} dias corridos` : base;
}

/**
 * Prazo para recurso numa célula de tabela. O `title` mostra a data exata —
 * a contagem em dias é o que se lê de relance, a data é o que se confere.
 */
export function DeadlineBadge({ deadline }: { deadline: AppealDeadline }) {
    const pill = deadline.status === 'overdue' || deadline.status === 'due_soon';

    return (
        <span
            title={tooltip(deadline)}
            className={cn('whitespace-nowrap text-xs tabular-nums', pill && 'rounded px-1.5 py-0.5', style[deadline.status])}
        >
            {label(deadline)}
        </span>
    );
}
