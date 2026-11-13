'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ChevronRight,
  Leaf,
  ShieldAlert,
  Snowflake,
  Info,
  ChevronDown,
  ChevronUp,
  Star,
  Plus,
  Minus,
  Check,
  MapPin,
} from 'lucide-react';
import { MenuItemDto } from '@mylapore/shared-types';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { addItem, openCart } = useCart();
  const toast = useToast();
  const [dish, setDish] = useState<MenuItemDto | null>(null);
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
      <div className="max-w-7xl 3xl:max-w-ultrawide mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-surface-muted w-64 rounded-sm" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-surface-muted rounded-2xl border border-border" />
            <div className="space-y-4">
              <div className="h-8 bg-surface-muted w-3/4 rounded-sm" />
              <div className="h-4 bg-surface-muted w-1/2 rounded-sm" />
              <div className="h-12 bg-surface-muted rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dish) {
    return (
      <div className="max-w-7xl 3xl:max-w-ultrawide mx-auto px-4 py-20 text-center">
        <h2 className="font-serif font-bold text-2xl text-foreground mb-2">Dish not found</h2>
        <Link href="/" className="text-xs font-bold text-primary underline">
          Return to menu
        </Link>
      </div>
    );
  }

  const currentVariantObj = dish.variants?.find((v: any) => v.id === selectedVariant);
  const activePrice = currentVariantObj ? currentVariantObj.price : dish.basePrice;

  const handleAddToCart = async () => {
    try {
      await addItem({
        menuItemId: dish.id || dish.slug,
        quantity,
        variantId: selectedVariant,
        spiceLevel: selectedSpice as any,
      });
      setAddedNotice(true);
      openCart();
      toast.success('Added to Cart', `${dish.name} added to your order.`);
      setTimeout(() => setAddedNotice(false), 2500);
    } catch {
      toast.error('Failed to add item', 'Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background py-6 sm:py-10 transition-colors duration-200">
      <div className="max-w-7xl 3xl:max-w-ultrawide mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-8 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link href="/" className="hover:text-foreground">Shop</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link href={dish.categoryName ? `/category/${dish.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : '/'} className="hover:text-foreground">
            {dish.categoryName || 'Categories'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-foreground font-semibold truncate">{dish.name}</span>
        </nav>

        {/* 2-Column Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          {/* Left Column: Image & Grandmother Heritage Quote */}
          <div className="lg:col-span-6 space-y-6">
            <div className="relative rounded-2xl overflow-hidden border border-border bg-surface-muted shadow-sm aspect-[3/2] lg:sticky lg:top-28">
              <img
                src={dish.image}
                alt={dish.name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/placeholder-dish.svg';
                }}
                className="w-full h-full object-cover"
              />
              {dish.orderCountBadge && (
                <div className="absolute top-4 left-4 bg-foreground/85 backdrop-blur-xs text-background text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                  <span>📈</span>
                  <span>{dish.orderCountBadge}</span>
                </div>
              )}
            </div>

            {/* Heritage Quote */}
            <div className="p-4 rounded-xl bg-surface-muted border border-border text-center">
              <p className="font-serif italic text-xs text-muted-foreground leading-relaxed">
                “Authentic South Indian flavors, made the way our grandmothers did.”
              </p>
              <span className="block text-[11px] font-bold text-accent tracking-wider uppercase mt-1">
                Mylapore Express
              </span>
            </div>
          </div>

          {/* Right Column: Title, Customization, Badges, Allergens & Nutrition */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex justify-between items-start gap-4">
                <h1 className="font-serif font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
                  {dish.name}
                </h1>
                <span className="font-serif font-bold text-2xl text-primary shrink-0">
                  ${(activePrice * quantity).toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {dish.description}
              </p>

              {/* Set delivery location notice */}
              <div className="mt-2 text-xs text-primary font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Blast-chilled delivery to Bay Area locations</span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" size="sm">South Indian</Badge>
                <Badge variant="outline" size="sm">Goes with rice</Badge>
              </div>
            </div>

            {/* Portion / Variant Selector */}
            {dish.variants && dish.variants.length > 1 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Select Size
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {dish.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v.id)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        selectedVariant === v.id
                          ? 'border-primary bg-primary/10 font-bold text-primary ring-1 ring-primary'
                          : 'border-border bg-surface text-foreground hover:border-accent'
                      }`}
                    >
                      <div className="flex justify-between">
                        <span>{v.name}</span>
                        <span>${v.price.toFixed(2)}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-normal">Serves {v.servesCount}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Spice Level Selector */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Spice Level
                </label>
                <span className="text-[11px] font-semibold text-primary">
                  {selectedSpice === 'MILD' && '🌶️ Mild (Subtle & gentle)'}
                  {selectedSpice === 'MEDIUM' && '🌶️🌶️ Medium (Authentic South Indian)'}
                  {selectedSpice === 'HOT' && '🌶️🌶️🌶️ Hot (Traditional heat)'}
                  {selectedSpice === 'EXTRA_HOT' && '🔥 Extra Hot (Chettinad fiery)'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { level: 'MILD', label: 'Mild', icon: '🌶️' },
                  { level: 'MEDIUM', label: 'Medium', icon: '🌶️🌶️' },
                  { level: 'HOT', label: 'Hot', icon: '🌶️🌶️🌶️' },
                  { level: 'EXTRA_HOT', label: 'Extra', icon: '🔥' },
                ].map(({ level, label, icon }) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSelectedSpice(level)}
                    className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      selectedSpice === level
                        ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                        : 'border-border bg-surface text-foreground hover:border-accent'
                    }`}
                  >
                    <span className="block text-xs">{label}</span>
                    <span className="block text-[10px] text-muted-foreground mt-0.5">{icon}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity and Add to Cart Button */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center border border-border rounded-xl bg-surface px-2 py-1 min-h-[44px]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1.5 text-muted-foreground hover:text-foreground cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 font-bold text-sm text-foreground select-none">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1.5 text-muted-foreground hover:text-foreground cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <Button
                onClick={handleAddToCart}
                variant="primary"
                size="lg"
                className="flex-1 text-xs uppercase tracking-wider font-bold"
                leftIcon={addedNotice ? <Check className="w-4 h-4" /> : undefined}
              >
                {addedNotice ? 'Added to Cart!' : 'Add to Cart'}
              </Button>
            </div>

            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-muted border border-border text-[11px] font-semibold text-foreground">
                <Snowflake className="w-3 h-3 text-sky-500" />
                <span>Blast chilled</span>
              </span>

              {dish.dietaryTags?.includes('VEGETARIAN' as any) && (
                <Badge variant="success" size="sm">
                  <Leaf className="w-3 h-3 mr-1" /> Vegetarian
                </Badge>
              )}

              {dish.dietaryTags?.includes('VEGAN' as any) && (
                <Badge variant="success" size="sm">Vegan</Badge>
              )}

              {dish.dietaryTags?.includes('JAIN' as any) && (
                <Badge variant="warning" size="sm">Jain</Badge>
              )}

              <Badge variant="destructive" size="sm">
                🌶️ {selectedSpice.replace('_', ' ')}
              </Badge>
            </div>

            {/* Allergen Warning Box */}
            <div className="p-4 rounded-xl bg-surface-muted border border-border text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <ShieldAlert className="w-4 h-4 text-warning" />
                <span>Contains</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(dish.allergens && dish.allergens.length > 0 ? dish.allergens : ['Wheat', 'Sesame']).map((all: string) => (
                  <span key={all} className="px-2 py-0.5 rounded bg-surface border border-border text-[11px] font-medium text-foreground">
                    {all}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Allergens come from authentic traditional recipes. Kitchen handles milk, tree nuts, peanuts, wheat and sesame.
              </p>
            </div>

            {/* Collapsible Accordions: Ingredients & Nutrition */}
            <div className="border-t border-border divide-y divide-border">
              {/* Ingredients */}
              <div className="py-3">
                <button
                  onClick={() => setShowIngredients(!showIngredients)}
                  className="w-full flex justify-between items-center text-xs font-bold text-foreground hover:text-primary cursor-pointer min-h-[38px]"
                >
                  <span className="flex items-center gap-2">
                    <span>🥣</span> Ingredients
                  </span>
                  {showIngredients ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showIngredients && (
                  <div className="pt-2 text-xs text-muted-foreground leading-relaxed animate-in fade-in">
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
                  className="w-full flex justify-between items-center text-xs font-bold text-foreground hover:text-primary cursor-pointer min-h-[38px]"
                >
                  <span className="flex items-center gap-2">
                    <span>📊</span> Nutrition per serving {dish.nutritionServing || '1/2 cup (80 g)'}
                  </span>
                  {showNutrition ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showNutrition && (
                  <div className="pt-2 text-xs text-muted-foreground space-y-1 animate-in fade-in">
                    <div className="flex justify-between border-b border-border pb-1">
                      <span>Calories</span>
                      <span className="font-bold text-foreground">140 kcal</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-1">
                      <span>Total Fat</span>
                      <span className="font-bold text-foreground">6g (8% DV)</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-1">
                      <span>Carbohydrates</span>
                      <span className="font-bold text-foreground">20g (7% DV)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Protein</span>
                      <span className="font-bold text-foreground">3g</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Freshly Cooked & Blast Chilled Callout */}
            <div className="p-3.5 rounded-xl bg-surface border border-border text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-success">
                <span>✨</span>
                <span>Freshly cooked and blast chilled</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                No preservatives added. Keep refrigerated at or below 40°F (4°C), reheat thoroughly before enjoying.
              </p>
            </div>

            {/* Disclaimer */}
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Nutrition values are estimates for typical servings, not laboratory tested.</span>
            </div>

            {/* Customer Reviews Section */}
            <div className="pt-6 border-t border-border space-y-4">
              <h3 className="font-serif font-bold text-base text-foreground">
                Customer Reviews
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex text-warning">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="font-bold text-foreground">{dish.rating || 5.0}</span>
                <span>({dish.reviewCount || 0} reviews)</span>
              </div>

              <div className="p-4 rounded-xl border border-dashed border-border bg-surface-muted/50 text-center text-xs text-muted-foreground">
                <p className="mb-2">Sign in to leave a review for this dish</p>
                <Link
                  href="/auth/login"
                  className="inline-block px-4 py-1.5 bg-foreground text-background font-bold rounded-lg hover:opacity-90 text-[11px]"
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
