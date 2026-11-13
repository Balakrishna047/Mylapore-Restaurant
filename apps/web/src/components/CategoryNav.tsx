'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Grid } from 'lucide-react';

interface CategoryNavProps {
  categories: Array<{ id: string; name: string; slug: string; icon: string }>;
  activeCategory: string;
  onSelectCategory: (slug: string) => void;
}

export default function CategoryNav({
  categories,
  activeCategory,
  onSelectCategory,
}: CategoryNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -260, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  const allCategory = {
    id: 'all',
    name: 'All Dishes',
    slug: 'all',
    icon: '',
  };

  const fullList = [allCategory, ...categories];

  return (
    <div className="relative bg-surface-muted border-b border-border py-2.5 transition-colors duration-200">
      <div className="max-w-7xl 3xl:max-w-ultrawide mx-auto px-4 sm:px-6 lg:px-8 relative flex items-center">
        {/* Scroll Left Button */}
        <button
          onClick={scrollLeft}
          className="hidden sm:flex absolute left-2 z-10 w-8 h-8 rounded-full bg-surface/95 border border-border shadow-xs items-center justify-center text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Scroll categories left"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Categories List */}
        <div
          ref={scrollRef}
          tabIndex={0}
          aria-label="Dishes category selector"
          className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar scroll-smooth px-1 sm:px-8 w-full"
        >
          {fullList.map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => onSelectCategory(cat.slug)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer min-h-[40px] sm:min-h-[36px] active:scale-[0.98] ${
                  isActive
                    ? 'bg-foreground text-background shadow-xs ring-2 ring-accent/30'
                    : 'bg-surface hover:bg-surface-subtle text-foreground border border-border hover:border-accent/40'
                }`}
              >
                {cat.slug === 'all' ? (
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      isActive
                        ? 'bg-background/20 text-background'
                        : 'bg-surface-muted text-foreground'
                    }`}
                  >
                    <Grid className="w-3 h-3" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-surface-muted shrink-0 border border-border">
                    <img
                      src={cat.icon}
                      alt={cat.name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder-dish.svg';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Scroll Right Button */}
        <button
          onClick={scrollRight}
          className="hidden sm:flex absolute right-2 z-10 w-8 h-8 rounded-full bg-surface/95 border border-border shadow-xs items-center justify-center text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Scroll categories right"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
