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

    return (
        <div className={cn('overflow-hidden rounded-lg border border-border bg-surface shadow-sm', className)} style={style}>
            {header && (
                <div className="flex items-center justify-between border-b border-border" style={{ padding: `14px ${p}` }}>
                    {header}
                </div>
            )}

            <div style={{ padding: p }}>{children}</div>

            {footer && (
                <div className="border-t border-border bg-surface-2" style={{ padding: `12px ${p}` }}>
                    {footer}
                </div>
            )}
        </div>
    );
}