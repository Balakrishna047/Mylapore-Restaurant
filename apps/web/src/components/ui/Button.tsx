'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'accent';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

    const variantStyles = {
      primary:
        'bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs shadow-primary/20 hover:shadow-md hover:shadow-primary/30',
      secondary:
        'bg-surface-muted hover:bg-surface-subtle text-foreground border border-border shadow-2xs',
      outline:
        'border border-border hover:border-accent text-foreground hover:text-accent bg-transparent',
      ghost:
        'text-foreground hover:bg-surface-muted hover:text-primary',
      destructive:
        'bg-destructive hover:bg-red-700 text-destructive-foreground shadow-xs',
      accent:
        'bg-accent hover:bg-accent-hover text-accent-foreground shadow-xs shadow-accent/20',
    };

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 min-h-[36px] sm:min-h-[32px] gap-1.5',
      md: 'text-sm px-4 py-2 min-h-[44px] sm:min-h-[40px] gap-2',
      lg: 'text-base px-6 py-3 min-h-[48px] sm:min-h-[44px] gap-2.5 font-semibold',
      icon: 'p-2 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
