import type { ReactNode } from "react";

type Color = 'brand' | 'success' | 'danger' | 'warning' | 'accent';
type Trend = 'up' | 'down' | 'neutral';

interface MetricCardProps {
    label: string;
    value: string;
    change?: string;
    changeLabel?: string;
    trend?: Trend;
    icon?: ReactNode;
    color?: Color;
    description?: string;
}

const IconBg: Record<Color, string> = {
    brand: 'bg-brand-500/10 text-brand-500',
    success: 'bg-success-500/10 text-success-500',
    danger: 'bg-danger-500/10 text-danger-500',
    warning: 'bg-warning-500/10 text-warning-500',
    accent: 'bg-accent-500/10 text-accent-500',
};

const trendColor: Record<Trend, string> = {
    up: 'text-success-600',
    down: 'text-danger-600',
    neutral: 'text-text-muted',
};

const trendIcon: Record<Trend, string> = { up: '↑', down: '↓', neutral: '→' };

export function MetricCard({ label, value, change, changeLabel, trend = 'neutral', icon, color = 'brand', description }: MetricCardProps) {
    return (
        <div className="flex min-w-[160px] flex-1 flex-col gap-2.5 rounded-lg border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <span className="font-sans text-sm font-medium leading-snug text-text-secondary">{label}</span>
                
                {icon && (
                    <div className={`flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-md text-[17px] ${IconBg[color]}`}>
                        {icon}
                    </div>
                )}
            </div>

            <div className="font-sans text-[28px] font-bold leading-none tracking-tight text-text-primary">{value}</div>

            {(change || description) && (
                <div className="flex items-center gap-1 font-sans text-xs">
                    {change && <span className={`font-semibold ${trendColor[trend]}`}>{trendIcon[trend]} {change}</span>}

                    {changeLabel && <span className="text-text-muted">{changeLabel}</span>}

                    {description && <span className="text-text-muted">{description}</span>}
                </div>
            )}
        </div>
    )
}