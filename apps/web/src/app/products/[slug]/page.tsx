'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import {
  ChevronRight,
  Flame,
  Leaf,
  ShieldAlert,
  Snowflake,
  Info,
  ChevronDown,
  ChevronUp,
  Star,
  Plus,
  Minus,
  Check
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { addItem } = useCart();
  const [dish, setDish] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(undefined);
  const [selectedSpice, setSelectedSpice] = useState<string>('MEDIUM');
  const [showIngredients, setShowIngredients] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    async function loadItem() {
      try {
        setLoading(true);
        const data = await api.getMenuItem(slug);
        setDish(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0].id);
        }
        if (data.spiceLevel) {
          setSelectedSpice(data.spiceLevel);
        }
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-[#E7DFD5] w-64 rounded-sm" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-[#FAF4E8] rounded-2xl border border-[#E7DFD5]" />
            <div className="space-y-4">
              <div className="h-8 bg-[#E7DFD5] w-3/4 rounded-sm" />
              <div className="h-4 bg-[#E7DFD5] w-1/2 rounded-sm" />
              <div className="h-12 bg-[#E7DFD5] rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dish) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif font-bold text-2xl text-[#1C1917] mb-2">Dish not found</h2>
        <Link href="/" className="text-xs font-bold text-[#D95338] underline">
          Return to menu
        </Link>
      </div>
    );
  }

  const currentVariantObj = dish.variants?.find((v: any) => v.id === selectedVariant);
  const activePrice = currentVariantObj ? currentVariantObj.price : dish.basePrice;

  const handleAddToCart = () => {
    addItem({
      menuItemId: dish.id,
      quantity,
      variantId: selectedVariant,
      spiceLevel: selectedSpice
    });
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#FBF7F0] py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs matching PDF Screenshot */}
        <nav className="flex items-center gap-1.5 text-xs text-[#78716C] mb-8">
          <Link href="/" className="hover:text-[#1C1917]">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/" className="hover:text-[#1C1917]">Shop</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/?category=${dish.category?.slug || 'curries'}`} className="hover:text-[#1C1917]">
            {dish.categoryName || 'Categories'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#1C1917] font-semibold">{dish.name}</span>
        </nav>

        {/* 2-Column Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Left Column: Image & Grandmother Heritage Quote */}
          <div className="lg:col-span-6 space-y-6">
            <div className="relative rounded-2xl overflow-hidden border border-[#E7DFD5] bg-[#FAF4E8] shadow-sm aspect-[3/2]">
              <img
                src={dish.image}
                alt={dish.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/dishes/potato-kara-kari.webp';
                }}
                className="w-full h-full object-cover"
              />
              {dish.orderCountBadge && (
                <div className="absolute top-4 left-4 bg-[#1C1917]/85 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                  <span>📈</span>
                  <span>{dish.orderCountBadge}</span>
                </div>
              )}
            </div>

            {/* Quote directly from PDF screenshot 2 */}
            <div className="p-4 rounded-xl bg-[#FAF4E8] border border-[#E7DFD5] text-center">
              <p className="font-serif italic text-xs text-[#57534E] leading-relaxed">
                “Authentic South Indian flavors, made the way our grandmothers did.”
              </p>
              <span className="block text-[11px] font-bold text-[#C8851A] tracking-wider uppercase mt-1">
                Mylapore Express
              </span>
            </div>
          </div>

          {/* Right Column: Title, Customization, Badges, Allergens & Nutrition */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex justify-between items-start gap-4">
                <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#1C1917] tracking-tight">
                  {dish.name}
                </h1>
                <span className="font-serif font-bold text-2xl text-[#D95338] shrink-0">
                  ${(activePrice * quantity).toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-[#78716C] mt-1">
                {dish.description}
              </p>

              {/* Set delivery location for availability notice */}
              <div className="mt-2 text-xs text-[#D95338] font-medium flex items-center gap-1">
                <span>📍</span>
                <span>Set delivery location for availability</span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-2.5 py-1 bg-white border border-[#E7DFD5] text-[#57534E] text-[11px] font-semibold rounded-md">
                  South Indian
                </span>
                <span className="px-2.5 py-1 bg-white border border-[#E7DFD5] text-[#57534E] text-[11px] font-semibold rounded-md">
                  Goes with rice
                </span>
              </div>
            </div>

            {/* Portion / Variant Selector */}
            {dish.variants && dish.variants.length > 1 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">
                  Select Size
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {dish.variants.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v.id)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        selectedVariant === v.id
                          ? 'border-[#D95338] bg-[#D95338]/5 font-bold text-[#D95338]'
                          : 'border-[#E7DFD5] bg-white text-[#44403C] hover:border-[#C8851A]'
                      }`}
                    >
                      <div className="flex justify-between">
                        <span>{v.name}</span>
                        <span>${v.price.toFixed(2)}</span>
                      </div>
                      <span className="text-[10px] text-[#78716C] font-normal">Serves {v.servesCount}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart Button */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center border border-[#E7DFD5] rounded-xl bg-white px-2 py-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1.5 text-[#78716C] hover:text-black"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 font-bold text-sm text-[#1C1917]">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1.5 text-[#78716C] hover:text-black"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 py-3.5 px-6 bg-[#D95338] hover:bg-[#C84B31] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {addedNotice ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <span>Add to Cart</span>
                )}
              </button>
            </div>

            {/* Badges Bar directly from PDF Screenshot 2 */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E7DFD5]">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FAF4E8] border border-[#E7DFD5] text-[11px] font-semibold text-[#1C1917]">
                <Snowflake className="w-3 h-3 text-[#0284C7]" />
                <span>Blast chilled</span>
              </span>

              {dish.dietaryTags?.includes('VEGETARIAN') && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#15803D]/10 text-[11px] font-semibold text-[#15803D]">
                  <Leaf className="w-3 h-3" />
                  <span>Vegetarian</span>
                </span>
              )}

              {dish.dietaryTags?.includes('VEGAN') && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#15803D]/10 text-[11px] font-semibold text-[#15803D]">
                  <span>Vegan</span>
                </span>
              )}

              {dish.dietaryTags?.includes('JAIN') && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#D97706]/10 text-[11px] font-semibold text-[#D97706]">
                  <span>Jain</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#D95338]/10 text-[11px] font-semibold text-[#D95338]">
                <span>🌶️🌶️🌶️ {dish.spiceLevel || 'Hot'}</span>
              </span>
            </div>

            {/* Allergen Warning Box directly matching PDF Screenshot 2 */}
            <div className="p-4 rounded-xl bg-[#FAF4E8] border border-[#E7DFD5] text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#1C1917]">
                <ShieldAlert className="w-4 h-4 text-[#D97706]" />
                <span>Contains</span>
              </div>
              <div className="flex gap-2">
                {(dish.allergens && dish.allergens.length > 0 ? dish.allergens : ['Wheat', 'Sesame']).map((all: string) => (
                  <span key={all} className="px-2 py-0.5 rounded bg-white border border-[#E7DFD5] text-[11px] font-medium text-[#44403C]">
                    {all}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-[#78716C] leading-relaxed">
                Allergens come from our recipes. Our kitchen also handles milk, tree nuts, peanuts, wheat and sesame, so please ask us about allergies.
              </p>
            </div>

            {/* Collapsible Accordions: Ingredients & Nutrition */}
            <div className="border-t border-[#E7DFD5] divide-y divide-[#E7DFD5]">
              {/* Ingredients */}
              <div className="py-3">
                <button
                  onClick={() => setShowIngredients(!showIngredients)}
                  className="w-full flex justify-between items-center text-xs font-bold text-[#1C1917] hover:text-[#D95338]"
                >
                  <span className="flex items-center gap-2">
                    <span>🥣</span> Ingredients
                  </span>
                  {showIngredients ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showIngredients && (
                  <div className="pt-2 text-xs text-[#57534E] leading-relaxed">
                    {dish.ingredients && dish.ingredients.length > 0
                      ? dish.ingredients.join(', ')
                      : 'Potatoes, Cold-pressed Sesame Oil, Mustard Seeds, Curry Leaves, Red Chili Powder, Asafoetida, Himalayan Pink Salt, Turmeric.'}
                  </div>
                )}
              </div>

              {/* Nutrition per serving */}
              <div className="py-3">
                <button
                  onClick={() => setShowNutrition(!showNutrition)}
                  className="w-full flex justify-between items-center text-xs font-bold text-[#1C1917] hover:text-[#D95338]"
                >
                  <span className="flex items-center gap-2">
                    <span>📊</span> Nutrition per serving {dish.nutritionServing || '1/2 cup (80 g)'}
                  </span>
                  {showNutrition ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showNutrition && (
                  <div className="pt-2 text-xs text-[#57534E] space-y-1">
                    <div className="flex justify-between border-b border-[#E7DFD5] pb-1">
                      <span>Calories</span>
                      <span className="font-bold">140 kcal</span>
                    </div>
                    <div className="flex justify-between border-b border-[#E7DFD5] pb-1">
                      <span>Total Fat</span>
                      <span>6g (8% DV)</span>
                    </div>
                    <div className="flex justify-between border-b border-[#E7DFD5] pb-1">
                      <span>Carbohydrates</span>
                      <span>20g (7% DV)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Protein</span>
                      <span>3g</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notice Card: Freshly Cooked & Blast Chilled */}
            <div className="p-3.5 rounded-xl bg-white border border-[#E7DFD5] text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#15803D]">
                <span>✨</span>
                <span>Freshly cooked and blast chilled</span>
              </div>
              <p className="text-[11px] text-[#78716C] leading-relaxed">
                No preservatives added. Keep it refrigerated at or below 40°F (4°C), reheat it thoroughly before eating, and eat it right after reheating.
              </p>
            </div>

            {/* Disclaimer from PDF Screenshot */}
            <div className="text-[11px] text-[#A8A29E] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Nutrition values are estimates for a typical serving, not laboratory tested.</span>
            </div>

            {/* Customer Reviews Section matching PDF Screenshot */}
            <div className="pt-6 border-t border-[#E7DFD5] space-y-4">
              <h3 className="font-serif font-bold text-base text-[#1C1917]">
                Customer Reviews
              </h3>
              <div className="flex items-center gap-2 text-xs text-[#78716C]">
                <div className="flex text-[#D97706]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="font-bold text-[#1C1917]">{dish.rating || 5.0}</span>
                <span>({dish.reviewCount || 0} reviews)</span>
              </div>

              <div className="p-4 rounded-xl border border-dashed border-[#E7DFD5] bg-[#FAF4E8]/50 text-center text-xs text-[#78716C]">
                <p className="mb-2">Sign in to leave a review for this product</p>
                <Link
                  href="/auth/login"
                  className="inline-block px-4 py-1.5 bg-[#1C1917] text-white font-bold rounded-lg hover:bg-neutral-800 text-[11px]"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
