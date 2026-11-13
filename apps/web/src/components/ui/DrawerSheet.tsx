'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  position?: 'bottom-or-center' | 'bottom-or-right';
  maxWidth?: string;
}

export function DrawerSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  position = 'bottom-or-center',
  maxWidth = 'max-w-lg',
}: DrawerSheetProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Sheet Content */}
      <div
        className={`relative z-10 w-full bg-surface border-t sm:border border-border shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] transition-all duration-300 animate-in ${
          position === 'bottom-or-right'
            ? 'sm:fixed sm:inset-y-0 sm:right-0 sm:h-full sm:max-h-full sm:rounded-none sm:border-l sm:border-t-0'
            : 'rounded-t-3xl sm:rounded-3xl'
        } ${maxWidth}`}
      >
        {/* Mobile Swipe / Drag Handle Indicator */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-border" />
        </div>

        {/* Header */}
        {(title || description) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              {title && (
                <h3 className="font-serif font-bold text-lg sm:text-xl text-foreground">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
