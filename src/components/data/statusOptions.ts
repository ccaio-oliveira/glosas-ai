import type { DenialStatus } from "./StatusBadge";

export const STATUS_OPTIONS: { value: DenialStatus; label: string }[] = [
    { value: 'new', label: 'Nova' },
    { value: 'pending', label: 'Pendente' },
    { value: 'appealed', label: 'Contestada' },
    { value: 'recovered', label: 'Recuperada' },
    { value: 'rejected', label: 'Negada' },
];
