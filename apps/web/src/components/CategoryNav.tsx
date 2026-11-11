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
  onSelectCategory
}: CategoryNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  const allCategory = {
    id: 'all',
    name: 'All Dishes',
    slug: 'all',
    icon: ''
  };

  const fullList = [allCategory, ...categories];

  return (
    <div className="relative bg-[#FAF4E8] border-b border-[#E7DFD5] py-2.5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative flex items-center">
        {/* Scroll Left Button matching PDF Screenshot */}
        <button
          onClick={scrollLeft}
          className="hidden sm:flex absolute left-2 z-10 w-7 h-7 rounded-full bg-white/95 border border-[#E7DFD5] shadow-xs items-center justify-center text-[#78716C] hover:text-[#1C1917] hover:scale-105 transition-all"
          title="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Categories List */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar scroll-smooth px-2 sm:px-8 w-full"
        >
          {fullList.map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => onSelectCategory(cat.slug)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#1C1917] text-white shadow-xs'
                    : 'bg-white hover:bg-[#F5EFE6] text-[#44403C] border border-[#E7DFD5]'
                }`}
              >
                {cat.slug === 'all' ? (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isActive ? 'bg-white/20 text-white' : 'bg-[#E7DFD5] text-[#1C1917]'}`}>
                    <Grid className="w-3 h-3" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-neutral-200 shrink-0 border border-white">
                    <img
                      src={cat.icon}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Scroll Right Button matching PDF Screenshot */}
        <button
          onClick={scrollRight}
          className="hidden sm:flex absolute right-2 z-10 w-7 h-7 rounded-full bg-white/95 border border-[#E7DFD5] shadow-xs items-center justify-center text-[#78716C] hover:text-[#1C1917] hover:scale-105 transition-all"
          title="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
