import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Junta classes resolvendo conflito do Tailwind — a última vence.
 *
 * `clsx` sozinho só concatena: `clsx('bg-surface', 'bg-brand-700')` deixa as
 * duas na string, e quem ganha é a que vier depois na folha de estilo gerada,
 * não a que o autor escreveu por último. Isso já produziu um card com fundo
 * branco e texto branco. Use `cn()` em todo componente que aceita `className`.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
