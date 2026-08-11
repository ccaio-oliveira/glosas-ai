import clsx from "clsx";

export type DenialStatus = 'new' | 'pending' | 'appealed' | 'recovered' | 'rejected';

const config: Record<DenialStatus, { label: string; className: string; dot: string }> = {
    recovered: { label: 'Recuperada', className: 'bg-success-50 text-success-700', dot: 'bg-success-500' },
    appealed: { label: 'Contestada', className: 'bg-brand-100 text-brand-700', dot: 'bg-brand-500' },
    pending: { label: 'Pendente', className: 'bg-warning-50 text-warning-600', dot: 'bg-warning-500' },
    rejected: { label: 'Negada', className: 'bg-danger-50 text-danger-700', dot: 'bg-danger-500' },
    new: { label: 'Nova', className: 'bg-neutral-100 text-neutral-600', dot: 'bg-neutral-400' },
};

const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
}; 

export function StatusBadge({ status, size = 'md' }: { status: DenialStatus; size?: keyof typeof sizes }) {
    const s = config[status] ?? config.new;

    return (
        <span className={clsx('inline-flex items-center whitespace-nowrap rounded-full font-semibold', s.className, sizes[size])}>
            <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', s.dot)}></span>
            {s.label}
        </span>
    );
}

export const STATUS_OPTIONS: { value: DenialStatus; label: string }[] = [
    { value: 'new', label: 'Nova' },
    { value: 'pending', label: 'Pendente' },
    { value: 'appealed', label: 'Contestada' },
    { value: 'recovered', label: 'Recuperada' },
    { value: 'rejected', label: 'Negada' },
];