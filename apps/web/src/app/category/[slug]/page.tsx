'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import CategoryNav from '@/components/CategoryNav';
import DishCard from '@/components/DishCard';
import {
  Filter,
  SlidersHorizontal,
  Search,
  Grid,
  List,
  Check,
  X,
  Snowflake,
  Flame,
  ChevronRight,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || 'beverages';

  const [categories, setCategories] = useState<any[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: Grid or List
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'rating_desc' | 'popular_desc'>('recommended');
  const [availableToOrder, setAvailableToOrder] = useState<boolean>(true);
  const [priceTier, setPriceTier] = useState<'all' | 'under_8' | '8_to_12' | 'over_12'>('all');
  const [spiceFilter, setSpiceFilter] = useState<'all' | 'MILD' | 'MEDIUM' | 'SPICY'>('all');
  const [preservationFilter, setPreservationFilter] = useState<'all' | 'blast_chilled' | 'batter' | 'pantry'>('all');

  const [dietaryFilters, setDietaryFilters] = useState<{
    vegetarian: boolean;
    vegan: boolean;
    jain: boolean;
    glutenFree: boolean;
  }>({
    vegetarian: false,
    vegan: false,
    jain: false,
    glutenFree: false
  });

  const [regionalTags, setRegionalTags] = useState<{
    southIndian: boolean;
    northIndian: boolean;
  }>({
    southIndian: false,
    northIndian: false
  });

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [cats, items] = await Promise.all([
          api.getCategories(),
          api.getMenuItems({
            category: slug !== 'all' ? slug : undefined
          })
        ]);
        setCategories(cats);
        setDishes(items);
      } catch (err) {
        console.error('Failed to load category menu items:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  const activeCategoryObj = categories.find((c) => c.slug === slug);
  const categoryTitle =
    slug === 'all'
      ? 'All Dishes'
      : activeCategoryObj?.name || (slug.charAt(0).toUpperCase() + slug.slice(1));

  // Regional counts for Tag section
  const southIndianCount = useMemo(() => {
    return dishes.filter((d) => {
      const name = (d.name || '').toLowerCase();
      return (
        !name.includes('punjabi') &&
        !name.includes('paneer') &&
        !name.includes('rajma') &&
        !name.includes('chole')
      );
    }).length;
  }, [dishes]);

  const northIndianCount = useMemo(() => {
    return dishes.filter((d) => {
      const desc = (d.description || '').toLowerCase();
      const name = (d.name || '').toLowerCase();
      return (
        name.includes('punjabi') ||
        name.includes('paneer') ||
        name.includes('rajma') ||
        name.includes('chole') ||
        desc.includes('north indian')
      );
    }).length;
  }, [dishes]);

  // Filtered & Sorted Dishes
  const filteredDishes = useMemo(() => {
    let result = [...dishes];

    // 1. Text Search within category
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((d) => {
        const nameMatch = (d.name || '').toLowerCase().includes(q);
        const descMatch = (d.description || '').toLowerCase().includes(q);
        const ingStr = Array.isArray(d.ingredients)
          ? d.ingredients.join(' ').toLowerCase()
          : typeof d.ingredients === 'string'
          ? d.ingredients.toLowerCase()
          : '';
        const ingMatch = ingStr.includes(q);
        return nameMatch || descMatch || ingMatch;
      });
    }

    // 2. Dietary filtering
    if (dietaryFilters.vegetarian) {
      result = result.filter((d) => {
        const tags = Array.isArray(d.dietaryTags) ? d.dietaryTags : [];
        return tags.includes('VEGETARIAN');
      });
    }
    if (dietaryFilters.vegan) {
      result = result.filter((d) => {
        const tags = Array.isArray(d.dietaryTags) ? d.dietaryTags : [];
        return tags.includes('VEGAN');
      });
    }
    if (dietaryFilters.jain) {
      result = result.filter((d) => {
        const tags = Array.isArray(d.dietaryTags) ? d.dietaryTags : [];
        return tags.includes('JAIN');
      });
    }
    if (dietaryFilters.glutenFree) {
      result = result.filter((d) => {
        const tags = Array.isArray(d.dietaryTags) ? d.dietaryTags : [];
        return tags.includes('GLUTEN_FREE');
      });
    }

    // 3. Price Tier
    if (priceTier === 'under_8') {
      result = result.filter((d) => d.basePrice < 8.0);
    } else if (priceTier === '8_to_12') {
      result = result.filter((d) => d.basePrice >= 8.0 && d.basePrice <= 12.0);
    } else if (priceTier === 'over_12') {
      result = result.filter((d) => d.basePrice > 12.0);
    }

    // 4. Spice Level
    if (spiceFilter !== 'all') {
      if (spiceFilter === 'SPICY') {
        result = result.filter((d) => ['SPICY', 'HOT', 'EXTRA_HOT'].includes(d.spiceLevel));
      } else {
        result = result.filter((d) => d.spiceLevel === spiceFilter);
      }
    }

    // 5. Preservation / Freshness
    if (preservationFilter === 'blast_chilled') {
      result = result.filter((d) => d.isBlastChilled === true);
    } else if (preservationFilter === 'batter') {
      result = result.filter((d) => d.slug.includes('batter'));
    } else if (preservationFilter === 'pantry') {
      result = result.filter((d) => d.isBlastChilled === false && !d.slug.includes('batter'));
    }

    // 6. Regional Tag filtering
    if (regionalTags.southIndian && !regionalTags.northIndian) {
      result = result.filter((d) => {
        const name = (d.name || '').toLowerCase();
        return (
          !name.includes('punjabi') &&
          !name.includes('paneer') &&
          !name.includes('rajma') &&
          !name.includes('chole')
        );
      });
    } else if (regionalTags.northIndian && !regionalTags.southIndian) {
      result = result.filter((d) => {
        const desc = (d.description || '').toLowerCase();
        const name = (d.name || '').toLowerCase();
        return (
          name.includes('punjabi') ||
          name.includes('paneer') ||
          name.includes('rajma') ||
          name.includes('chole') ||
          desc.includes('north indian')
        );
      });
    }

    // 7. Sorting
    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.basePrice - a.basePrice);
    } else if (sortBy === 'rating_desc') {
      result.sort((a, b) => (b.rating || 5.0) - (a.rating || 5.0));
    } else if (sortBy === 'popular_desc') {
      const getOrderWeight = (badge?: string) => {
        if (!badge) return 0;
        if (badge.includes('1,000+')) return 1000;
        if (badge.includes('500+')) return 500;
        if (badge.includes('250+')) return 250;
        return 100;
      };
      result.sort((a, b) => getOrderWeight(b.orderCountBadge) - getOrderWeight(a.orderCountBadge));
    }

    return result;
  }, [
    dishes,
    searchQuery,
    sortBy,
    priceTier,
    spiceFilter,
    preservationFilter,
    dietaryFilters,
    regionalTags
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setSortBy('recommended');
    setAvailableToOrder(true);
    setPriceTier('all');
    setSpiceFilter('all');
    setPreservationFilter('all');
    setDietaryFilters({
      vegetarian: false,
      vegan: false,
      jain: false,
      glutenFree: false
    });
    setRegionalTags({ southIndian: false, northIndian: false });
  };

  const activeFiltersCount = [
    sortBy !== 'recommended',
    priceTier !== 'all',
    spiceFilter !== 'all',
    preservationFilter !== 'all',
    dietaryFilters.vegetarian,
    dietaryFilters.vegan,
    dietaryFilters.jain,
    dietaryFilters.glutenFree,
    regionalTags.southIndian,
    regionalTags.northIndian,
    searchQuery.trim().length > 0
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Category Navigation Bar with Scroll Chevrons */}
      <CategoryNav
        categories={categories}
        activeCategory={slug}
        onSelectCategory={(newSlug) => {
          if (newSlug === 'all') {
            router.push('/');
          } else {
            router.push(`/category/${newSlug}`);
          }
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-[#78716C] mb-4">
          <Link href="/" className="hover:text-[#1C1917] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#A8A29E]" />
          <Link href="/" className="hover:text-[#1C1917] transition-colors">
            Menu
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#A8A29E]" />
          <span className="font-semibold text-[#1C1917] capitalize">{categoryTitle}</span>
        </nav>

        {/* Category Header with Title, Count, Search & View Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-[#E7DFD5]">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1C1917] capitalize">
                {categoryTitle}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FAF4E8] border border-[#E7DFD5] text-xs font-bold text-[#78716C]">
                {loading ? '...' : `${filteredDishes.length} ${filteredDishes.length === 1 ? 'item' : 'items'}`}
              </span>
            </div>
            <p className="text-xs text-[#78716C] mt-1 max-w-xl">
              Authentic recipes prepared with pure ingredients, traditional tempering, and zero artificial preservatives.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Real-time In-Category Search */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search in ${categoryTitle}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-[#E7DFD5] rounded-full focus:outline-hidden focus:border-[#C8851A] focus:ring-1 focus:ring-[#C8851A]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Grid / List View Toggle */}
            <div className="hidden sm:flex items-center bg-white border border-[#E7DFD5] rounded-full p-0.5 shadow-2xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#1C1917] text-white shadow-xs'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-full transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#1C1917] text-white shadow-xs'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="md:hidden flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E7DFD5] bg-white text-xs font-semibold text-[#1C1917] shadow-xs shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#C8851A]" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#D95338] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 mb-6 flex-wrap animate-in fade-in">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
              Active Filters:
            </span>

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-[#1C1917] border border-neutral-300">
                <span>&quot;{searchQuery}&quot;</span>
                <button onClick={() => setSearchQuery('')} className="hover:text-[#D95338]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {sortBy !== 'recommended' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FAF4E8] text-[#1C1917] border border-[#E7DFD5]">
                <span>Sort: {sortBy.replace('_', ' ')}</span>
                <button onClick={() => setSortBy('recommended')} className="hover:text-[#D95338]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {dietaryFilters.vegetarian && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span>Vegetarian</span>
                <button onClick={() => setDietaryFilters({ ...dietaryFilters, vegetarian: false })} className="hover:text-[#D95338]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {dietaryFilters.vegan && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span>Vegan</span>
                <button onClick={() => setDietaryFilters({ ...dietaryFilters, vegan: false })} className="hover:text-[#D95338]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {dietaryFilters.jain && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                <span>Jain</span>
                <button onClick={() => setDietaryFilters({ ...dietaryFilters, jain: false })} className="hover:text-[#D95338]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {dietaryFilters.glutenFree && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 border border-neutral-300">
                <span>Gluten-Free</span>
                <button onClick={() => setDietaryFilters({ ...dietaryFilters, glutenFree: false })} className="hover:text-[#D95338]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {priceTier !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FAF4E8] text-[#1C1917] border border-[#E7DFD5]">
                <span>{priceTier === 'under_8' ? 'Under $8' : priceTier === '8_to_12' ? '$8 - $12' : '$12+'}</span>
                <button onClick={() => setPriceTier('all')} className="hover:text-[#D95338]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {spiceFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
                <span>Spice: {spiceFilter}</span>
                <button onClick={() => setSpiceFilter('all')} className="hover:text-[#D95338]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {preservationFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200">
                <span>{preservationFilter === 'blast_chilled' ? 'Blast-Chilled' : preservationFilter === 'batter' ? 'Batter' : 'Pantry'}</span>
                <button onClick={() => setPreservationFilter('all')} className="hover:text-[#D95338]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {regionalTags.southIndian && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FAF4E8] text-[#1C1917] border border-[#E7DFD5]">
                <span>South Indian</span>
                <button onClick={() => setRegionalTags({ ...regionalTags, southIndian: false })} className="hover:text-[#D95338]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {regionalTags.northIndian && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FAF4E8] text-[#1C1917] border border-[#E7DFD5]">
                <span>North Indian</span>
                <button onClick={() => setRegionalTags({ ...regionalTags, northIndian: false })} className="hover:text-[#D95338]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={resetFilters}
              className="text-xs font-bold text-[#D95338] hover:underline flex items-center gap-1 ml-2"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear all</span>
            </button>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Left Enterprise Filter Sidebar */}
          <aside
            className={`md:block space-y-6 ${
              mobileFilterOpen
                ? 'fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end p-0'
                : 'hidden'
            }`}
          >
            <div
              className={`bg-white rounded-3xl border border-[#E7DFD5] space-y-6 shadow-xs ${
                mobileFilterOpen
                  ? 'w-full max-w-sm h-full overflow-y-auto p-6 rounded-none animate-in slide-in-from-right'
                  : 'p-6 sticky top-28'
              }`}
            >
              {/* Header inside sidebar */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E7DFD5]">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#C8851A]" />
                  <span className="font-serif font-bold text-base text-[#1C1917]">Refine Menu</span>
                </div>
                <div className="flex items-center gap-2">
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={resetFilters}
                      className="text-xs font-bold text-[#D95338] hover:underline"
                    >
                      Reset
                    </button>
                  )}
                  {mobileFilterOpen && (
                    <button onClick={() => setMobileFilterOpen(false)} className="text-[#78716C] hover:text-black">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 1. Sort by */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                  Sort by
                </h3>
                <div className="space-y-2 text-xs">
                  {[
                    { id: 'recommended', label: 'Recommended' },
                    { id: 'price_asc', label: 'Price: low to high' },
                    { id: 'price_desc', label: 'Price: high to low' },
                    { id: 'rating_desc', label: 'Highest Rated (5★ first)' },
                    { id: 'popular_desc', label: 'Most Popular (Orders)' }
                  ].map((opt) => (
                    <label key={opt.id} className="flex items-center gap-2.5 cursor-pointer text-[#44403C] hover:text-[#1C1917]">
                      <input
                        type="radio"
                        name="sortBy"
                        checked={sortBy === opt.id}
                        onChange={() => setSortBy(opt.id as any)}
                        className="w-4 h-4 text-[#C8851A] focus:ring-[#C8851A] accent-[#C8851A]"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 2. Available to order Toggle Switch */}
              <div className="pt-4 border-t border-[#E7DFD5]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-[#1C1917] block">Available to order</span>
                    <span className="text-[10px] text-[#78716C]">In stock for immediate kitchen fulfillment</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAvailableToOrder(!availableToOrder)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      availableToOrder ? 'bg-[#1C1917]' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        availableToOrder ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 3. Price Tier Filter */}
              <div className="pt-4 border-t border-[#E7DFD5] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                  Price Range
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: 'under_8', label: 'Under $8' },
                    { id: '8_to_12', label: '$8 - $12' },
                    { id: 'over_12', label: '$12+' }
                  ].map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setPriceTier(tier.id as any)}
                      className={`py-1.5 px-2.5 rounded-xl border text-center text-[11px] font-semibold transition-all ${
                        priceTier === tier.id
                          ? 'bg-[#1C1917] text-white border-[#1C1917]'
                          : 'bg-white text-[#44403C] border-[#E7DFD5] hover:bg-[#FAF4E8]'
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Dietary Checkboxes */}
              <div className="pt-4 border-t border-[#E7DFD5] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                  Dietary & Lifestyle
                </h3>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2.5 cursor-pointer text-[#44403C] hover:text-[#1C1917]">
                    <input
                      type="checkbox"
                      checked={dietaryFilters.vegetarian}
                      onChange={(e) =>
                        setDietaryFilters({ ...dietaryFilters, vegetarian: e.target.checked })
                      }
                      className="w-4 h-4 rounded-sm text-[#C8851A] focus:ring-[#C8851A] accent-[#C8851A]"
                    />
                    <span>Vegetarian</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-[#44403C] hover:text-[#1C1917]">
                    <input
                      type="checkbox"
                      checked={dietaryFilters.vegan}
                      onChange={(e) =>
                        setDietaryFilters({ ...dietaryFilters, vegan: e.target.checked })
                      }
                      className="w-4 h-4 rounded-sm text-[#C8851A] focus:ring-[#C8851A] accent-[#C8851A]"
                    />
                    <span>Vegan</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-[#44403C] hover:text-[#1C1917]">
                    <input
                      type="checkbox"
                      checked={dietaryFilters.jain}
                      onChange={(e) =>
                        setDietaryFilters({ ...dietaryFilters, jain: e.target.checked })
                      }
                      className="w-4 h-4 rounded-sm text-[#C8851A] focus:ring-[#C8851A] accent-[#C8851A]"
                    />
                    <span>Jain (No Onion & Garlic)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-[#44403C] hover:text-[#1C1917]">
                    <input
                      type="checkbox"
                      checked={dietaryFilters.glutenFree}
                      onChange={(e) =>
                        setDietaryFilters({ ...dietaryFilters, glutenFree: e.target.checked })
                      }
                      className="w-4 h-4 rounded-sm text-[#C8851A] focus:ring-[#C8851A] accent-[#C8851A]"
                    />
                    <span>Gluten-Free</span>
                  </label>
                </div>
              </div>

              {/* 5. Heat / Spice Scale */}
              <div className="pt-4 border-t border-[#E7DFD5] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                  Spice Level
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'all', label: 'All Levels' },
                    { id: 'MILD', label: 'Mild 🟢' },
                    { id: 'MEDIUM', label: 'Medium 🟡' },
                    { id: 'SPICY', label: 'Spicy 🔴' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSpiceFilter(s.id as any)}
                      className={`py-1.5 px-2 rounded-xl border text-center text-[11px] font-semibold transition-all ${
                        spiceFilter === s.id
                          ? 'bg-[#1C1917] text-white border-[#1C1917]'
                          : 'bg-white text-[#44403C] border-[#E7DFD5] hover:bg-[#FAF4E8]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Preservation / Freshness Type */}
              <div className="pt-4 border-t border-[#E7DFD5] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                  Preservation & Freshness
                </h3>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2.5 cursor-pointer text-[#44403C] hover:text-[#1C1917]">
                    <input
                      type="radio"
                      name="preservation"
                      checked={preservationFilter === 'all'}
                      onChange={() => setPreservationFilter('all')}
                      className="w-4 h-4 text-[#C8851A] accent-[#C8851A]"
                    />
                    <span>All Items</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-[#44403C] hover:text-[#1C1917]">
                    <input
                      type="radio"
                      name="preservation"
                      checked={preservationFilter === 'blast_chilled'}
                      onChange={() => setPreservationFilter('blast_chilled')}
                      className="w-4 h-4 text-[#C8851A] accent-[#C8851A]"
                    />
                    <span>Blast-Chilled (38°F Ready to Heat)</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-[#44403C] hover:text-[#1C1917]">
                    <input
                      type="radio"
                      name="preservation"
                      checked={preservationFilter === 'batter'}
                      onChange={() => setPreservationFilter('batter')}
                      className="w-4 h-4 text-[#C8851A] accent-[#C8851A]"
                    />
                    <span>Stone-Ground Fresh Batters</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-[#44403C] hover:text-[#1C1917]">
                    <input
                      type="radio"
                      name="preservation"
                      checked={preservationFilter === 'pantry'}
                      onChange={() => setPreservationFilter('pantry')}
                      className="w-4 h-4 text-[#C8851A] accent-[#C8851A]"
                    />
                    <span>Pantry & Podi (Ambient)</span>
                  </label>
                </div>
              </div>

              {/* 7. Tags with Item Counts */}
              <div className="pt-4 border-t border-[#E7DFD5] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716C]">
                  Tags
                </h3>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between cursor-pointer text-[#44403C] hover:text-[#1C1917]">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={regionalTags.southIndian}
                        onChange={(e) =>
                          setRegionalTags({ ...regionalTags, southIndian: e.target.checked })
                        }
                        className="w-4 h-4 rounded-sm text-[#C8851A] focus:ring-[#C8851A] accent-[#C8851A]"
                      />
                      <span>South Indian</span>
                    </div>
                    <span className="text-[11px] text-[#A8A29E] font-medium">{southIndianCount}</span>
                  </label>

                  {northIndianCount > 0 && (
                    <label className="flex items-center justify-between cursor-pointer text-[#44403C] hover:text-[#1C1917]">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={regionalTags.northIndian}
                          onChange={(e) =>
                            setRegionalTags({ ...regionalTags, northIndian: e.target.checked })
                          }
                          className="w-4 h-4 rounded-sm text-[#C8851A] focus:ring-[#C8851A] accent-[#C8851A]"
                        />
                        <span>North Indian</span>
                      </div>
                      <span className="text-[11px] text-[#A8A29E] font-medium">{northIndianCount}</span>
                    </label>
                  )}
                </div>
              </div>

              {mobileFilterOpen && (
                <div className="pt-4 border-t border-[#E7DFD5]">
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="w-full py-2.5 bg-[#D95338] text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Apply Filters ({filteredDishes.length} Results)
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* Right Product Grid / List */}
          <section className="md:col-span-3" aria-label="Dishes list">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-3/4 rounded-2xl bg-white animate-pulse border border-[#E7DFD5]"
                  />
                ))}
              </div>
            ) : filteredDishes.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E7DFD5] p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#FAF4E8] text-3xl flex items-center justify-center mx-auto shadow-2xs">
                  🍲
                </div>
                <h3 className="font-serif font-bold text-lg text-[#1C1917]">
                  No dishes match the selected filters
                </h3>
                <p className="text-xs text-[#78716C] max-w-sm mx-auto leading-relaxed">
                  Try clearing your dietary, price or heat filters to view more authentic culinary creations.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 bg-[#1C1917] text-white text-xs font-bold rounded-full hover:bg-neutral-800 transition-colors shadow-xs"
                >
                  Reset all filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredDishes.map((dish) => (
                  <DishCard key={dish.id} dish={dish} viewMode="grid" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDishes.map((dish) => (
                  <DishCard key={dish.id} dish={dish} viewMode="list" />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
