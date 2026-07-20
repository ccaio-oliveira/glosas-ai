import type { CSSProperties, ReactNode } from "react";

interface CardProps {
    children: ReactNode;
    padding?: string;
    header?: ReactNode;
    footer?: ReactNode;
    style?: CSSProperties;
}

export function Card({
    children,
    padding,
    header,
    footer,
    style
}: CardProps) {
    const p = padding ?? 'var(--card-padding)';

    return (
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: 'var(--border-default)', overflow: 'hidden', ...style }}>
            {header && (
                <div style={{ padding: `14px ${p}`, borderBottom: 'var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {header}
                </div>
            )}

            <div style={{ padding: p }}>{children}</div>

            {footer && (
                <div style={{ padding: `12px ${p}`, borderTop: 'var(--border-default)', background: 'var(--color-surface-2)' }}>
                    {footer}
                </div>
            )}
        </div>
    );
}