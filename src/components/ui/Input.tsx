import type { InputHTMLAttributes } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    hint?: string;
    error?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function Input({
    label,
    hint,
    error,
    size = 'md',
    id,
    required,
    ...rest
}: InputProps) {
    const height = size === 'sm' ? '32px' : size === 'lg' ? '48px' : '40px';
    const fs = size === 'sm' ? 'var(--text-sm)' : 'var(--text-base)';
    const pad = size === 'sm' ? '6px 12px' : '8px 12px';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
            {label && (
                <label htmlFor={id} style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
                    {label}
                    {required && <span style={{ color: 'var(--color-danger-500)', marginLeft: 2}}>*</span>}
                </label>
            )}

            <input
                id={id}
                required={required}
                style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: fs,
                    color: 'var(--color-text-primary)',
                    background: rest.disabled ? 'var(--color-neutral-100)' : '#fff',
                    border: `1.5px solid ${error ? 'var(--color-danger-500)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)', 
                    padding: pad,
                    height,
                    width: '100%',
                    outline: 'none',
                    transition: 'border-color var(--transition-base)',
                    boxSizing: 'border-box',
                }}
                {...rest}
            />
            {(hint || error) && (
                <span style={{ fontSize: 'var(--text-xs)', color: error ? 'var(--color-danger-500)' : 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
                    {error || hint}
                </span>
            )}
        </div>
    );
}