import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'accent';
type Size = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
    variant?: Variant;
    size?: Size;
    fullWidth?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

const variants: Record<Variant, CSSProperties> = {
    primary: { background: 'var(--color-brand-600)', color: '#fff', borderColor: 'var(--color-brand-600)' },
    secondary: { background: 'transparent', color: 'var(--color-brand-600)', borderColor: 'var(--color-brand-600)' },
    ghost: { background: 'transparent', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' },
    danger: { background: 'var(--color-danger-500)', color: '#fff', borderColor: 'var(--color-danger-500)' },
    success: { background: 'var(--color-success-500)', color: '#fff', borderColor: 'var(--color-success-500)' },
    accent: { background: 'var(--color-accent-500)', color: '#fff', borderColor: 'var(--color-accent-500)' },
};

const sizes: Record<Size, CSSProperties> = {
    xs: { padding: '4px 10px', fontSize: 'var(--text-xs)', height: '26px', borderRadius: 'var(--radius-sm)', gap: '4px' },
    sm: { padding: '6px 12px', fontSize: 'var(--text-sm)', height: '32px' },
    md: { padding: '8px 16px', fontSize: 'var(--text-base)', height: '40px' },
    lg: { padding: '10px 20px', fontSize: 'var(--text-md)', height: '48px' },
};

export function Button({
    children, 
    variant = 'primary', 
    size = 'md', 
    disabled = false, 
    fullWidth = false,
    leftIcon, 
    rightIcon,
    style,
    ...rest
}: ButtonProps) {
    return (
        <button
            disabled={disabled}
            style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all var(--transition-base)',
                width: fullWidth ? '100%' : 'auto',
                border: '1.5px solid transparent',
                outline: 'none',
                whiteSpace: 'nowrap',
                lineHeight: 1,
                textDecoration: 'none',
                userSelect: 'none',
                ...variants[variant],
                ...sizes[size],
                ...style,
            }}
            {...rest}
        >
            {leftIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{leftIcon}</span>}
            {children}
            {rightIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{rightIcon}</span>}
        </button>
    );
}