import React from 'react';

export function Skeleton({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-surface-muted border border-border/40 ${className}`}
      {...props}
    />
  );
}

export function DishCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl bg-surface border border-border p-3 space-y-3 shadow-2xs">
      <Skeleton className="w-full aspect-4/3 rounded-xl" />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-16 rounded-xl" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border space-x-4 animate-pulse bg-surface">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-8 w-24 rounded-lg" />
    </div>
  );
}
