'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#FAF4E8] border-t border-[#E7DFD5] pt-14 pb-8 text-[#44403C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8 pb-12 border-b border-[#E7DFD5] items-start">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
                <img
                  src="/images/logo.png"
                  alt="Mylapore Express Emblem"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-serif font-bold text-xl text-[#1C1917]">
                Mylapore Express
              </span>
            </Link>
            <p className="text-xs text-[#78716C] max-w-sm leading-relaxed">
              Fresh from Mylapore, delivered with care. Blast-chilled authentic South Indian vegetarian comfort food prepared with grandmother recipes and zero chemical preservatives.
            </p>
            <div className="space-y-1.5 text-xs text-[#57534E]">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#C8851A]" />
                <a href="mailto:support@mylaporeexpress.com" className="hover:text-[#D95338]">
                  support@mylaporeexpress.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#C8851A]" />
                <a href="tel:9252383736" className="hover:text-[#D95338]">
                  (925) 238-3736
                </a>
              </div>
            </div>
          </div>

          {/* SHOP Column */}
          <div>
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#1C1917] mb-4">
              SHOP
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/" className="hover:text-[#D95338]">Shop All</Link></li>
              <li><Link href="/category/curries" className="hover:text-[#D95338]">Curries & Kootu</Link></li>
              <li><Link href="/category/rice" className="hover:text-[#D95338]">Rice Varieties</Link></li>
              <li><Link href="/category/beverages" className="hover:text-[#D95338]">Beverages</Link></li>
              <li><Link href="/category/batters" className="hover:text-[#D95338]">Batters & Tiffin</Link></li>
              <li><Link href="/orders" className="hover:text-[#D95338]">Track Order</Link></li>
            </ul>
          </div>

          {/* SUPPORT Column */}
          <div>
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#1C1917] mb-4">
              SUPPORT
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/auth/login" className="hover:text-[#D95338]">Welcome Back</Link></li>
              <li><Link href="/support" className="hover:text-[#D95338]">Contact Us</Link></li>
              <li><Link href="/support" className="hover:text-[#D95338]">FAQs & Help</Link></li>
            </ul>
          </div>

          {/* LEGAL Column */}
          <div>
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#1C1917] mb-4">
              LEGAL
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/privacy" className="hover:text-[#D95338]">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-[#D95338]">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-[#D95338]">Cookie Policy</Link></li>
              <li><span className="text-[#A8A29E] cursor-pointer hover:text-[#57534E]">Cookie Settings</span></li>
            </ul>
          </div>

          {/* Gopuram / Temple Tower Watermark Backdrop matching PDF Screenshot */}
          <div className="hidden lg:flex items-center justify-center opacity-80 pt-1 pointer-events-none select-none">
            <img
              src="/images/temple-watermark.jpg"
              alt="Mylapore Temple Gopuram"
              className="h-44 w-auto object-contain mix-blend-multiply filter contrast-125 saturate-150"
            />
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-[#A8A29E] gap-4">
          <p>© 2026 Mylapore Express. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span>Authentic South Indian Heritage</span>
            <span>·</span>
            <span>Blast-Chilled Freshness</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
