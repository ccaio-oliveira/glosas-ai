import { cn } from "../../lib/cn";
import type { CSSProperties, ReactNode } from "react";

interface CardProps {
    children: ReactNode;
    padding?: string;
    header?: ReactNode;
    footer?: ReactNode;
    style?: CSSProperties;
    className?: string;
}

export function Card({
    children,
    padding,
    header,
    footer,
    style,
    className
}: CardProps) {
    const p = padding ?? 'var(--card-padding)';

    // padding="0" serve para tabela ou editor encostarem na borda do corpo —
    // não para o cabeçalho e o rodapé perderem o respiro lateral. Antes eles
    // herdavam o 0 e o título ficava colado na borda do card.
    // Usa o token menor (16px) porque é o recuo do conteúdo desses cards
    // (tabelas em px-4, editor em p-4): o título alinha com a primeira coluna.
    const edge = parseFloat(p) === 0 ? 'var(--card-padding-sm)' : p;

    return (
        <div className={cn('overflow-hidden rounded-lg border border-border bg-surface shadow-sm', className)} style={style}>
            {header && (
                <div className="flex items-center justify-between gap-3 border-b border-border" style={{ padding: `14px ${edge}` }}>
                    {header}
                </div>
            )}

            <div style={{ padding: p }}>{children}</div>

            {footer && (
                <div className="border-t border-border bg-surface-2" style={{ padding: `12px ${edge}` }}>
                    {footer}
                </div>
            )}
        </div>
    );
}