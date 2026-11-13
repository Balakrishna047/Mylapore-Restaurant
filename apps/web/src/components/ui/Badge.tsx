import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'accent' | 'outline' | 'blast';
  size?: 'sm' | 'md';
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}: BadgeProps) {
  const baseStyles =
    'inline-flex items-center font-semibold rounded-full select-none tracking-wide uppercase transition-colors';

  const variantStyles = {
    default: 'bg-surface-muted text-foreground border border-border',
    success: 'bg-success/15 text-success border border-success/30 dark:bg-success/20 dark:text-success',
    warning: 'bg-warning/15 text-warning border border-warning/30 dark:bg-warning/20',
    destructive: 'bg-destructive/15 text-destructive border border-destructive/30',
    accent: 'bg-accent/15 text-accent border border-accent/30',
    outline: 'bg-transparent text-foreground border border-border',
    blast: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-bold',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 leading-tight',
    md: 'text-xs px-2.5 py-1 leading-normal',
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
