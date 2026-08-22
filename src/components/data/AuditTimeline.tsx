import { useQuery } from "@tanstack/react-query";
import { getDenialAudit } from "../../lib/denials";
import clsx from "clsx";

const dotColor: Record<string, string> = {
    'appeal.generated': 'bg-accent-500',
    'appeal.submitted': 'bg-success-500',
    'appeal.status_changed': 'bg-brand-500',
    'appeal.text_edited': 'bg-neutral-400',
    'denial.status_changed': 'bg-brand-500',
    'denial.deleted_by_reprocess': 'bg-danger-500',
};

export function AuditTimeline({ denialId }: { denialId: number }) {
    const { data: entries, isLoading } = useQuery({
        queryKey: ['denial-audit', denialId],
        queryFn: () => getDenialAudit(denialId),
    });

    if (isLoading) return <p className="text-sm text-text-muted">Carregando histórico...</p>

    if (!entries?.length) {
        return <p className="text-sm text-text-muted">Nenhuma ação registrada nesta glosa ainda.</p>;
    }
    
    return (
        <ol className="flex flex-col gap-3">
            {entries.map((e) => (
                <li key={e.id} className="flex gap-3">
                    <span className={clsx('mt-1.5 h-2 w-2 flex-shrink-0 rounded-full', dotColor[e.action] ?? 'bg-neutral-400')} />

                    <div className="min-w-0">
                        <div className="text-sm text-text-primary">{e.summary}</div>

                        <div className="text-xs text-text-muted">
                            {e.user_name} · {new Date(e.created_at).toLocaleString('pt-BR')}
                        </div>
                    </div>
                </li>
            ))}
        </ol>
    )
}