'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useTheme } from '@/context/ThemeContext';
import { MapPin, Search, ShoppingBag, Globe, Sun, Moon, User as UserIcon, X } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const { itemCount, openCart } = useCart();
  const { user, logout } = useAuth();
  const { location, openModal } = useLocation();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileSearchOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-muted/95 backdrop-blur-md border-b border-border shadow-xs transition-colors duration-200">
        <div className="max-w-7xl 3xl:max-w-ultrawide mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink min-w-0 group" aria-label="Mylapore Express Home">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-transparent flex items-center justify-center overflow-hidden shrink-0 transition-transform group-hover:scale-105">
                <img
                  src="/images/logo.png"
                  alt="Mylapore Express Emblem"
                  className="w-full h-full object-contain filter drop-shadow-xs"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-serif font-bold text-lg sm:text-2xl tracking-tight text-foreground leading-none truncate">
                  Mylapore Express
                </span>
                <span className="text-[9px] sm:text-[10px] tracking-widest uppercase font-semibold text-accent mt-0.5 truncate">
                  Authentic South Indian
                </span>
              </div>
            </Link>

            {/* Deliver to Location button */}
            <button
              onClick={openModal}
              className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-surface/80 hover:bg-surface text-xs font-medium text-foreground transition-all cursor-pointer shadow-2xs hover:border-accent"
              aria-label="Set delivery location"
            >
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Deliver to</span>
                <span className="text-xs font-semibold truncate max-w-[140px] text-foreground">
                  {location.city}, {location.state} {location.zipCode}
                </span>
              </div>
            </button>

            {/* Desktop Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:block">
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-surface border border-border rounded-full text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent placeholder:text-muted-foreground transition-all"
                />
              </div>
            </form>

            {/* Actions / Nav Right */}
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              {/* Mobile Search Toggle */}
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="sm:hidden p-2.5 text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-surface"
                aria-label="Toggle search input"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
                aria-label={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
                className="p-2.5 text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-surface cursor-pointer"
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="w-4 h-4 text-accent transition-transform duration-300 rotate-0 hover:rotate-45" />
                ) : (
                  <Moon className="w-4 h-4 text-muted-foreground hover:text-foreground transition-transform duration-300" />
                )}
              </button>

              {/* Cart Button */}
              <button
                onClick={openCart}
                className="relative p-2.5 text-foreground hover:text-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-surface cursor-pointer"
                title="View Cart"
                aria-label={`View Cart, ${itemCount} items`}
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary text-primary-foreground text-[11px] font-bold rounded-full flex items-center justify-center shadow-xs">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* My Orders */}
              <Link
                href="/orders"
                className="hidden lg:inline-flex items-center px-3 py-2 text-xs font-semibold text-foreground hover:text-accent rounded-xl hover:bg-surface transition-colors min-h-[44px]"
              >
                My Orders
              </Link>

              {/* Admin Portal link for staff */}
              {user && ['SUPER_ADMIN', 'RESTAURANT_ADMIN', 'KITCHEN_MANAGER'].includes(user.role) && (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 bg-foreground text-background text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
                >
                  Kitchen KDS
                </Link>
              )}

              {/* Auth Buttons */}
              {user ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-accent p-2 rounded-xl hover:bg-surface min-h-[44px]"
                    title="Profile"
                  >
                    <UserIcon className="w-4 h-4 text-foreground" />
                    <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="text-xs text-muted-foreground hover:text-primary font-medium hidden sm:inline-block px-2 py-2 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link
                    href="/auth/login"
                    className="text-xs font-semibold text-foreground hover:text-accent transition-colors px-3 py-2 rounded-xl hover:bg-surface flex items-center gap-1 min-h-[44px]"
                    title="Sign In"
                  >
                    <UserIcon className="w-4 h-4 sm:hidden text-foreground" />
                    <span className="hidden sm:inline">Sign In</span>
                  </Link>
                  <Link
                    href="/auth/register"
                    className="hidden sm:inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-full shadow-xs transition-all active:scale-[0.98] shrink-0 min-h-[38px]"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Expandable Mobile Search Bar */}
          {mobileSearchOpen && (
            <div className="sm:hidden pb-4 pt-1 animate-in fade-in slide-in-from-top-2">
              <form onSubmit={handleSearch} className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search dishes, sweets, batters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-surface border border-border rounded-full text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen(false)}
                  className="p-2 text-muted-foreground hover:text-foreground absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
