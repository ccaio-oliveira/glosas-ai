import type { ReactNode } from "react";

interface TopBarProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
    return (
        <div className="flex h-[var(--topbar-height)] flex-shrink-0 items-center justify-between border-b border-border bg-surface px-[var(--content-padding)]">
            <div>
                <div className="font-sans text-xl font-semibold leading-tight text-text-primary">{title}</div>
                {subtitle && <div className="mt-px font-sans text-sm text-text-muted">{subtitle}</div>}
            </div>

            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    )
}