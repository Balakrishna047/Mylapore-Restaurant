'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { MapPin, Search, ShoppingBag, Globe, Sun, User as UserIcon, X } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const { itemCount, openCart } = useCart();
  const { user, logout } = useAuth();
  const { location, openModal } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF4E8]/95 backdrop-blur-md border-b border-[#E7DFD5] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-11 h-11 rounded-xl bg-transparent flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                <img
                  src="/images/logo.png"
                  alt="Mylapore Express Emblem"
                  className="w-full h-full object-contain filter drop-shadow-xs"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-xl sm:text-2xl tracking-tight text-[#1C1917] leading-none">
                  Mylapore Express
                </span>
                <span className="text-[10px] tracking-widest uppercase font-semibold text-[#C8851A] mt-0.5">
                  Authentic South Indian
                </span>
              </div>
            </Link>

            {/* Deliver to Location button */}
            <button
              onClick={openModal}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E7DFD5] bg-white/70 hover:bg-white text-xs font-medium text-[#1C1917] transition-all cursor-pointer shadow-2xs"
            >
              <MapPin className="w-3.5 h-3.5 text-[#D95338]" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] text-[#78716C] uppercase font-bold tracking-wider">Deliver to</span>
                <span className="text-xs font-semibold truncate max-w-[140px]">{location.city}, {location.state} {location.zipCode}</span>
              </div>
            </button>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:block">
              <div className="relative">
                <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[#E7DFD5] rounded-full focus:outline-hidden focus:border-[#C8851A] focus:ring-1 focus:ring-[#C8851A] placeholder:text-[#A8A29E] transition-all"
                />
              </div>
            </form>

            {/* Actions / Nav Right */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              {/* Language Icon */}
              <button title="Change Language" className="p-2 text-[#78716C] hover:text-[#1C1917] transition-colors">
                <Globe className="w-4 h-4" />
              </button>

              {/* Theme Toggle Icon */}
              <button title="Toggle Theme" className="p-2 text-[#78716C] hover:text-[#1C1917] transition-colors">
                <Sun className="w-4 h-4" />
              </button>

              {/* Cart Button */}
              <button
                onClick={openCart}
                className="relative p-2 text-[#1C1917] hover:text-[#D95338] transition-colors"
                title="View Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D95338] text-white text-[11px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* My Orders */}
              <Link
                href="/orders"
                className="hidden lg:inline-block text-xs font-semibold text-[#1C1917] hover:text-[#C8851A] transition-colors"
              >
                My Orders
              </Link>

              {/* Admin Portal link for staff */}
              {user && ['SUPER_ADMIN', 'RESTAURANT_ADMIN', 'KITCHEN_MANAGER'].includes(user.role) && (
                <Link
                  href="/admin"
                  className="px-2.5 py-1 bg-[#1C1917] text-white text-xs font-bold rounded-md hover:bg-neutral-800 transition-colors"
                >
                  Kitchen KDS
                </Link>
              )}

              {/* Auth Buttons */}
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#1C1917] hover:text-[#C8851A]"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="text-xs text-[#78716C] hover:text-[#D95338] font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="text-xs font-semibold text-[#1C1917] hover:text-[#C8851A] transition-colors px-2 py-1"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 bg-[#D95338] hover:bg-[#C84B31] text-white text-xs font-bold rounded-full shadow-xs transition-colors"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
