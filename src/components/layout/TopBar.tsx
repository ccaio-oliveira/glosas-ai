import type { ReactNode } from "react";

interface TopBarProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
    return (
        <div style={{ height: 'var(--topbar-height)', background: 'var(--color-surface)', borderBottom: 'var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--content-padding)', flexShrink: 0 }}>
            <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{title}</div>
                {subtitle && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: '1px' }}>{subtitle}</div>}
            </div>

            {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{actions}</div>}
        </div>
    )
}