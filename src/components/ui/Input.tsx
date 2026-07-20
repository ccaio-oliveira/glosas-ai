import clsx from "clsx";
import type { InputHTMLAttributes } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    hint?: string;
    error?: string;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-3 text-base',
    lg: 'h-12 px-3 text-md'
};

export function Input({
    label,
    hint,
    error,
    size = 'md',
    id,
    required,
    className,
    ...rest
}: InputProps) {
    return (
        <div className="flex w-full flex-col gap-1">
            {label && (
                <label htmlFor={id} className="text-sm font-medium text-text-secondary">
                    {label}
                    {required && <span className="ml-0.5 text-danger-500">*</span>}
                </label>
            )}

            <input
                id={id}
                required={required}
                className={clsx(
                    'w-full rounded-md border-[1.5px] font-sans text-text-primary outline-none transition-colors duration-150',
                    'disabled:bg-neutral-100',
                    error ? 'border-danger-500' : 'border-border',
                    sizeClasses[size],
                    className,
                )}
                {...rest}
            />
            {(hint || error) && (
                <span className={clsx('text-xs', error ? 'text-danger-500' : 'text-text-muted')}>
                    {error || hint}
                </span>
            )}
        </div>
    );
}