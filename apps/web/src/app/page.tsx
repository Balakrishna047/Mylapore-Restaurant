'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import CategoryNav from '@/components/CategoryNav';
import DishCard from '@/components/DishCard';
import HeroCarousel from '@/components/HeroCarousel';
import { DishCardSkeleton } from '@/components/ui/Skeleton';
import { ArrowRight } from 'lucide-react';
import initialCategories from '@/data/initialCategories.json';
import initialDishes from '@/data/initialDishes.json';
import { MenuItemDto, MenuCategoryDto } from '@mylapore/shared-types';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParam = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'all';

  const [categories, setCategories] = useState<MenuCategoryDto[]>(initialCategories as any);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [dishes, setDishes] = useState<MenuItemDto[]>(initialDishes as any);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, items] = await Promise.all([
          api.getCategories(),
          api.getMenuItems({
            category: activeCategory !== 'all' ? activeCategory : undefined,
            search: searchParam || undefined,
          }),
        ]);
        if (cats && cats.length > 0) setCategories(cats);
        if (items && items.length > 0) setDishes(items);
      } catch (err) {
        console.error('Failed to load menu items:', err);
      }
    }
    loadData();
  }, [activeCategory, searchParam]);

  // Specific collections matching South Indian culinary hierarchy
  const customerFavorites = dishes.filter((d) =>
    ['500+ ordered', '1,000+ ordered'].includes(d.orderCountBadge || '')
  );
  const kootuAndPoriyal = dishes.filter(
    (d) =>
      d.slug.includes('kootu') ||
      d.slug.includes('poriyal') ||
      d.slug.includes('usili') ||
      d.slug.includes('kara-kari') ||
      d.slug.includes('guttivankaya')
  );
  const northIndian = dishes.filter(
    (d) =>
      d.slug.includes('chole') ||
      d.slug.includes('paneer') ||
      d.slug.includes('channa') ||
      d.slug.includes('rajma')
  );
  const sambarAndRasam = dishes.filter(
    (d) =>
      d.slug.includes('sambar') ||
      d.slug.includes('rasam') ||
      d.categoryName === 'Sambar' ||
      d.categoryName === 'Rasam'
  );
  const dessertsAndSweets = dishes.filter(
    (d) =>
      d.slug.includes('payasam') ||
      d.slug.includes('halwa') ||
      d.slug.includes('pak') ||
      d.slug.includes('kesari') ||
      d.categoryName === 'Desserts'
  );
  const refreshingBeverages = dishes.filter(
    (d) =>
      d.slug.includes('lassi') ||
      d.slug.includes('coffee') ||
      d.slug.includes('buttermilk') ||
      d.slug.includes('rose-milk') ||
      d.categoryName === 'Beverages'
  );
  const breakfastTiffin = dishes.filter(
    (d) =>
      d.categoryName === 'Batters' ||
      d.slug.includes('pongal') ||
      d.slug.includes('khichdi') ||
      d.slug.includes('batter')
  );

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background transition-colors duration-200">
      {/* Category Pills Bar */}
      <CategoryNav
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={(slug) => {
          if (slug === 'all') {
            setActiveCategory('all');
            router.push('/');
          } else {
            router.push(`/category/${slug}`);
          }
        }}
      />

      <div className="max-w-7xl 3xl:max-w-ultrawide mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        {/* Top Hero Banner Carousel from Cloudinary */}
        <HeroCarousel />

        {/* Section 1: Customer favorites */}
        <section className="space-y-4" aria-label="Customer favorites">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-foreground">
                Customer favorites
              </h2>
              <p className="text-xs text-muted-foreground">
                Our most-ordered authentic South Indian dishes
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <DishCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {(customerFavorites.length > 0 ? customerFavorites : dishes)
                .slice(0, 6)
                .map((dish) => (
                  <DishCard key={dish.id} dish={dish as any} />
                ))}
            </div>
          )}
        </section>

        {/* Section 2: Kootu & Poriyal */}
        <section className="space-y-4" aria-label="Kootu and Poriyal">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-foreground">
                Kootu & Poriyal
              </h2>
              <p className="text-xs text-muted-foreground">
                Traditional lentil stews and slow-roasted vegetable dry fries
              </p>
            </div>
            <Link
              href="/?category=curries"
              className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors min-h-[36px]"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {(kootuAndPoriyal.length > 0 ? kootuAndPoriyal : dishes).slice(0, 6).map((dish) => (
              <DishCard key={dish.id} dish={dish as any} />
            ))}
          </div>
        </section>

        {/* Section 3: North Indian Favourites */}
        <section className="space-y-4" aria-label="North Indian curries">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-foreground">
                North Indian Favourites
              </h2>
              <p className="text-xs text-muted-foreground">
                Comforting curries crafted with rich gravies and paneer
              </p>
            </div>
            <Link
              href="/?category=curries"
              className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors min-h-[36px]"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {(northIndian.length > 0 ? northIndian : dishes).slice(0, 6).map((dish) => (
              <DishCard key={dish.id} dish={dish as any} />
            ))}
          </div>
        </section>

        {/* Section 4: Breakfast & Tiffin */}
        <section className="space-y-4" aria-label="Breakfast and tiffin">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-foreground">
                Breakfast & Tiffin
              </h2>
              <p className="text-xs text-muted-foreground">
                Naturally stone-ground idly batter, pongal, and tiffin staples
              </p>
            </div>
            <Link
              href="/category/batters"
              className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors min-h-[36px]"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {(breakfastTiffin.length > 0 ? breakfastTiffin : dishes).slice(0, 6).map((dish) => (
              <DishCard key={dish.id} dish={dish as any} />
            ))}
          </div>
        </section>

        {/* Section: Sambar & Rasam */}
        <section className="space-y-4" aria-label="Sambar and rasam">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-foreground">
                Authentic Sambar & Rasam
              </h2>
              <p className="text-xs text-muted-foreground">
                Temple-style slow-simmered drumstick sambar, arachuvitta lentil broths & pepper rasam
              </p>
            </div>
            <Link
              href="/category/sambar"
              className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors min-h-[36px]"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {(sambarAndRasam.length > 0 ? sambarAndRasam : dishes).slice(0, 6).map((dish) => (
              <DishCard key={dish.id} dish={dish as any} />
            ))}
          </div>
        </section>

        {/* Section: Desserts & Sweets */}
        <section className="space-y-4" aria-label="Desserts and sweets">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-foreground">
                Mylapore Sweets & Desserts
              </h2>
              <p className="text-xs text-muted-foreground">
                Slow-cooked Paal Payasam, Tirunelveli Asoka Halwa, and melt-in-mouth Ghee Mysore Pak
              </p>
            </div>
            <Link
              href="/category/desserts"
              className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors min-h-[36px]"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {(dessertsAndSweets.length > 0 ? dessertsAndSweets : dishes).slice(0, 6).map((dish) => (
              <DishCard key={dish.id} dish={dish as any} />
            ))}
          </div>
        </section>

        {/* Section: Refreshing Beverages */}
        <section className="space-y-4" aria-label="Refreshing beverages">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-foreground">
                Refreshing Beverages
              </h2>
              <p className="text-xs text-muted-foreground">
                Cooling Spiced Buttermilk, Mango Lassi, Degree Filter Coffee & Chennai Rose Milk
              </p>
            </div>
            <Link
              href="/category/beverages"
              className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors min-h-[36px]"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {(refreshingBeverages.length > 0 ? refreshingBeverages : dishes).slice(0, 6).map((dish) => (
              <DishCard key={dish.id} dish={dish as any} />
            ))}
          </div>
        </section>

        {/* Section 5: Our Collections */}
        <section id="collections" className="space-y-4 pt-4" aria-label="Curated collections">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-foreground">
                Our Collections
              </h2>
              <p className="text-xs text-muted-foreground">
                Chosen by our kitchen
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[
              { title: 'Best Sellers', count: '8 products', img: 'https://res.cloudinary.com/dwlh5wdsw/image/upload/f_auto,q_auto/v1794546797/mylapore-express/dishes/curries-coconut-spiced-south-indian-veg-kurma.webp' },
              { title: 'Paneer Favourites', count: '8 products', img: 'https://res.cloudinary.com/dwlh5wdsw/image/upload/f_auto,q_auto/v1794546808/mylapore-express/dishes/curries-spinach-greens-cottage-cheese-saag-paneer.webp' },
              { title: 'Rice Bowls', count: '7 products', img: 'https://res.cloudinary.com/dwlh5wdsw/image/upload/f_auto,q_auto/v1794549448/mylapore-express/dishes/rice-temple-style-tamarind-puliyodarai.jpg' },
              { title: 'Tea-time Snacks', count: '6 products', img: 'https://res.cloudinary.com/dwlh5wdsw/image/upload/f_auto,q_auto/v1794549448/mylapore-express/dishes/podis-gunpowder-idli-milagai-podi.jpg' },
              { title: 'Breakfast & Tiffin', count: '6 products', img: 'https://res.cloudinary.com/dwlh5wdsw/image/upload/f_auto,q_auto/v1794546780/mylapore-express/dishes/batters-crispy-fermented-dosa-batter.webp' }
            ].map((col, idx) => (
              <div
                key={idx}
                className="relative aspect-4/3 rounded-2xl overflow-hidden group cursor-pointer border border-border shadow-xs hover:border-accent transition-all duration-300"
              >
                <img
                  src={col.img}
                  alt={col.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/placeholder-dish.svg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-3.5 text-white">
                  <h4 className="font-serif font-bold text-sm leading-tight text-white">{col.title}</h4>
                  <span className="text-[10px] text-cream-200 font-medium">{col.count}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6: Pre-Footer CTA */}
        <section className="my-10 rounded-3xl bg-foreground text-background p-8 sm:p-12 text-center relative overflow-hidden shadow-xl border border-accent/40">
          <div className="max-w-2xl mx-auto space-y-4 z-10 relative">
            <h2 className="font-serif font-bold text-2xl sm:text-4xl leading-tight tracking-tight text-background">
              Hungry? Your next meal is a tap away.
            </h2>
            <p className="text-xs sm:text-sm text-background/80 max-w-lg mx-auto leading-relaxed">
              Create a free account to order, save your delivery addresses, and track every order in real-time.
            </p>
            <div className="pt-2">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-background hover:bg-surface-muted text-foreground font-bold text-xs uppercase tracking-wider rounded-full shadow-lg transition-all active:scale-[0.98] min-h-[44px]"
              >
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4 text-primary" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl 3xl:max-w-ultrawide mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <DishCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
