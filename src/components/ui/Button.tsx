import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

const button = cva(
    'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent font-semibold leading-none transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
    {
        variants: {
            variant: {
                primary: 'bg-brand-600 text-white border-brand-600 hover:bg-brand-700',
                secondary: 'bg-transparent text-brand-600 border-brand-600 hover:bg-brand-50',
                ghost: 'bg-transparent text-text-secondary border-border hover:bg-neutral-50',
                danger: 'bg-danger-500 text-white border-danger-500 hover:bg-danger-600',
                success: 'bg-success-500 text-white border-success-500 hover:bg-success-600',
                accent: 'bg-accent-500 text-white border-accent-500 hover:bg-accent-600',
            },
            size: {
                xs: 'h-[26px] px-2.5 text-xs rounded-sm gap-1',
                sm: 'h-8 px-3 text-sm',
                md: 'h-10 px-4 text-base',
                lg: 'h-12 px-5 text-md',
            },
            fullWidth: {
                true: 'w-full',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    },
);

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'>, VariantProps<typeof button> {
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

export function Button({
    children, 
    variant, 
    size, 
    fullWidth,
    leftIcon, 
    rightIcon,
    className,
    ...rest
}: ButtonProps) {
    return (
        <button className={clsx(button({ variant, size, fullWidth }), className)} {...rest}>
            {leftIcon && <span className="flex items-center">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex items-center">{rightIcon}</span>}
        </button>
    );
}