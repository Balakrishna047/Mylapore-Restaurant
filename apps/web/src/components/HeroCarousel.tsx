'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import carouselData from '@/data/carouselBanners.json';

export default function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const banners = carouselData;

  const scrollToBanner = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cards = container.children;
    if (cards[index]) {
      (cards[index] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start',
      });
      setActiveIndex(index);
    }
  };

  const handlePrev = () => {
    const nextIndex = activeIndex > 0 ? activeIndex - 1 : banners.length - 1;
    scrollToBanner(nextIndex);
  };

  const handleNext = () => {
    const nextIndex = activeIndex < banners.length - 1 ? activeIndex + 1 : 0;
    scrollToBanner(nextIndex);
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.offsetWidth * 0.7;
    if (cardWidth > 0) {
      const idx = Math.round(scrollLeft / cardWidth);
      if (idx !== activeIndex && idx >= 0 && idx < banners.length) {
        setActiveIndex(idx);
      }
    }
  };

  return (
    <section className="relative w-full overflow-hidden py-1" aria-label="Featured promotions carousel">
      {/* Desktop Navigation Arrows */}
      <div className="hidden md:flex justify-end gap-2 mb-2 pr-1">
        <button
          onClick={handlePrev}
          aria-label="Previous promotional banner"
          className="w-8 h-8 rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground hover:border-accent transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={handleNext}
          aria-label="Next promotional banner"
          className="w-8 h-8 rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground hover:border-accent transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Carousel Track */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2 pt-1 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {banners.map((banner, idx) => (
          <div
            key={banner.id}
            className="flex-none w-[88vw] sm:w-[68vw] md:w-[48vw] lg:w-[44vw] max-w-[620px] snap-start"
          >
            <div className="relative h-[200px] sm:h-[220px] md:h-[230px] rounded-2xl overflow-hidden border border-border shadow-xs group bg-surface-muted">
              {/* Full background food image */}
              <img
                src={banner.cloudinaryUrl}
                alt={banner.title}
                loading={idx === 0 ? 'eager' : 'lazy'}
                fetchPriority={idx === 0 ? 'high' : 'auto'}
                decoding={idx === 0 ? 'sync' : 'async'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== banner.localUrl) {
                    target.src = banner.localUrl;
                  }
                }}
              />

              {/* Floating Overlay Card on the left with high contrast */}
              <div className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 bg-surface/95 dark:bg-surface/90 backdrop-blur-md p-4 sm:p-5 rounded-xl border border-border shadow-md max-w-[210px] sm:max-w-[250px] md:max-w-[270px]">
                <div className="w-6 h-0.5 bg-primary mb-2 rounded-full" />

                <h3 className="font-serif font-bold text-base sm:text-lg text-foreground leading-tight">
                  {banner.title}
                </h3>

                <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 leading-snug line-clamp-2">
                  {banner.subtitle}
                </p>

                <Link
                  href={banner.ctaLink}
                  className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-primary hover:text-primary-hover transition-colors mt-2.5 group/link"
                >
                  <span>{banner.ctaText}</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Indicator Dots */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => scrollToBanner(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              activeIndex === idx
                ? 'w-6 bg-primary'
                : 'w-1.5 bg-border hover:bg-muted-foreground'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
