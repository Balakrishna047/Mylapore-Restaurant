'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-surface-muted border-t border-border pt-14 pb-8 text-muted-foreground transition-colors duration-200">
      <div className="max-w-7xl 3xl:max-w-ultrawide mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8 pb-12 border-b border-border items-start">
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
              <span className="font-serif font-bold text-xl text-foreground">
                Mylapore Express
              </span>
            </Link>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              Fresh from Mylapore, delivered with care. Blast-chilled authentic South Indian vegetarian comfort food prepared with grandmother recipes and zero chemical preservatives.
            </p>
            <div className="space-y-1.5 text-xs text-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-accent" />
                <a href="mailto:support@mylaporeexpress.com" className="hover:text-primary transition-colors">
                  support@mylaporeexpress.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-accent" />
                <a href="tel:9252383736" className="hover:text-primary transition-colors">
                  (925) 238-3736
                </a>
              </div>
            </div>
          </div>

          {/* SHOP Column */}
          <div>
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-foreground mb-4">
              SHOP
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/" className="hover:text-primary transition-colors">Shop All</Link></li>
              <li><Link href="/category/curries" className="hover:text-primary transition-colors">Curries & Kootu</Link></li>
              <li><Link href="/category/rice" className="hover:text-primary transition-colors">Rice Varieties</Link></li>
              <li><Link href="/category/beverages" className="hover:text-primary transition-colors">Beverages</Link></li>
              <li><Link href="/category/batters" className="hover:text-primary transition-colors">Batters & Tiffin</Link></li>
              <li><Link href="/orders" className="hover:text-primary transition-colors">Track Order</Link></li>
            </ul>
          </div>

          {/* SUPPORT Column */}
          <div>
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-foreground mb-4">
              SUPPORT
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/support" className="hover:text-primary transition-colors">Help Center & Agent</Link></li>
              <li><Link href="/orders" className="hover:text-primary transition-colors">Order Status</Link></li>
              <li><Link href="/support" className="hover:text-primary transition-colors">Cancellation & Reschedule</Link></li>
              <li><Link href="/support" className="hover:text-primary transition-colors">Refund Policies</Link></li>
            </ul>
          </div>

          {/* CULINARY PROMISE Column */}
          <div>
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-foreground mb-4">
              PROMISE
            </h4>
            <ul className="space-y-2 text-xs">
              <li><span className="text-foreground font-medium">38°F Blast Chilling</span></li>
              <li><span>Zero Preservatives</span></li>
              <li><span>Jain & Vegan Options</span></li>
              <li><span>Cold-Chain Packaging</span></li>
            </ul>
          </div>

          {/* HOURS Column */}
          <div>
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-foreground mb-4">
              KITCHEN HOURS
            </h4>
            <div className="space-y-1 text-xs">
              <p className="font-medium text-foreground">Monday – Sunday</p>
              <p className="text-muted-foreground">10:00 AM – 8:30 PM PST</p>
              <p className="pt-2 text-[11px] text-accent font-semibold">Same-Day & Scheduled Delivery Available</p>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>© {new Date().getFullYear()} Mylapore Express. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/" className="hover:text-primary transition-colors">Allergen Information</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
